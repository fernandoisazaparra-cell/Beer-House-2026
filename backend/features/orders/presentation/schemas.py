# =====================================================================
# Esquemas de validación de pedidos/ventas (Pydantic)
# =====================================================================
from pydantic import BaseModel, Field


class OrderItemSchema(BaseModel):
    product_id: int | None = None
    product_name: str = Field(..., min_length=1, max_length=150)
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0)


class CreateOrderSchema(BaseModel):
    client_name: str = Field(..., min_length=1, max_length=150)
    client_email: str | None = None
    payment_method: str | None = None
    status: str = Field(default="completado")
    items: list[OrderItemSchema] = Field(..., min_length=1)


class UpdateOrderStatusSchema(BaseModel):
    status: str = Field(..., min_length=1)
