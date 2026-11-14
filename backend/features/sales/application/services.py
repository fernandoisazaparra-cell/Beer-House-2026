from decimal import Decimal
from uuid import uuid4

from features.catalog.domain.rules import is_adult

from ..domain.exceptions import (
    CartInvalidError, InvalidRequestError, PaymentMismatchError, PaymentNotFoundError, UnderageError,
)
from ..domain.payment_gateway import (
    APPROVED, ERROR, PENDING_STATUS, PaymentRequest, PaymentResult, TransactionInfo,
)
from ..domain.rules import (
    CURRENCY, EXPIRED, MAX_LINES, MAX_QUANTITY, PAID, PAYMENT_METHODS, PENDING,
    PENDING_MINUTES, REVIEW,
)


def _to_int(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, float):
        return int(value) if value.is_integer() else None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_cents(amount):
    return int((Decimal(str(amount)) * 100).to_integral_value())


def _issue(product_id, code, message, **extra):
    return {"product_id": product_id, "code": code, "message": message, **extra}


class SalesService:
    def __init__(self, repository, gateway, result_url=None):
        self.repository = repository
        self.gateway = gateway
        self.result_url = result_url  # a dónde vuelve el cliente tras pagar

    # -----------------------------------------------------------------
    # Ventas sin pagar: devuelven el stock que tenían reservado
    # -----------------------------------------------------------------
    def _release_all(self, sale, user_id, reason):
        for item in sale.items:
            self.repository.release_stock(item.product_id, item.quantity)
            self.repository.add_movement(item.product_id, user_id, "SALE_REVERSAL", item.quantity, reason)

    def _expire(self, sales):
        for sale in sales:
            self._release_all(sale, sale.user_id, f"Venta {sale.order_number} sin pagar")
            self.repository.set_status(sale, EXPIRED, "La venta expiró sin recibir el pago.")
        if sales:
            self.repository.commit()

    def _cleanup(self, user):
        """Libera lo viejo (más de 30 min) y lo que el propio cliente dejó a medias."""
        self._expire(self.repository.get_pending_sales(older_than_minutes=PENDING_MINUTES))
        self._expire(self.repository.get_pending_sales(user_id=user.id))

    # -----------------------------------------------------------------
    # Validación del carrito (RN-018, RN-012, RF-019)
    # El precio SIEMPRE sale de la base de datos; el que mande el frontend se ignora.
    # -----------------------------------------------------------------
    def _build_cart(self, raw_items):
        if not isinstance(raw_items, list) or not raw_items:
            raise InvalidRequestError("El carrito está vacío.")
        if len(raw_items) > MAX_LINES:
            raise InvalidRequestError(f"Máximo {MAX_LINES} productos distintos por compra.")

        wanted, issues = {}, []
        for raw in raw_items:
            if not isinstance(raw, dict):
                raise InvalidRequestError("Formato de carrito inválido.")
            ref = raw.get("product_id")
            product_id = _to_int(ref)
            quantity = _to_int(raw.get("quantity"))

            if product_id is None or product_id <= 0:
                issues.append(_issue(ref, "invalid_item", "Este artículo no se puede comprar desde aquí."))
                continue
            if quantity is None or not 1 <= quantity <= MAX_QUANTITY:
                raise InvalidRequestError(f"La cantidad debe estar entre 1 y {MAX_QUANTITY}.")
            wanted[product_id] = wanted.get(product_id, 0) + quantity  # une duplicados

        products = self.repository.get_products(list(wanted))
        lines = []
        for product_id, quantity in wanted.items():
            product = products.get(product_id)

            # RN-012: inactivos o inexistentes no se pueden comprar
            if product is None or not product.is_active:
                issues.append(_issue(product_id, "not_available", "Este producto ya no está disponible."))
                continue

            name = product.name
            if product.stock <= 0:
                issues.append(_issue(product_id, "out_of_stock", f"«{name}» está agotado.", available=0))
            elif quantity > product.stock:  # RN-018
                issues.append(_issue(
                    product_id, "insufficient_stock",
                    f"Solo hay {product.stock} unidades de «{name}».", available=product.stock,
                ))

            unit_price = Decimal(str(product.price))
            lines.append({
                "product_id": product_id,
                "name": name,
                "unit_price": unit_price,
                "quantity": quantity,
                "subtotal": unit_price * quantity,
                "available": product.stock,
            })

        total = sum((line["subtotal"] for line in lines), Decimal("0"))
        return lines, issues, total

    @staticmethod
    def _serialize_lines(lines):
        return [
            {**line, "unit_price": float(line["unit_price"]), "subtotal": float(line["subtotal"])}
            for line in lines
        ]

    def _ensure_adult(self, user):
        if not is_adult(user):  # RN-040
            raise UnderageError("Solo mayores de 18 años pueden comprar.")

    def validate_cart(self, user, data):
        self._ensure_adult(user)
        self._cleanup(user)
        lines, issues, total = self._build_cart(data.get("items"))
        return {
            "gateway": self.gateway.name,
            "ok": not issues,
            "items": self._serialize_lines(lines),
            "total": float(total),
            "issues": issues,
        }

    # -----------------------------------------------------------------
    # Checkout: reservar stock -> iniciar cobro -> (más tarde) confirmar o devolver
    # -----------------------------------------------------------------
    def checkout(self, user, data):
        self._ensure_adult(user)
        self._cleanup(user)

        if self.gateway.requires_payment_method:
            method = str(data.get("payment_method", "")).upper()
            if method not in PAYMENT_METHODS:
                raise InvalidRequestError(f"Método de pago no válido. Usa: {', '.join(PAYMENT_METHODS)}.")
        else:
            method = self.gateway.name.upper()  # Wompi/PayU: se actualiza al confirmar el pago

        lines, issues, total = self._build_cart(data.get("items"))

        # Lo que el cliente vio en pantalla debe ser lo que se le cobra
        expected = data.get("expected_total")
        if expected is not None:
            try:
                if Decimal(str(expected)) != total:
                    issues.append(_issue(None, "price_changed", "Los precios cambiaron. Revisa el nuevo total."))
            except Exception:
                raise InvalidRequestError("expected_total no es un número válido.") from None

        if issues:
            raise CartInvalidError(issues, self._serialize_lines(lines), float(total))

        # 1) Crear la venta y reservar el stock (todo o nada)
        try:
            sale = self.repository.create_sale(user.id, lines, total, method, self.gateway.name)
            for line in lines:
                if not self.repository.reserve_stock(line["product_id"], line["quantity"]):
                    # Alguien compró lo mismo justo antes: se deshace todo
                    raise CartInvalidError(
                        [_issue(line["product_id"], "insufficient_stock",
                                f"«{line['name']}» se agotó mientras comprabas.")],
                        self._serialize_lines(lines), float(total),
                    )
                self.repository.add_movement(
                    line["product_id"], user.id, "SALE", line["quantity"], f"Venta {sale.order_number}"
                )
            self.repository.commit()
        except Exception:
            self.repository.rollback()
            raise

        # 2) Iniciar el cobro en la pasarela
        try:
            start = self.gateway.start_payment(PaymentRequest(
                reference=f"{sale.order_number}-{uuid4().hex[:6]}",  # las pasarelas no repiten referencias
                amount=total, currency=CURRENCY, method=method,
                payer_email=user.email,
                payer_name=f"{user.first_name or ''} {user.last_name or ''}".strip(),
                redirect_url=self.result_url,
                test_outcome=data.get("test_outcome"),
            ))
        except Exception:
            start = None

        # 2a) Pasarela con redirección (Wompi/PayU): el cliente paga allá; la venta queda PENDING
        if start is not None and start.checkout_url:
            return {
                **sale.to_dict(),
                "checkout_url": start.checkout_url,
                "checkout_method": start.checkout_method,
                "checkout_fields": start.checkout_fields,
            }

        # 2b) Pasarela síncrona (simulada): ya hay resultado
        result = (start.result if start is not None else None) or PaymentResult(
            ERROR, None, "No se pudo contactar la pasarela de pagos.")
        self._settle_result(sale, result)
        return sale.to_dict()

    def _settle_result(self, sale, result):
        """Confirma la compra (RN-042) o devuelve el stock."""
        try:
            if result.status == APPROVED:
                self.repository.mark_paid(sale, result)
            else:
                self._release_all(sale, sale.user_id, f"Pago no aprobado {sale.order_number}")
                self.repository.mark_failed(sale, result)
            self.repository.commit()
        except Exception:
            self.repository.rollback()
            raise

    # -----------------------------------------------------------------
    # Resultado de la pasarela: al volver el cliente (confirm) o por confirmación del servidor
    # Las dos rutas terminan en _settle: es idempotente (se puede repetir).
    # -----------------------------------------------------------------
    def confirm_payment(self, user, data):
        info = self.gateway.resolve_return(data)  # nunca se confía solo en la URL: se verifica
        sale = self.repository.get_sale_by_order_number(info.reference) if info else None
        if sale is None or sale.user_id != user.id:
            raise PaymentNotFoundError("No encontramos esa transacción.")
        self._settle(sale, info)
        return sale.to_dict()

    def handle_event(self, payload, checksum_header):
        info = self.gateway.verify_event(payload, checksum_header)  # lanza si la firma es falsa
        if info is None:
            return  # otro tipo de evento: se ignora
        sale = self.repository.get_sale_by_order_number(info.reference)
        if sale is not None:
            self._settle(sale, info)

    def _settle(self, sale, info: TransactionInfo):
        if info.amount_in_cents != _to_cents(sale.total) or info.currency != CURRENCY:
            raise PaymentMismatchError("El monto de la transacción no coincide con la venta.")

        if info.status == PENDING_STATUS:
            return  # PSE/Nequi pueden tardar: se vuelve a consultar luego

        result = PaymentResult(info.status, info.id, info.message or info.status)
        try:
            if info.status == APPROVED:
                if sale.status == PAID:
                    return  # evento repetido
                if sale.status == PENDING:
                    self.repository.mark_paid(sale, result, info.payment_method_type)
                else:
                    self._approve_late(sale, result, info.payment_method_type)
            elif sale.status == PENDING:  # DECLINED / ERROR / VOIDED
                self._release_all(sale, sale.user_id, f"Pago no aprobado {sale.order_number}")
                self.repository.mark_failed(sale, result)
            else:
                return
            self.repository.commit()
        except Exception:
            self.repository.rollback()
            raise

    def _approve_late(self, sale, result, payment_method):
        """
        La pasarela aprobó un pago de una venta que ya habíamos expirado (el stock se devolvió).
        Se intenta reservar de nuevo; si ya no alcanza, queda en REVIEW para reembolsar a mano.
        """
        sale_id = sale.id
        reserved = True
        for item in sale.items:
            if not self.repository.reserve_stock(item.product_id, item.quantity):
                reserved = False
                break
        if reserved:
            for item in sale.items:
                self.repository.add_movement(item.product_id, sale.user_id, "SALE", item.quantity,
                                             f"Venta {sale.order_number} (pago tardío)")
            self.repository.mark_paid(sale, result, payment_method)
            return
        self.repository.rollback()  # deshace las reservas parciales
        sale = self.repository.get_sale_by_order_number(f"BH-{sale_id:06d}")
        self.repository.mark_failed(
            sale, PaymentResult(APPROVED, result.transaction_id,
                                "Pago aprobado sin stock disponible. Requiere reembolso manual."),
            status=REVIEW)

    def get_purchase_history(self, user):
        user_id = getattr(user, "id", None)

        if not user_id:
            raise InvalidRequestError(
                "No se pudo identificar al usuario."
            )

        sales = self.repository.get_sales_by_user(user_id)

        return [
            sale.to_dict()
            for sale in sales
        ]