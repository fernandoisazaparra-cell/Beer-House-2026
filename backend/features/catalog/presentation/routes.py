from functools import wraps

from flask import Blueprint, jsonify, request

from features.catalog.application.services import CatalogService
from features.catalog.domain.exceptions import InvalidFilterError, ProductNotAvailableError
from features.catalog.domain.rules import is_adult
from features.catalog.infrastructure.repository import SQLAlchemyCatalogRepository
from shared.security.decorators import current_user, current_user_id, login_required
from shared.security.roles import STAFF_ROLES

catalog_bp = Blueprint("catalog", __name__, url_prefix="/api/catalog")
service = CatalogService(SQLAlchemyCatalogRepository())


def adult_required(fn):
    """
    RF-021 / RN-020: el catálogo es solo para mayores de 18 con edad confirmada.
    El personal administrativo (admin/supervisor) no pasa por esta validación.
    Debe ir DEBAJO de @login_required.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = current_user()
        if user.rol not in STAFF_ROLES and not is_adult(user):
            return jsonify({
                "error": "Debes confirmar que eres mayor de 18 años para ver el catálogo.",
                "message": "Debes confirmar que eres mayor de 18 años para ver el catálogo.",
                "code": "age_not_confirmed",
            }), 403
        return fn(*args, **kwargs)

    return wrapper


@catalog_bp.get("/")
@login_required
@adult_required
def list_products():
    try:
        return jsonify(service.list_products(current_user_id(), request.args)), 200
    except InvalidFilterError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Error al consultar el catálogo", "details": str(e)}), 500


@catalog_bp.get("/<int:product_id>")
@login_required
@adult_required
def get_product(product_id):
    try:
        return jsonify(service.get_product(current_user_id(), product_id)), 200
    except ProductNotAvailableError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Error al consultar el producto", "details": str(e)}), 500