from fastapi import APIRouter
from pydantic import BaseModel
from ..engine.explain_parser import parse_explain

router = APIRouter(prefix="/explain", tags=["explain"])

class ExplainInput(BaseModel):
    text: str

@router.post("")
async def run_explain(body: ExplainInput):
    return parse_explain(body.text)
