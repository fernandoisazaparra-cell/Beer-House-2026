# =====================================================================
# Rutas de productos
# ---------------------------------------------------------------------
# - GET  /api/products/            público (catálogo de la tienda)
# - GET  /api/products/admin/all   admin (todos, activos e inactivos)
# - POST /api/products/            admin (crear)
# - PUT  /api/products/<id>        admin (editar)
# - PATCH /api/products/<id>/stock admin (ajustar stock)
# - DELETE /api/products/<id>      admin (eliminar)
# =====================================================================
from flask import Blueprint, request
from pydantic import ValidationError

from shared.security import require_admin

from ..application.services import ProductService
from .schemas import AdjustStockSchema, CreateProductSchema, UpdateProductSchema

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


@products_bp.get("/")
def list_products():
    categoria = request.args.get("category", type=int)
    service = ProductService()
    return {"products": service.get_products(active_only=True, category=categoria)}, 200


@products_bp.get("/admin/all")
@require_admin
def list_all_products():
    service = ProductService()
    return {"products": service.get_products(active_only=False)}, 200


@products_bp.get("/admin/low-stock")
@require_admin
def list_low_stock():
    service = ProductService()
    return {"products": service.get_low_stock()}, 200


@products_bp.post("/")
@require_admin
def create_product():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = CreateProductSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = ProductService()
    try:
        product = service.create_product(schema.model_dump())
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"product": product}, 201


@products_bp.put("/<int:product_id>")
@require_admin
def update_product(product_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = UpdateProductSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = ProductService()
    try:
        product = service.update_product(product_id, schema.model_dump())
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"product": product}, 200


@products_bp.patch("/<int:product_id>/stock")
@require_admin
def adjust_stock(product_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = AdjustStockSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = ProductService()
    try:
        product = service.adjust_stock(product_id, schema.quantity)
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"product": product}, 200


@products_bp.delete("/<int:product_id>")
@require_admin
def delete_product(product_id):
    service = ProductService()
    try:
        resultado = service.delete_product(product_id)
    except ValueError as error:
        return {"message": str(error)}, 404

    return resultado, 200
