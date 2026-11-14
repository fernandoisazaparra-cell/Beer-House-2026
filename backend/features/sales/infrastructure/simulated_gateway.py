
from uuid import uuid4

from ..domain.payment_gateway import (
    APPROVED,
    DECLINED,
    ERROR,
    PaymentGateway,
    PaymentRequest,
    PaymentResult,
    PaymentStart,
)


class SimulatedGateway(PaymentGateway):
    """
    Pasarela simulada para desarrollo y pruebas.
    No realiza cobros reales.
    """

    name = "SIMULATED"
    requires_payment_method = True

    def start_payment(self, request: PaymentRequest) -> PaymentStart:
        outcome = (request.test_outcome or APPROVED).upper()

        allowed_outcomes = {
            APPROVED,
            DECLINED,
            ERROR,
        }

        if outcome not in allowed_outcomes:
            outcome = ERROR

        messages = {
            APPROVED: "Pago simulado aprobado.",
            DECLINED: "Pago simulado rechazado.",
            ERROR: "Error simulado al procesar el pago.",
        }

        result = PaymentResult(
            status=outcome,
            transaction_id=f"SIM-{uuid4().hex[:12].upper()}",
            message=messages[outcome],
        )

        return PaymentStart(result=result)
