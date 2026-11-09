from pydantic import BaseModel
from typing import List, Optional

class Detection(BaseModel):
    label: str
    confidence: float
    bbox: List[int]
    area_ratio: float

class ImageMeta(BaseModel):
    width: int
    height: int

class PredictResponse(BaseModel):
    category: str
    confidence: float
    severity: str
    detections: List[Detection]
    image: ImageMeta
    inference_ms: int

