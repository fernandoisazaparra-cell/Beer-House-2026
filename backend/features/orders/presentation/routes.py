# =====================================================================
# Rutas de pedidos/ventas (solo admin)
# =====================================================================
from flask import Blueprint, request
from pydantic import ValidationError

from shared.security import require_admin

from ..application.services import OrderService
from .schemas import CreateOrderSchema, UpdateOrderStatusSchema

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


@orders_bp.get("/")
@require_admin
def list_orders():
    service = OrderService()
    return {"orders": service.get_orders(con_items=False)}, 200


@orders_bp.get("/stats")
@require_admin
def orders_stats():
    service = OrderService()
    return service.stats(), 200


@orders_bp.get("/<int:order_id>")
@require_admin
def get_order(order_id):
    service = OrderService()
    try:
        order = service.get_order(order_id)
    except ValueError as error:
        return {"message": str(error)}, 404

    return {"order": order}, 200


@orders_bp.post("/")
@require_admin
def create_order():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = CreateOrderSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    items = [item.model_dump() for item in schema.items]
    service = OrderService()
    try:
        order = service.create_order(
            schema.client_name,
            schema.client_email,
            schema.payment_method,
            items,
            schema.status,
        )
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"order": order}, 201


@orders_bp.post("/public")
def create_public_order():
    """Checkout público: crea un pedido siempre en estado 'pendiente'."""
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = CreateOrderSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    items = [item.model_dump() for item in schema.items]
    service = OrderService()
    try:
        order = service.create_order(
            schema.client_name,
            schema.client_email,
            schema.payment_method,
            items,
            "pendiente",
        )
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"order": order}, 201


@orders_bp.patch("/<int:order_id>/status")
@require_admin
def update_status(order_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = UpdateOrderStatusSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = OrderService()
    try:
        order = service.update_status(order_id, schema.status)
    except ValueError as error:
        return {"message": str(error)}, 404

    return {"order": order}, 200
