from pydantic import BaseModel, Field
from typing import List, Optional

class Position(BaseModel):
    x: float
    y: float

class Scale(BaseModel):
    width: float
    height: float

class Model3D(BaseModel):
    id: str
    url: str
    position: Position
    scale: Scale

class Store(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    backgroundImage: Optional[str] = None  # Optional for widget-only stores
    models: List[Model3D] = []
    activeUsers: int = 0

    class Config:
        populate_by_name = True
