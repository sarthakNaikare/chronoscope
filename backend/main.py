import os
import asyncpg
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/chronoscope")
pool: asyncpg.Pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
    yield
    await pool.close()

app = FastAPI(title="Chronoscope API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_conn():
    async with pool.acquire() as conn:
        yield conn

from routes.events  import router as events_router
from routes.chunks  import router as chunks_router
from routes.explain import router as explain_router
from routes.inject  import router as inject_router

app.include_router(events_router)
app.include_router(chunks_router)
app.include_router(explain_router)
app.include_router(inject_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
