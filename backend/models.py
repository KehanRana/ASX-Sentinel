from pydantic import BaseModel
from typing import List, Optional

class DetectedKPIs(BaseModel):
    revenue: Optional[str] = None
    earnings: Optional[str] = None
    growth_rate: Optional[str] = None
    guidance: Optional[str] = None
    other_metrics: Optional[List[str]] = None

class AIResponse(BaseModel):
    sentiment_score: int  # 0 to 100 for that "82" look
    sentiment_label: str  # e.g., "Strongly Bullish"
    summary: str
    bullish_factors: List[str]
    bearish_factors: List[str]
    risk_alert: str