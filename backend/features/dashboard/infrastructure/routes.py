from flask import Blueprint, jsonify
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