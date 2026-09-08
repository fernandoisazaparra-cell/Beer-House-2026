# =====================================================================
# Rutas de categorías
# =====================================================================
from flask import Blueprint, request
from pydantic import ValidationError

from shared.security import require_admin

from ..application.services import CategoryService
from .schemas import CreateCategorySchema, UpdateCategorySchema

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


@categories_bp.get("/")
def list_categories():
    service = CategoryService()
    return {"categories": service.get_categories()}, 200


@categories_bp.post("/")
@require_admin
def create_category():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = CreateCategorySchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = CategoryService()
    try:
        categoria = service.create_category(schema.name, schema.description, schema.icon)
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"category": categoria}, 201


@categories_bp.put("/<int:category_id>")
@require_admin
def update_category(category_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = UpdateCategorySchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = CategoryService()
    try:
        categoria = service.update_category(
            category_id, schema.name, schema.description, schema.icon
        )
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"category": categoria}, 200


@categories_bp.delete("/<int:category_id>")
@require_admin
def delete_category(category_id):
    service = CategoryService()
    try:
        resultado = service.delete_category(category_id)
    except ValueError as error:
        return {"message": str(error)}, 400

    return resultado, 200
