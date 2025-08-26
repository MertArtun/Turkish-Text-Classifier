from pydantic import BaseModel
from typing import List, Optional

class PredictIn(BaseModel):
    text: str
    model: str = "bert512"

class PredictBatchIn(BaseModel):
    texts: List[str]
    model: str = "bert512"

class PredictOut(BaseModel):
    label: str
    score: float
    probs: Optional[List[float]] = None

class HealthResponse(BaseModel):
    status: str

class LabelsResponse(BaseModel):
    labels: List[str]
    model: str

class MetricsResponse(BaseModel):
    total_requests: int
    model_requests: dict
    average_response_time: float
