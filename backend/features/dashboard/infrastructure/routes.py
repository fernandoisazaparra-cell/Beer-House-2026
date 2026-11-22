from flask import Blueprint, jsonify, request
from features.dashboard.application.services import DashboardService
from shared.security.decorators import role_required
from shared.security.roles import STAFF_ROLES

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
service = DashboardService()


@dashboard_bp.get("/summary")
@role_required(*STAFF_ROLES)
def get_summary():
    try:
        data = service.get_summary()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Error al obtener métricas", "details": str(e)}), 500


@dashboard_bp.get("/sales-by-product")
@role_required(*STAFF_ROLES)
def get_sales_by_product():
    """RF-047: reporte por producto (solo Admin y Supervisor)."""
    try:
        data = service.get_sales_by_product(
            date_from=request.args.get("date_from"),
            date_to=request.args.get("date_to"),
        )
        return jsonify(data), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Error al generar el reporte por producto."}), 500