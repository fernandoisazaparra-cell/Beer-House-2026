from flask import Blueprint, request, jsonify
from features.customers.application.services import CustomerService
from shared.security.decorators import current_user_id, login_required, role_required
from shared.security.roles import STAFF_ROLES

customers_bp = Blueprint("customers", __name__, url_prefix="/api/customers")
customer_service = CustomerService()

@customers_bp.post("/interactions")
@login_required
def create_interaction():
    """Registra una interacción de cliente validando la protección a menores (RF-059, RN-055)."""
    try:
        user_id = current_user_id()
        data = request.get_json() or {}
        result = customer_service.register_interaction(user_id, data)
        return jsonify({
            "message": "Interacción registrada correctamente.",
            "interaction": result
        }), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@customers_bp.post("/surveys")
def submit_satisfaction_survey():
    """Permite aplicar encuestas de satisfacción de forma totalmente anónima (RF-060, RN-056)."""
    try:
        data = request.get_json() or {}
        result = customer_service.submit_survey(data)
        return jsonify(result), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@customers_bp.get("/surveys/results")
@role_required(*STAFF_ROLES)
def get_survey_results():
    """Consulta los resultados de las encuestas sin exponer identidad (RN-056)."""
    try:
        results = customer_service.get_anonymous_surveys()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": f"Error al obtener resultados: {str(e)}"}), 500