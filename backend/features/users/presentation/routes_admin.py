# =====================================================================
# Rutas admin de usuarios + resumen del dashboard
# =====================================================================
from flask import Blueprint, request
from pydantic import BaseModel, ValidationError

from shared.security import require_admin

from ..application.services_admin import AdminUserService

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


class UpdateRolSchema(BaseModel):
    rol: str


@admin_bp.get("/users")
@require_admin
def list_users():
    service = AdminUserService()
    return {"users": service.get_users()}, 200


@admin_bp.patch("/users/<int:user_id>/rol")
@require_admin
def update_user_rol(user_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = UpdateRolSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = AdminUserService()
    try:
        user = service.update_rol(user_id, schema.rol)
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"user": user}, 200


@admin_bp.delete("/users/<int:user_id>")
@require_admin
def delete_user(user_id):
    service = AdminUserService()
    try:
        resultado = service.delete_user(user_id)
    except ValueError as error:
        return {"message": str(error)}, 404

    return resultado, 200


@admin_bp.get("/dashboard-stats")
@require_admin
def dashboard_stats():
    """Datos básicos del dashboard: cuentas, productos, pedidos e ingresos."""
    from features.orders.application.services import OrderService
    from features.products.infrastructure.repository import ProductRepository

    user_stats = AdminUserService().stats()
    order_stats = OrderService().stats()
    products = ProductRepository().get_all()
    low_stock = [p for p in products if p.stock <= p.min_stock]

    return {
        "stats": {
            **user_stats,
            **order_stats,
            "total_products": len(products),
            "low_stock": len(low_stock),
        },
        "recent_orders": OrderService().get_orders(con_items=False)[:5],
    }, 200
