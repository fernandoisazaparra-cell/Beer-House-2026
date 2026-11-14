from flask import Blueprint, jsonify, request
from features.inventory.application.services import InventoryService
from shared.security.decorators import (
    current_role_label,
    current_user_id,
    current_user_name,
    role_required,
)
from shared.security.roles import STAFF_ROLES

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")
service = InventoryService()


# ---------------------------------------------------------------------
# Movimientos y Ajustes Básicos
# ---------------------------------------------------------------------
@inventory_bp.post("/entries")
@role_required(*STAFF_ROLES)  # RN-024
def add_entry():
    try:
        data = request.get_json() or {}
        result = service.register_entry(data, user_id=current_user_id())
        return jsonify(result), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Error al registrar entrada", "details": str(e)}), 500


@inventory_bp.post("/adjustments")
@role_required(*STAFF_ROLES)  # RN-024
def add_adjustment():
    try:
        data = request.get_json() or {}
        result = service.register_adjustment(data, user_id=current_user_id())
        return jsonify(result), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Error al registrar ajuste", "details": str(e)}), 500


@inventory_bp.get("/history")
@role_required(*STAFF_ROLES)
def get_history():
    try:
        product_id = request.args.get("product_id", type=int)
        history = service.get_history(product_id=product_id)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ---------------------------------------------------------------------
# Conteos Físicos y Auditorías (RF-024 / RF-027)
# ---------------------------------------------------------------------
@inventory_bp.route("/physical-counts", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_physical_counts():
    try:
        counts = service.get_physical_counts_history()
        return jsonify(counts), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener historial: {str(e)}"}), 500


@inventory_bp.route("/physical-counts", methods=["POST"])
@role_required(*STAFF_ROLES)
def create_physical_count():
    try:
        data = request.get_json() or {}
        count_record = service.register_physical_count(data, user_id=current_user_id())
        return jsonify({
            "message": "Conteo físico registrado exitosamente.",
            "count": count_record
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@inventory_bp.route("/physical-counts/<int:count_id>/apply", methods=["POST"])
@role_required(*STAFF_ROLES)  # RN-024
def apply_adjustment(count_id):
    try:
        result = service.apply_stock_adjustment(
            count_id,
            current_role_label(),
            current_user_name(),
            current_user_id(),
        )
        return jsonify({
            "message": "Ajuste de inventario aplicado correctamente al stock.",
            "result": result
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Error al aplicar ajuste: {str(e)}"}), 500


# ---------------------------------------------------------------------
# Alertas y Reabastecimiento Automático (RF-028 / RN-026)
# ---------------------------------------------------------------------
@inventory_bp.get("/alerts")
@role_required(*STAFF_ROLES)
def get_alerts():
    try:
        alerts = service.get_stock_alerts()
        return jsonify(alerts), 200
    except Exception as e:
        return jsonify({"error": f"Error al consultar alertas: {str(e)}"}), 500


@inventory_bp.post("/reorder-suggestions")
@role_required(*STAFF_ROLES)
def generate_reorder_suggestions():
    try:
        data = request.get_json() or {}
        product_ids = data.get("product_ids", [])
        suggestions = service.generate_reorder_suggestion(product_ids)
        return jsonify({
            "message": "Sugerencia de orden de compra generada exitosamente.",
            "suggestions": suggestions
        }), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Error al generar propuesta: {str(e)}"}), 500


# ---------------------------------------------------------------------
# Mermas, Pérdidas y Bajas de Stock (RF-030 / RN-028)
# ---------------------------------------------------------------------
@inventory_bp.route("/losses", methods=["GET"])
@role_required(*STAFF_ROLES)
def get_loss_records():
    try:
        records = service.get_loss_records_history()
        return jsonify(records), 200
    except Exception as e:
        return jsonify({"error": f"Error al consultar mermas: {str(e)}"}), 500


@inventory_bp.route("/losses", methods=["POST"])
@role_required(*STAFF_ROLES)
def create_loss_record():
    try:
        data = request.get_json() or {}
        record = service.register_loss_record(data, user_id=current_user_id())
        return jsonify({
            "message": "Solicitud de merma registrada en estado Pendiente.",
            "record": record
        }), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@inventory_bp.route("/losses/<int:loss_id>/process", methods=["POST"])
@role_required(*STAFF_ROLES)  # RN-028
def process_loss(loss_id):
    try:
        data = request.get_json() or {}
        action = data.get("action")  # 'APROBAR' o 'RECHAZAR'

        record = service.process_loss_approval(
            loss_id, action, current_user_id(), current_role_label()
        )
        return jsonify({
            "message": f"Merma procesada correctamente ({action}).",
            "record": record
        }), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Error al procesar merma: {str(e)}"}), 500