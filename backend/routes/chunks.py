from fastapi import APIRouter, Depends
import asyncpg
from ..main import get_conn
from ..engine.chunk_autopsy import get_chunk_signals

router = APIRouter(prefix="/chunks", tags=["chunks"])

@router.get("")
async def list_chunks(conn: asyncpg.Connection = Depends(get_conn)):
    return await get_chunk_signals(conn)

@router.get("/{chunk_name}")
async def chunk_detail(chunk_name: str, conn: asyncpg.Connection = Depends(get_conn)):
    results = await get_chunk_signals(conn, chunk_name=chunk_name)
    return results[0] if results else {}
