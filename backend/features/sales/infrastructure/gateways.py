import hashlib
import hmac
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from decimal import ROUND_HALF_EVEN, ROUND_HALF_UP, Decimal
from uuid import uuid4

from dotenv import load_dotenv

from ..domain.payment_gateway import (
    APPROVED, DECLINED, ERROR, PENDING_STATUS, GatewayUnavailable, InvalidEventSignature,
    PaymentGateway, PaymentRequest, PaymentResult, PaymentStart, TransactionInfo,
)

load_dotenv()


# =====================================================================
# Pasarela SIMULADA (solo desarrollo)
# =====================================================================
class SimulatedGateway(PaymentGateway):
    """
    No mueve dinero ni recibe datos de tarjeta.
    El resultado lo decide `test_outcome`. NUNCA usar en producción.
    """

    name = "simulated"
    requires_payment_method = True

    MESSAGES = {
        APPROVED: "Pago aprobado (simulado).",
        DECLINED: "Pago rechazado por la entidad (simulado).",
        ERROR: "Error en la pasarela de pagos (simulado).",
    }

    def start_payment(self, request: PaymentRequest) -> PaymentStart:
        outcome = (request.test_outcome or APPROVED).upper()
        if outcome not in self.MESSAGES:
            outcome = ERROR
        result = PaymentResult(outcome, f"SIM-{uuid4().hex[:12].upper()}", self.MESSAGES[outcome])
        return PaymentStart(result=result)


# =====================================================================
# Pasarela WOMPI (Web Checkout con redirección)
# Docs: https://docs.wompi.co
# =====================================================================
class WompiGateway(PaymentGateway):
    name = "wompi"
    requires_payment_method = False  # el cliente elige el método en la página de Wompi

    CHECKOUT_URL = "https://checkout.wompi.co/p/"
    SANDBOX_API = "https://sandbox.wompi.co/v1"
    PRODUCTION_API = "https://production.wompi.co/v1"

    def __init__(self, public_key, integrity_secret, events_secret):
        missing = [n for n, v in (("WOMPI_PUBLIC_KEY", public_key),
                                  ("WOMPI_INTEGRITY_SECRET", integrity_secret),
                                  ("WOMPI_EVENTS_SECRET", events_secret)) if not v]
        if missing:
            raise RuntimeError(f"Faltan variables de entorno de Wompi: {', '.join(missing)}")
        self.public_key = public_key
        self.integrity_secret = integrity_secret
        self.events_secret = events_secret
        # Las llaves de prueba empiezan por pub_test_
        self.api_url = self.SANDBOX_API if public_key.startswith("pub_test_") else self.PRODUCTION_API

    # ---- Firma de integridad: SHA256(referencia + monto en centavos + moneda + secreto)
    def integrity_signature(self, reference, amount_in_cents, currency):
        raw = f"{reference}{amount_in_cents}{currency}{self.integrity_secret}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def start_payment(self, request: PaymentRequest) -> PaymentStart:
        cents = int((Decimal(request.amount) * 100).to_integral_value())
        params = {
            "public-key": self.public_key,
            "currency": request.currency,
            "amount-in-cents": str(cents),
            "reference": request.reference,
            "signature:integrity": self.integrity_signature(request.reference, cents, request.currency),
        }
        if request.redirect_url:
            params["redirect-url"] = request.redirect_url
        return PaymentStart(checkout_url=f"{self.CHECKOUT_URL}?{urllib.parse.urlencode(params)}")

    # ---- Al volver el cliente: la URL trae ?id=...; se consulta a Wompi el estado real
    def resolve_return(self, data: dict) -> TransactionInfo | None:
        transaction_id = str(data.get("transaction_id", "")).strip()
        return self.fetch_transaction(transaction_id) if transaction_id else None

    # ---- Consulta activa: GET /v1/transactions/{id}
    def fetch_transaction(self, transaction_id: str) -> TransactionInfo | None:
        safe_id = urllib.parse.quote(str(transaction_id), safe="-_")
        req = urllib.request.Request(
            f"{self.api_url}/transactions/{safe_id}",
            headers={"Authorization": f"Bearer {self.public_key}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.load(response).get("data") or {}
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise GatewayUnavailable(f"Wompi respondió {e.code}") from e
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            raise GatewayUnavailable("No se pudo contactar a Wompi") from e
        return self._to_info(data)

    # ---- Evento (webhook): valida el checksum y devuelve la transacción
    def verify_event(self, payload: dict, header_checksum: str | None) -> TransactionInfo | None:
        signature = payload.get("signature") or {}
        data = payload.get("data") or {}

        values = []
        for path in signature.get("properties") or []:   # la lista puede variar: se lee siempre
            node = data
            for part in str(path).split("."):
                node = node.get(part) if isinstance(node, dict) else None
            values.append("" if node is None else str(node))

        raw = "".join(values) + str(payload.get("timestamp", "")) + self.events_secret
        expected = hashlib.sha256(raw.encode()).hexdigest()
        received = str(signature.get("checksum") or header_checksum or "")
        if not hmac.compare_digest(expected.lower(), received.lower()):
            raise InvalidEventSignature("Checksum inválido")

        if payload.get("event") != "transaction.updated":
            return None
        return self._to_info(data.get("transaction") or {})

    @staticmethod
    def _to_info(tx: dict) -> TransactionInfo:
        return TransactionInfo(
            id=str(tx.get("id", "")),
            reference=str(tx.get("reference", "")),
            status=str(tx.get("status", "")).upper(),
            amount_in_cents=int(tx.get("amount_in_cents") or 0),
            currency=str(tx.get("currency", "")),
            payment_method_type=tx.get("payment_method_type"),
            message=tx.get("status_message"),
        )


# =====================================================================
# Pasarela PAYU LATAM (WebCheckout con formulario POST)
# Docs: https://developers-payu-latam.github.io/latam/en/docs.html
# Las credenciales de prueba de Colombia son públicas (están en su documentación).
# =====================================================================
class PayUGateway(PaymentGateway):
    name = "payu"
    requires_payment_method = False  # el cliente elige el método en la página de PayU

    SANDBOX_URL = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
    PRODUCTION_URL = "https://checkout.payulatam.com/ppp-web-gateway-payu/"

    # transactionState (página de respuesta) / state_pol (confirmación)
    STATES = {"4": APPROVED, "6": DECLINED, "104": ERROR, "5": "EXPIRED", "7": PENDING_STATUS}
    # El algoritmo de la firma recibida se deduce por su largo
    HASHES = {32: hashlib.md5, 40: hashlib.sha1, 64: hashlib.sha256}

    def __init__(self, merchant_id, account_id, api_key, sandbox=True, vat_rate="0.19", confirmation_url=None):
        missing = [n for n, v in (("PAYU_MERCHANT_ID", merchant_id), ("PAYU_ACCOUNT_ID", account_id),
                                  ("PAYU_API_KEY", api_key)) if not v]
        if missing:
            raise RuntimeError(f"Faltan variables de entorno de PayU: {', '.join(missing)}")
        self.merchant_id = str(merchant_id)
        self.account_id = str(account_id)
        self.api_key = api_key
        self.sandbox = sandbox
        self.vat_rate = Decimal(str(vat_rate))
        self.confirmation_url = confirmation_url or None  # debe ser pública (no localhost)

    # ---------------- helpers de formato ----------------
    @staticmethod
    def _plain(amount: Decimal) -> str:
        """65000.00 -> '65000'; 65000.50 -> '65000.50' (el mismo texto se firma y se envía)."""
        return str(int(amount)) if amount == amount.to_integral_value() else f"{amount:.2f}"

    def _tax_parts(self, amount: Decimal):
        """Precios con IVA incluido: separa el IVA y la base. Con IVA 0 envía 0 y 0."""
        if self.vat_rate == 0:
            return "0", "0"
        tax = (amount * self.vat_rate / (1 + self.vat_rate)).quantize(Decimal("0.01"), ROUND_HALF_UP)
        return f"{tax:.2f}", f"{amount - tax:.2f}"

    @staticmethod
    def _cents(value) -> int:
        return int((Decimal(str(value)) * 100).to_integral_value())

    @staticmethod
    def _value_candidates(value, is_response: bool):
        """
        El manual describe dos formas de escribir el monto al firmar y uno de sus ejemplos no
        cuadra, así que se aceptan ambas: es seguro porque el hash lo calcula SIEMPRE nuestro
        servidor con la ApiKey (quien no la tenga no puede fabricar ninguna).
        """
        d = Decimal(str(value))
        one = d.quantize(Decimal("0.1"), rounding=ROUND_HALF_EVEN)
        if not is_response and d != one:
            one = d.quantize(Decimal("0.01"))  # confirmación: 2 decimales si el segundo no es 0
        return list(dict.fromkeys([str(one), f"{d.quantize(Decimal('0.01'))}"]))

    def _signature_ok(self, bases, received) -> bool:
        received = str(received or "").strip().lower()
        algorithm = self.HASHES.get(len(received))
        if algorithm is None:
            return False
        return any(hmac.compare_digest(algorithm(b.encode()).hexdigest(), received) for b in bases)

    # ---------------- iniciar el pago ----------------
    def form_signature(self, reference, amount_text, currency):
        raw = f"{self.api_key}~{self.merchant_id}~{reference}~{amount_text}~{currency}"
        return hashlib.sha256(raw.encode()).hexdigest()

    def start_payment(self, request: PaymentRequest) -> PaymentStart:
        # PayU no admite caracteres especiales en referenceCode
        reference = re.sub(r"[^A-Za-z0-9]", "x", request.reference)
        amount = Decimal(request.amount)
        amount_text = self._plain(amount)
        tax, base = self._tax_parts(amount)

        fields = {
            "merchantId": self.merchant_id,
            "accountId": self.account_id,
            "description": f"Compra Beer House {request.reference}"[:255],
            "referenceCode": reference,
            "amount": amount_text,
            "tax": tax,
            "taxReturnBase": base,
            "currency": request.currency,
            "signature": self.form_signature(reference, amount_text, request.currency),
            "algorithmSignature": "SHA256",
            "test": "1" if self.sandbox else "0",
            "buyerEmail": request.payer_email,
        }
        if request.payer_name:
            fields["buyerFullName"] = request.payer_name[:150]
        if request.redirect_url:
            fields["responseUrl"] = request.redirect_url
        if self.confirmation_url:
            fields["confirmationUrl"] = self.confirmation_url

        url = self.SANDBOX_URL if self.sandbox else self.PRODUCTION_URL
        return PaymentStart(checkout_url=url, checkout_method="POST", checkout_fields=fields)

    # ---------------- el cliente vuelve (página de respuesta, GET) ----------------
    def resolve_return(self, data: dict) -> TransactionInfo | None:
        needed = ("merchantId", "referenceCode", "TX_VALUE", "currency", "transactionState", "signature")
        if any(not str(data.get(k, "")).strip() for k in needed):
            return None
        if str(data["merchantId"]) != self.merchant_id:
            raise InvalidEventSignature("Comercio distinto")

        bases = [
            f"{self.api_key}~{self.merchant_id}~{data['referenceCode']}~{v}~{data['currency']}~{data['transactionState']}"
            for v in self._value_candidates(data["TX_VALUE"], is_response=True)
        ]
        if not self._signature_ok(bases, data["signature"]):
            raise InvalidEventSignature("Firma inválida")

        return TransactionInfo(
            id=str(data.get("transactionId") or data.get("reference_pol") or ""),
            reference=str(data["referenceCode"]),
            status=self.STATES.get(str(data["transactionState"]), PENDING_STATUS),
            amount_in_cents=self._cents(data["TX_VALUE"]),
            currency=str(data["currency"]),
            payment_method_type=data.get("lapPaymentMethod"),
            message=data.get("message"),
        )

    # ---------------- confirmación servidor a servidor (POST form) ----------------
    def verify_event(self, payload: dict, header_checksum: str | None) -> TransactionInfo | None:
        needed = ("merchant_id", "reference_sale", "value", "currency", "state_pol", "sign")
        if any(not str(payload.get(k, "")).strip() for k in needed):
            raise InvalidEventSignature("Faltan datos")
        if str(payload["merchant_id"]) != self.merchant_id:
            raise InvalidEventSignature("Comercio distinto")

        bases = [
            f"{self.api_key}~{self.merchant_id}~{payload['reference_sale']}~{v}~{payload['currency']}~{payload['state_pol']}"
            for v in self._value_candidates(payload["value"], is_response=False)
        ]
        if not self._signature_ok(bases, payload["sign"]):
            raise InvalidEventSignature("Firma inválida")

        return TransactionInfo(
            id=str(payload.get("transaction_id") or payload.get("reference_pol") or ""),
            reference=str(payload["reference_sale"]),
            status=self.STATES.get(str(payload["state_pol"]), PENDING_STATUS),
            amount_in_cents=self._cents(payload["value"]),
            currency=str(payload["currency"]),
            payment_method_type=payload.get("payment_method_name"),
            message=payload.get("response_message_pol"),
        )


# =====================================================================
def get_gateway() -> PaymentGateway:
    """Elige la pasarela según la variable de entorno PAYMENT_GATEWAY."""
    name = os.getenv("PAYMENT_GATEWAY", "simulated").lower()
    if name == "simulated":
        return SimulatedGateway()
    if name == "wompi":
        return WompiGateway(
            os.getenv("WOMPI_PUBLIC_KEY", ""),
            os.getenv("WOMPI_INTEGRITY_SECRET", ""),
            os.getenv("WOMPI_EVENTS_SECRET", ""),
        )
    if name == "payu":
        return PayUGateway(
            os.getenv("PAYU_MERCHANT_ID", ""),
            os.getenv("PAYU_ACCOUNT_ID", ""),
            os.getenv("PAYU_API_KEY", ""),
            sandbox=os.getenv("PAYU_SANDBOX", "true").lower() != "false",
            vat_rate=os.getenv("PAYU_VAT_RATE", "0.19"),
            confirmation_url=os.getenv("PAYU_CONFIRMATION_URL", ""),
        )
    raise RuntimeError(f"Pasarela de pagos no soportada: '{name}'")


def get_result_url() -> str:
    """Página del frontend a la que vuelve el cliente después de pagar."""
    base = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/pago/resultado"