from flask import Blueprint, jsonify, request
from features.products.infrastructure.repository import SQLAlchemyProductRepository
from features.products.application.services import ProductService
from shared.security.decorators import check_roles, role_required
from shared.security.roles import ADMIN, STAFF_ROLES

# Si creas un repositorio/servicio de combos independiente o usas la capa de aplicación:
from features.products.infrastructure.repository import SQLAlchemyComboRepository # O el repositorio que maneje los combos
from features.products.application.services import ComboService

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

repository = SQLAlchemyProductRepository()
service = ProductService(repository)

# Instanciamos el servicio de combos siguiendo la misma arquitectura
combo_repository = SQLAlchemyComboRepository()
combo_service = ComboService(combo_repository)


@products_bp.get("/")
@role_required(*STAFF_ROLES)
def get_products():
    try:
        include_inactive = request.args.get("include_inactive", "false").lower() == "true"
        products = service.get_products(include_inactive=include_inactive)
        return jsonify(products), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@products_bp.post("/")
@role_required(*STAFF_ROLES)  # RF-010 / RN-017
def create_product():
    try:
        data = request.get_json()
        new_product = service.create_product(data)
        return jsonify(new_product), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Error al crear el producto", "details": str(e)}), 500


@products_bp.delete("/<int:product_id>")
@role_required(ADMIN)  # RN-017: el supervisor NO elimina
def delete_product(product_id):
    try:
        response = service.delete_product(product_id)
        return jsonify(response), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@products_bp.put("/<int:product_id>")
@role_required(*STAFF_ROLES)  # RN-017
def update_product(product_id):
    try:
        data = request.get_json()
        updated_product = service.update_product(product_id, data)
        return jsonify(updated_product), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": "Error al actualizar el producto", "details": str(e)}), 500


# ==========================================
# RUTAS PARA EL MÓDULO DE COMBOS (RF-056)
# Usando la misma capa de Servicios y Repositorios
# ==========================================

@products_bp.get("/combos")
def get_combos():
    try:
        combos = combo_service.get_combos()
        return jsonify(combos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@products_bp.post("/combos")
@role_required(*STAFF_ROLES)
def create_combo():
    try:
        data = request.get_json()
        new_combo = combo_service.create_combo(data)
        return jsonify(new_combo), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Error al crear el combo", "details": str(e)}), 500


@products_bp.put("/combos/<int:combo_id>")
@role_required(*STAFF_ROLES)
def update_combo(combo_id):
    try:
        data = request.get_json()
        updated = combo_service.update_combo(combo_id, data)
        return jsonify(updated), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        return jsonify({"error": "Error al actualizar el combo", "details": str(e)}), 500


@products_bp.delete("/combos/<int:combo_id>")
@role_required(ADMIN)  # Solo el admin puede eliminar combos (RN-017)
def delete_combo(combo_id):
    try:
        response = combo_service.delete_combo(combo_id)
        return jsonify(response), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar el combo", "details": str(e)}), 500