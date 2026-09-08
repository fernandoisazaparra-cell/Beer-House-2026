from pydantic import BaseModel, Field


class CreatePromotionSchema(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    discount_percent: int = Field(..., ge=0, le=100)
    active: bool = True
    expires_at: str | None = None


class UpdatePromotionSchema(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=50)
    discount_percent: int | None = Field(default=None, ge=0, le=100)
    active: bool | None = None
    expires_at: str | None = None
