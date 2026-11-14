
from flask import Blueprint, request, jsonify, current_app

from features.suppliers.application.services import SupplierService
from shared.security.decorators import (
    current_user_id,
    role_required,
    login_required
)
from shared.security.roles import ADMIN, STAFF_ROLES

suppliers_bp = Blueprint(
    "suppliers",
    __name__,
    url_prefix="/api/suppliers"
)

supplier_service = SupplierService()


def get_json_data():
    """Obtiene y valida que el cuerpo de la solicitud sea un objeto JSON."""
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        raise ValueError("El cuerpo de la solicitud debe ser un objeto JSON válido.")

    return data


@suppliers_bp.route("", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_suppliers():
    try:
        include_inactive = request.args.get(
            "include_inactive", "false"
        ).lower()

        if include_inactive not in ("true", "false"):
            return jsonify({
                "error": "El parámetro include_inactive debe ser true o false."
            }), 400

        suppliers = supplier_service.get_all_suppliers(
            include_inactive=(include_inactive == "true")
        )

        return jsonify(suppliers), 200

    except Exception:
        current_app.logger.exception("Error al consultar proveedores.")
        return jsonify({
            "error": "No fue posible obtener los proveedores."
        }), 500


@suppliers_bp.route("", methods=["POST"])
@role_required(ADMIN)
def create_supplier():
    try:
        data = get_json_data()
        supplier = supplier_service.create_supplier(data)

        return jsonify({
            "message": "Proveedor registrado exitosamente.",
            "supplier": supplier
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        current_app.logger.exception("Error al registrar proveedor.")
        return jsonify({
            "error": "No fue posible registrar el proveedor."
        }), 500


@suppliers_bp.route("/<int:supplier_id>", methods=["PUT"])
@role_required(ADMIN)
def update_supplier(supplier_id):
    try:
        data = get_json_data()
        supplier = supplier_service.update_supplier(supplier_id, data)

        return jsonify({
            "message": "Proveedor actualizado exitosamente.",
            "supplier": supplier
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al actualizar proveedor %s.", supplier_id
        )
        return jsonify({
            "error": "No fue posible actualizar el proveedor."
        }), 500


@suppliers_bp.route("/<int:supplier_id>/status", methods=["PATCH"])
@role_required(ADMIN)
def toggle_supplier_status(supplier_id):
    try:
        data = get_json_data()

        is_active = data.get("is_active")

        if not isinstance(is_active, bool):
            return jsonify({
                "error": "El campo is_active es obligatorio y debe ser booleano."
            }), 400

        supplier = supplier_service.toggle_supplier_status(
            supplier_id,
            is_active
        )

        return jsonify({
            "message": "Estado del proveedor actualizado.",
            "supplier": supplier
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        current_app.logger.exception(
            "Error al cambiar el estado del proveedor %s.", supplier_id
        )
        return jsonify({
            "error": "No fue posible cambiar el estado del proveedor."
        }), 500
