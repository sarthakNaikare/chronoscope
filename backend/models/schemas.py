from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChronoEvent(BaseModel):
    id: int
    detected_at: datetime
    device_id: str
    event_start: datetime
    gap_magnitude: float
    gap_pct: float
    severity: str
    implicated_chunks: Optional[list[str]] = []
    chunk_health_score: Optional[int] = None
    resolved_at: Optional[datetime] = None

class ShadowRow(BaseModel):
    bucket: datetime
    actual_val: float
    projected_val: float
    gap: float

class InjectRequest(BaseModel):
    device_id: str = "device_3"
    magnitude: float = 20.0
    duration_minutes: int = 30
