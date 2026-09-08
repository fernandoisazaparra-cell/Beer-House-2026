# =====================================================================
# Esquemas de validación de productos (Pydantic)
# =====================================================================
from pydantic import BaseModel, Field


class CreateProductSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    category_id: int | None = None
    price: float = Field(..., ge=0)
    old_price: float | None = Field(default=None, ge=0)
    discount: str | None = None
    stock: int = Field(default=0, ge=0)
    min_stock: int = Field(default=5, ge=0)
    image_url: str | None = None
    featured: bool = False
    active: bool = True


class UpdateProductSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    category_id: int | None = None
    price: float | None = Field(default=None, ge=0)
    old_price: float | None = Field(default=None, ge=0)
    discount: str | None = None
    stock: int | None = Field(default=None, ge=0)
    min_stock: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    featured: bool | None = None
    active: bool | None = None


class AdjustStockSchema(BaseModel):
    quantity: int = Field(..., ne=0)
