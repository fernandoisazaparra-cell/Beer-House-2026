# =====================================================================
# Esquemas de validación de categorías (Pydantic)
# =====================================================================
from pydantic import BaseModel, Field


class CreateCategorySchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None


class UpdateCategorySchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None
