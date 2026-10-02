from pydantic import BaseModel, field_validator


class CommodityItem(BaseModel):
    name: str
    quantity: float
    unit: str  # "kg", "bunch", "piece", "litre"


class RecipeRequest(BaseModel):
    text: str
    user_id: int

    @field_validator("text")
    @classmethod
    def text_min_length(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("text must be at least 3 characters")
        return v


class RecipeResponse(BaseModel):
    commodities: list[CommodityItem]
    session_id: str


class PantryExclusionRequest(BaseModel):
    session_id: str
    pantry_items: list[str]


class TraderMatchRequest(BaseModel):
    session_id: str
    resident_lat: float
    resident_lon: float
    radius_km: float = 5.0
