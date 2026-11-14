# =====================================================================
# Contrato de la pasarela de pagos.
# El resto del sistema SOLO conoce esta interfaz.
#   - SimulatedGateway: responde al instante (para desarrollo sin internet).
#   - WompiGateway / PayUGateway: devuelven una URL o un formulario de pago;
#     el resultado llega después (al volver el cliente y/o por confirmación).
# =====================================================================
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal

APPROVED = "APPROVED"
DECLINED = "DECLINED"
ERROR = "ERROR"
VOIDED = "VOIDED"
PENDING_STATUS = "PENDING"


class GatewayUnavailable(Exception):
    """No se pudo hablar con la pasarela (red caída, timeout...)."""


class InvalidEventSignature(Exception):
    """El checksum del evento no coincide: el evento no es de la pasarela."""


@dataclass(frozen=True)
class PaymentRequest:
    reference: str                   # nº de pedido, ej. BH-000012
    amount: Decimal
    currency: str
    method: str                      # CARD / PSE / NEQUI (solo simulada)
    payer_email: str
    payer_name: str | None = None    # nombre del comprador (PayU lo pide)
    redirect_url: str | None = None  # a dónde vuelve el cliente tras pagar
    test_outcome: str | None = None  # solo lo usa la pasarela simulada


@dataclass(frozen=True)
class PaymentResult:
    status: str                      # APPROVED / DECLINED / ERROR
    transaction_id: str | None
    message: str


@dataclass(frozen=True)
class PaymentStart:
    result: PaymentResult | None = None   # pasarela síncrona: ya hay resultado
    checkout_url: str | None = None       # pasarela con redirección: hay que pagar allá
    checkout_method: str = "GET"          # Wompi: GET (enlace). PayU: POST (formulario)
    checkout_fields: dict | None = None   # campos del formulario cuando el método es POST


@dataclass(frozen=True)
class TransactionInfo:
    id: str
    reference: str
    status: str                      # APPROVED / DECLINED / VOIDED / ERROR / PENDING
    amount_in_cents: int
    currency: str
    payment_method_type: str | None = None
    message: str | None = None


class PaymentGateway(ABC):
    name: str
    requires_payment_method = True   # ¿el cliente debe elegir el método en nuestro sitio?

    @abstractmethod
    def start_payment(self, request: PaymentRequest) -> PaymentStart:
        """Inicia el cobro. No debe lanzar excepciones por rechazos."""

    def resolve_return(self, data: dict) -> TransactionInfo | None:
        """El cliente vuelve de pagar: convierte lo que trae la URL en una transacción verificada."""
        raise NotImplementedError("Esta pasarela no confirma al volver el cliente.")

    def verify_event(self, payload: dict, header_checksum: str | None) -> TransactionInfo | None:
        raise NotImplementedError("Esta pasarela no usa webhooks.")