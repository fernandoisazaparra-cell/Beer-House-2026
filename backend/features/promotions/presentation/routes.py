# =====================================================================
# Rutas de promociones (solo admin)
# =====================================================================
from datetime import datetime

from flask import Blueprint, request
from pydantic import ValidationError

from shared.security import require_admin

from ..application.services import PromotionService
from .schemas import CreatePromotionSchema, UpdatePromotionSchema

promotions_bp = Blueprint("promotions", __name__, url_prefix="/api/promotions")


def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores


def parse_fecha(valor):
    """Convierte '2026-12-31' o ISO completo a datetime naive o None."""
    if not valor:
        return None
    try:
        return datetime.fromisoformat(str(valor).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError as err:
        raise ValueError("La fecha de expiración no es válida") from err


@promotions_bp.get("/")
@require_admin
def list_promotions():
    service = PromotionService()
    return {"promotions": service.get_promotions()}, 200


@promotions_bp.post("/")
@require_admin
def create_promotion():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = CreatePromotionSchema(**data)
        expires_at = parse_fecha(schema.expires_at)
    except (ValidationError, ValueError) as error:
        if isinstance(error, ValidationError):
            return {"errors": errores_pydantic(error)}, 400
        return {"message": str(error)}, 400

    service = PromotionService()
    try:
        promocion = service.create_promotion(
            schema.code, schema.discount_percent, schema.active, expires_at
        )
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"promotion": promocion}, 201


@promotions_bp.put("/<int:promotion_id>")
@require_admin
def update_promotion(promotion_id):
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = UpdatePromotionSchema(**data)
        expires_at = parse_fecha(schema.expires_at)
    except (ValidationError, ValueError) as error:
        if isinstance(error, ValidationError):
            return {"errors": errores_pydantic(error)}, 400
        return {"message": str(error)}, 400

    service = PromotionService()
    try:
        promocion = service.update_promotion(
            promotion_id, schema.code, schema.discount_percent, schema.active, expires_at
        )
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"promotion": promocion}, 200


@promotions_bp.patch("/<int:promotion_id>/toggle")
@require_admin
def toggle_promotion(promotion_id):
    service = PromotionService()
    try:
        actual = service.get_promotion(promotion_id)
        promocion = service.update_promotion(
            promotion_id,
            actual["code"],
            actual["discount_percent"],
            not actual["active"],
            None,
        )
    except ValueError as error:
        return {"message": str(error)}, 404

    return {"promotion": promocion}, 200


@promotions_bp.delete("/<int:promotion_id>")
@require_admin
def delete_promotion(promotion_id):
    service = PromotionService()
    try:
        resultado = service.delete_promotion(promotion_id)
    except ValueError as error:
        return {"message": str(error)}, 404

    return resultado, 200
