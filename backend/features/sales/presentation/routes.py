# ---------------------------------------------------------------------
# El cliente vuelve de pagar: el frontend manda lo que trajo la URL y el backend lo VERIFICA
#   Wompi: {"transaction_id": "..."}  -> se consulta a Wompi
#   PayU:  todos los parámetros de la URL -> se valida la firma con la ApiKey
# ---------------------------------------------------------------------

from flask import Blueprint, jsonify, request

from features.sales.application.services import SalesService
from features.sales.infrastructure.repository import SQLAlchemySalesRepository
from features.sales.infrastructure.simulated_gateway import SimulatedGateway

from shared.security.decorators import current_user, login_required

from features.sales.domain.exceptions import (
    CartInvalidError,
    InvalidRequestError,
    PaymentMismatchError,
    PaymentNotFoundError,
    UnderageError,
)


sales_bp = Blueprint(
    "sales",
    __name__,
    url_prefix="/api/sales",
)

repository = SQLAlchemySalesRepository()
gateway = SimulatedGateway()

service = SalesService(
    repository=repository,
    gateway=gateway,
    result_url=None,
)


@sales_bp.route("/validate", methods=["POST"])
@login_required
def validate_cart():
    try:
        data = request.get_json(silent=True) or {}
        result = service.validate_cart(current_user(), data)
        return jsonify(result), 200

    except UnderageError as e:
        return jsonify({"error": str(e)}), 403

    except InvalidRequestError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        return jsonify({"error": "Error al validar el carrito."}), 500


@sales_bp.route("/checkout", methods=["POST"])
@login_required
def checkout():
    try:
        data = request.get_json(silent=True) or {}
        result = service.checkout(current_user(), data)
        return jsonify(result), 201

    except UnderageError as e:
        return jsonify({"error": str(e)}), 403

    except CartInvalidError as e:
        return jsonify({
            "error": str(e),
            "issues": e.issues,
        }), 409

    except InvalidRequestError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        return jsonify({"error": "Error al procesar la venta."}), 500


@sales_bp.route("/confirm", methods=["POST"])
@login_required
def confirm_payment():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Faltan los datos del pago."}), 400

    try:
        result = service.confirm_payment(current_user(), data)
        return jsonify(result), 200

    except PaymentNotFoundError as e:
        return jsonify({"error": str(e)}), 404

    except PaymentMismatchError as e:
        return jsonify({"error": str(e)}), 409

    except NotImplementedError:
        return jsonify({
            "error": "La pasarela simulada no requiere confirmación externa."
        }), 400

    except Exception:
        return jsonify({"error": "Error al confirmar el pago."}), 500


@sales_bp.route("/webhook/wompi", methods=["POST"])
def wompi_webhook():
    return jsonify({
        "error": "Wompi todavía no está configurado."
    }), 404


@sales_bp.route("/webhook/payu", methods=["POST"])
def payu_webhook():
    return jsonify({
        "error": "PayU todavía no está configurado."
    }), 404
@sales_bp.get("/history")
@login_required
def purchase_history():
    try:
        result = service.get_purchase_history(current_user())
        return jsonify({
            "success": True,
            "sales": result,
        }), 200

    except InvalidRequestError as error:
        return jsonify({
            "success": False,
            "message": str(error),
        }), 400