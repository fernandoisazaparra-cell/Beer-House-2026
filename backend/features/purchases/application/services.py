"""
Servicio del módulo de compras
(backend/features/purchases/application/services.py)

Secciones:
    1. Imports y constantes
    2. Helpers de validación y transacciones
    3. PurchaseService
        3.1 Órdenes a proveedores
        3.2 Facturas de proveedores / cuentas por pagar
        3.3 Compras de clientes y Wompi
"""

# ==========================================
# 1. IMPORTS Y CONSTANTES
# ==========================================

from contextlib import contextmanager
from datetime import datetime
from decimal import Decimal, InvalidOperation

from app.extensions import db

# Modelos del módulo de compras y proveedores
from features.purchases.infrastructure.models import (
    PurchaseOrderModel,
    PurchaseOrderItemModel,
    CustomerOrderModel,
    PaymentTransactionModel,
)
from features.suppliers.infrastructure.models import SupplierModel
from features.products.infrastructure.models import ProductModel
from features.inventory.infrastructure.models import PurchaseInvoiceModel
from features.inventory.infrastructure.repository import SQLAlchemyInventoryRepository


# Estados de las órdenes de compra
ORDER_PENDING = "Pendiente"
ORDER_PARTIAL = "Parcial"
ORDER_RECEIVED = "Recibida"
ORDER_CANCELLED = "Cancelada"

# Estados de pago de las facturas
INVOICE_PENDING = "Pendiente"
INVOICE_PAID = "Pagada"


# ==========================================
# 2. HELPERS
# ==========================================

@contextmanager
def _rollback_on_error():
    """Hace rollback de la sesión si algo falla y relanza el error."""
    try:
        yield
    except Exception:
        db.session.rollback()
        raise


def _to_positive_int(value, message, bool_message=None):
    """Convierte a entero > 0. Rechaza booleanos."""
    if isinstance(value, bool):
        raise ValueError(bool_message or message)

    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValueError(message)

    if number <= 0:
        raise ValueError(message)

    return number


def _to_exact_int(value, bool_message, invalid_message):
    """Convierte a entero exacto: rechaza booleanos y decimales como 2.5."""
    if isinstance(value, bool):
        raise ValueError(bool_message)

    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValueError(invalid_message)

    if str(value).strip() != str(number):
        raise ValueError(invalid_message)

    return number


def _to_digit_id(value, message):
    """Valida un ID que debe ser una cadena/entero de solo dígitos y > 0."""
    if isinstance(value, bool) or not str(value).isdigit() or int(value) <= 0:
        raise ValueError(message)

    return int(value)


class PurchaseService:
    def __init__(self):
        self.inventory_repository = SQLAlchemyInventoryRepository()

    # ==========================================
    # 3.1 ÓRDENES A PROVEEDORES
    # ==========================================

    def get_all_orders(self):
        orders = PurchaseOrderModel.query.order_by(
            PurchaseOrderModel.created_at.desc()
        ).all()
        return [o.to_dict() for o in orders]

    # ---------- Crear orden ----------

    def create_order(self, data, user_id):
        if not isinstance(data, dict):
            raise ValueError("Los datos de la orden no son válidos.")

        if not user_id:
            raise ValueError("No se pudo identificar al usuario autenticado.")

        with _rollback_on_error():
            supplier = self._get_active_supplier(data.get("supplier_id"))

            items_data = data.get("items")

            if not isinstance(items_data, list) or not items_data:
                raise ValueError(
                    "La orden de compra debe contener al menos un producto."
                )

            order = PurchaseOrderModel(
                order_number=self._generate_order_number(),
                supplier_id=supplier.id,
                user_id=user_id,
                status=ORDER_PENDING,
                notes=(data.get("notes") or "").strip(),
                total_amount=0,
            )

            db.session.add(order)
            db.session.flush()

            total_amount = 0
            processed_products = set()

            for item in items_data:
                product, quantity, unit_cost = self._parse_order_item(
                    item, processed_products
                )

                total_amount += quantity * unit_cost

                db.session.add(PurchaseOrderItemModel(
                    purchase_order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    quantity_received=0,
                    unit_cost=unit_cost,
                ))

            order.total_amount = total_amount

            db.session.commit()

            return order.to_dict()

    @staticmethod
    def _generate_order_number():
        now = datetime.now()
        return f"OC-{now.year}-{now.strftime('%m%d%H%M%S%f')}"

    @staticmethod
    def _get_active_supplier(supplier_id):
        """Valida el ID y devuelve el proveedor, que debe estar activo (RN-034)."""
        supplier_id = _to_positive_int(
            supplier_id,
            message="El ID del proveedor debe ser válido.",
            bool_message="El proveedor indicado no es válido.",
        )

        supplier = db.session.get(SupplierModel, supplier_id)

        if not supplier or not supplier.is_active:
            raise ValueError(
                "La orden de compra solo puede generarse "
                "a proveedores activos."
            )

        return supplier

    @staticmethod
    def _parse_order_item(item, processed_products):
        """
        Valida una línea de la orden y devuelve (producto, cantidad, costo).
        `processed_products` evita productos repetidos en la misma orden.
        """
        if not isinstance(item, dict):
            raise ValueError("Cada producto de la orden debe ser válido.")

        product_id = _to_positive_int(
            item.get("product_id"),
            "El ID del producto no es válido."
        )

        quantity = _to_exact_int(
            item.get("quantity"),
            bool_message="La cantidad debe ser un entero válido.",
            invalid_message="La cantidad debe ser un número entero válido.",
        )

        cost_value = item.get("unit_cost")

        if isinstance(cost_value, bool):
            raise ValueError("El costo unitario no es válido.")

        try:
            unit_cost = float(cost_value)
        except (TypeError, ValueError):
            raise ValueError("El costo unitario debe ser numérico.")

        if quantity <= 0 or unit_cost <= 0:
            raise ValueError(
                "La cantidad y el costo unitario deben ser mayores a 0."
            )

        if product_id in processed_products:
            raise ValueError(
                "No puedes agregar el mismo producto dos veces. "
                "Consolida sus cantidades en una sola línea."
            )

        processed_products.add(product_id)

        product = db.session.get(ProductModel, product_id)

        if not product:
            raise ValueError(f"No existe el producto con ID {product_id}.")

        return product, quantity, unit_cost

    # ---------- Recibir orden ----------

    def receive_order(self, order_id, received_items, user_id):
        """
        Registra una recepción parcial o completa de una orden.
        Las cantidades representan exclusivamente las unidades
        recibidas en esta entrega.
        """
        with _rollback_on_error():
            if not user_id:
                raise ValueError("No se identificó al usuario responsable.")

            if not isinstance(received_items, list) or not received_items:
                raise ValueError("Debes indicar los productos recibidos.")

            order_id = _to_positive_int(
                order_id,
                "El identificador de la orden no es válido."
            )

            # Validar y normalizar todo antes de tocar el inventario.
            received_by_item = self._parse_received_items(received_items)

            # Bloquea la orden para reducir recepciones simultáneas.
            order = (
                PurchaseOrderModel.query
                .filter_by(id=order_id)
                .with_for_update()
                .first()
            )

            if not order:
                raise ValueError("La orden de compra no existe.")

            if order.status in (ORDER_RECEIVED, ORDER_CANCELLED):
                raise ValueError("La orden ya está recibida o cancelada.")

            if not order.items:
                raise ValueError("La orden no contiene productos.")

            order_items = {item.id: item for item in order.items}

            if not set(received_by_item).issubset(order_items):
                raise ValueError("Uno o más productos no pertenecen a esta orden.")

            self._validate_pending_quantities(received_by_item, order_items)

            # El repositorio es el único responsable de actualizar el stock.
            for item_id, quantity in received_by_item.items():
                item = order_items[item_id]

                item.quantity_received = (item.quantity_received or 0) + quantity

                self.inventory_repository.create_movement(
                    movement_type="ENTRY",
                    product=item.product,
                    quantity=quantity,
                    user_id=user_id,
                    supplier_id=order.supplier_id,
                    reason=f"Recepción de orden de compra {order.order_number}",
                )

            all_received = all(
                (item.quantity_received or 0) == item.quantity
                for item in order.items
            )

            order.status = ORDER_RECEIVED if all_received else ORDER_PARTIAL

            # Una sola confirmación para orden, cantidades y movimientos.
            db.session.commit()

            return self._receipt_summary(order)

    @staticmethod
    def _parse_received_items(received_items):
        """Devuelve {item_id: cantidad} validado y sin duplicados."""
        received_by_item = {}

        for received in received_items:
            if not isinstance(received, dict):
                raise ValueError("Los datos de recepción no son válidos.")

            item_message = "El identificador del producto no es válido."

            item_id = _to_exact_int(
                received.get("item_id"),
                bool_message=item_message,
                invalid_message=item_message,
            )

            if item_id <= 0:
                raise ValueError(item_message)

            quantity = _to_exact_int(
                received.get("quantity_received"),
                bool_message="La cantidad recibida no es válida.",
                invalid_message="La cantidad recibida debe ser un entero.",
            )

            if quantity <= 0:
                raise ValueError("La cantidad recibida debe ser mayor que cero.")

            if item_id in received_by_item:
                raise ValueError("Hay productos duplicados en la recepción.")

            received_by_item[item_id] = quantity

        return received_by_item

    @staticmethod
    def _validate_pending_quantities(received_by_item, order_items):
        """Verifica que lo recibido no supere lo pendiente de cada línea."""
        for item_id, quantity in received_by_item.items():
            item = order_items[item_id]

            if not item.product:
                raise ValueError("Uno de los productos de la orden no existe.")

            requested = item.quantity
            already_received = item.quantity_received or 0

            if requested is None or requested <= 0 or already_received < 0:
                raise ValueError("La orden contiene cantidades inválidas.")

            if already_received > requested:
                raise ValueError(
                    "La cantidad recibida acumulada supera la solicitada."
                )

            if quantity > requested - already_received:
                raise ValueError(
                    f"La cantidad recibida supera lo pendiente "
                    f"para el producto {item.product.name}."
                )

    @staticmethod
    def _receipt_summary(order):
        return {
            "message": "Recepción registrada correctamente.",
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "items": [
                {
                    "item_id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else None,
                    "quantity_requested": item.quantity,
                    "quantity_received": item.quantity_received or 0,
                    "pending_quantity": (
                        item.quantity - (item.quantity_received or 0)
                    ),
                }
                for item in order.items
            ],
        }

    # ---------- Resumen ----------

    def get_purchases_summary(self):
        def count_by_status(status):
            return PurchaseOrderModel.query.filter_by(status=status).count()

        total_spent = (
            db.session.query(db.func.sum(PurchaseOrderModel.total_amount))
            .filter(PurchaseOrderModel.status == ORDER_RECEIVED)
            .scalar()
            or Decimal("0.00")
        )

        return {
            "total_orders": PurchaseOrderModel.query.count(),
            "pending_orders": count_by_status(ORDER_PENDING),
            "partial_orders": count_by_status(ORDER_PARTIAL),
            "received_orders": count_by_status(ORDER_RECEIVED),
            "cancelled_orders": count_by_status(ORDER_CANCELLED),
            "total_spent": float(total_spent),
        }

    # ==========================================
    # 3.2 FACTURAS DE PROVEEDORES / CUENTAS POR PAGAR
    # ==========================================

    def get_all_invoices(self):
        invoices = (
            PurchaseInvoiceModel.query
            .order_by(PurchaseInvoiceModel.invoice_date.desc())
            .all()
        )
        return [inv.to_dict() for inv in invoices]

    def create_invoice(self, data):
        with _rollback_on_error():
            if not isinstance(data, dict):
                raise ValueError("Los datos de la factura no son válidos.")

            invoice_number = str(data.get("invoice_number", "")).strip()

            if not invoice_number:
                raise ValueError("El número de factura es obligatorio.")

            if len(invoice_number) > 50:
                raise ValueError(
                    "El número de factura no puede superar 50 caracteres."
                )

            purchase_order_id = _to_digit_id(
                data.get("purchase_order_id"),
                "El ID de la orden no es válido."
            )

            amount = self._parse_invoice_amount(data.get("amount"))

            invoice_date, due_date = self._parse_invoice_dates(
                data.get("invoice_date"),
                data.get("due_date"),
            )

            file_url = data.get("file_url")

            if file_url is not None:
                file_url = str(file_url).strip() or None

            if PurchaseInvoiceModel.query.filter_by(
                invoice_number=invoice_number
            ).first():
                raise ValueError("Ya existe una factura con ese número.")

            order = (
                PurchaseOrderModel.query
                .filter_by(id=purchase_order_id)
                .with_for_update()
                .first()
            )

            if not order:
                raise ValueError("La orden de compra no existe.")

            if order.status not in (ORDER_RECEIVED, ORDER_PARTIAL):
                raise ValueError(
                    "Solo se pueden registrar facturas de órdenes "
                    "recibidas o parcialmente recibidas."
                )

            if amount > Decimal(str(order.total_amount or 0)):
                raise ValueError(
                    "El monto de la factura supera el total de la orden."
                )

            invoice = PurchaseInvoiceModel(
                invoice_number=invoice_number,
                purchase_order_id=order.id,
                supplier_id=order.supplier_id,
                amount=amount,
                invoice_date=invoice_date,
                due_date=due_date,
                file_url=file_url,
                payment_status=INVOICE_PENDING,
                payment_method=None,
                payment_date=None,
            )

            db.session.add(invoice)
            db.session.commit()

            return {
                "message": "Factura registrada correctamente.",
                "invoice": invoice.to_dict(),
            }

    @staticmethod
    def _parse_invoice_amount(amount_value):
        if amount_value is None:
            raise ValueError("El monto de la factura es obligatorio.")

        try:
            amount = Decimal(str(amount_value))
        except (InvalidOperation, ValueError):
            raise ValueError("El monto de la factura no es válido.")

        if not amount.is_finite() or amount <= 0:
            raise ValueError("El monto debe ser mayor que cero.")

        if amount.as_tuple().exponent < -2:
            raise ValueError("El monto admite máximo dos decimales.")

        return amount

    @staticmethod
    def _parse_invoice_dates(invoice_date_value, due_date_value):
        try:
            invoice_date = datetime.strptime(str(invoice_date_value), "%Y-%m-%d")
            due_date = datetime.strptime(str(due_date_value), "%Y-%m-%d")
        except (TypeError, ValueError):
            raise ValueError("Las fechas deben tener formato AAAA-MM-DD.")

        if due_date < invoice_date:
            raise ValueError(
                "La fecha de vencimiento no puede ser anterior "
                "a la fecha de emisión."
            )

        return invoice_date, due_date

    def process_invoice_payment(self, invoice_id, payment_data):
        with _rollback_on_error():
            invoice_id = _to_digit_id(
                invoice_id,
                "El ID de la factura no es válido."
            )

            if not isinstance(payment_data, dict):
                raise ValueError("Los datos del pago no son válidos.")

            invoice = (
                PurchaseInvoiceModel.query
                .filter_by(id=invoice_id)
                .with_for_update()
                .first()
            )

            if not invoice:
                raise ValueError("La factura no existe.")

            new_status = str(payment_data.get("payment_status", "")).strip()

            if new_status not in (INVOICE_PENDING, INVOICE_PAID):
                raise ValueError("El estado de pago no es válido.")

            if invoice.payment_status == INVOICE_PAID and new_status != INVOICE_PAID:
                raise ValueError(
                    "No se puede revertir una factura que ya figura como pagada."
                )

            if new_status == INVOICE_PAID:
                payment_method = str(payment_data.get("payment_method", "")).strip()

                if not payment_method:
                    raise ValueError("Debes indicar el método de pago registrado.")

                if len(payment_method) > 100:
                    raise ValueError(
                        "El método de pago no puede superar 100 caracteres."
                    )

                invoice.payment_status = INVOICE_PAID
                invoice.payment_method = payment_method
                invoice.payment_date = datetime.utcnow()
            else:
                invoice.payment_status = INVOICE_PENDING
                invoice.payment_method = None
                invoice.payment_date = None

            db.session.commit()

            return {
                "message": "Estado de la factura actualizado correctamente.",
                "invoice": invoice.to_dict(),
            }

    def get_accounts_payable_summary(self):
        invoices = PurchaseInvoiceModel.query.all()

        def total_by_status(status):
            return sum(
                (
                    Decimal(str(inv.amount))
                    for inv in invoices
                    if inv.payment_status == status
                ),
                Decimal("0.00"),
            )

        return {
            "total_pending": float(total_by_status(INVOICE_PENDING)),
            "total_paid": float(total_by_status(INVOICE_PAID)),
            "total_invoices": len(invoices),
        }

    # ==========================================
    # 3.3 COMPRAS DE CLIENTES Y WOMPI
    # ==========================================
    #
    # NOTA: el archivo original definía dos veces
    # `process_wompi_payment_webhook` y `get_client_purchase_history`.
    # En Python la última definición reemplaza a la anterior, así que
    # aquí se conservan solo las versiones que realmente estaban activas.

    def create_customer_purchase(self, data):
        """
        Flujo de demostración académica.
        No crea ventas reales ni procesa pagos reales.
        """
        raise ValueError(
            "El registro de compras está disponible únicamente "
            "mediante el flujo de demostración académica."
        )

    def process_wompi_payment_webhook(self, webhook_data):
        """Procesa la confirmación de pago de Wompi (RN-042: la compra solo se confirma si el pago es aprobado)."""
        ref = webhook_data.get("reference")
        status = webhook_data.get("status")
        order_id = webhook_data.get("order_id")
        amount = webhook_data.get("amount", 0.0)

        order = db.session.get(CustomerOrderModel, order_id)
        if not order:
            raise ValueError("La orden de compra asociada al pago no existe.")

        transaction = PaymentTransactionModel(
            order_id=order.id,
            user_id=order.user_id,
            transaction_reference=ref or f"WOMPI-{datetime.utcnow().timestamp()}",
            gateway_status=status,
            amount=amount,
        )
        db.session.add(transaction)

        order.status = "APPROVED" if status == "APPROVED" else "REJECTED"

        db.session.commit()
        return {
            "status": order.status,
            "message": "Transacción procesada correctamente.",
        }

    def get_client_purchase_history(self, user_id):
        """Consulta el historial de compras de un cliente específico de forma segura."""
        try:
            orders = (
                CustomerOrderModel.query
                .filter_by(user_id=user_id)
                .order_by(CustomerOrderModel.created_at.desc())
                .all()
            )
            return [o.to_dict() for o in orders]
        except Exception as e:
            print(f"Error consultando historial para usuario {user_id}: {str(e)}")
            return []