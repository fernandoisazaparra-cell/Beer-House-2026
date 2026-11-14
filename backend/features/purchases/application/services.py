from datetime import datetime, date
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
from features.users.infrastructure.models import UserModel


class PurchaseService:
    def __init__(self):
        self.inventory_repository = SQLAlchemyInventoryRepository()

    # ==========================================
    # ÓRDENES A PROVEEDORES
    # ==========================================
    def get_all_orders(self):
        orders = PurchaseOrderModel.query.order_by(
            PurchaseOrderModel.created_at.desc()
        ).all()
        return [o.to_dict() for o in orders]

    def create_order(self, data, user_id):
        if not isinstance(data, dict):
            raise ValueError("Los datos de la orden no son válidos.")

        if not user_id:
            raise ValueError("No se pudo identificar al usuario autenticado.")

        try:
            supplier_id = data.get("supplier_id")

            if isinstance(supplier_id, bool):
                raise ValueError("El proveedor indicado no es válido.")

            try:
                supplier_id = int(supplier_id)
            except (TypeError, ValueError):
                raise ValueError("El ID del proveedor debe ser válido.")

            if supplier_id <= 0:
                raise ValueError("El ID del proveedor debe ser válido.")

            supplier = db.session.get(SupplierModel, supplier_id)

            if not supplier or not supplier.is_active:
                raise ValueError(
                    "La orden de compra solo puede generarse "
                    "a proveedores activos."
                )

            items_data = data.get("items")

            if not isinstance(items_data, list) or not items_data:
                raise ValueError(
                    "La orden de compra debe contener al menos un producto."
                )

            order_number = (
                f"OC-{datetime.now().year}-"
                f"{datetime.now().strftime('%m%d%H%M%S%f')}"
            )

            order = PurchaseOrderModel(
                order_number=order_number,
                supplier_id=supplier.id,
                user_id=user_id,
                status="Pendiente",
                notes=(data.get("notes") or "").strip(),
                total_amount=0,
            )

            db.session.add(order)
            db.session.flush()

            total_amount = 0
            processed_products = set()

            for item in items_data:
                if not isinstance(item, dict):
                    raise ValueError("Cada producto de la orden debe ser válido.")

                product_id = item.get("product_id")
                quantity_value = item.get("quantity")
                cost_value = item.get("unit_cost")

                if isinstance(product_id, bool):
                    raise ValueError("El ID del producto no es válido.")

                try:
                    product_id = int(product_id)
                except (TypeError, ValueError):
                    raise ValueError("El ID del producto no es válido.")

                if product_id <= 0:
                    raise ValueError("El ID del producto no es válido.")

                if isinstance(quantity_value, bool):
                    raise ValueError("La cantidad debe ser un entero válido.")

                try:
                    quantity = int(quantity_value)

                    # Evita aceptar cantidades decimales como 2.5.
                    if str(quantity_value).strip() != str(quantity):
                        raise ValueError("La cantidad debe ser un número entero.")

                except (TypeError, ValueError):
                    raise ValueError("La cantidad debe ser un número entero válido.")

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

                total_amount += quantity * unit_cost

                order_item = PurchaseOrderItemModel(
                    purchase_order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    quantity_received=0,
                    unit_cost=unit_cost,
                )

                db.session.add(order_item)

            order.total_amount = total_amount

            db.session.commit()

            return order.to_dict()

        except Exception:
            db.session.rollback()
            raise

    def receive_order(self, order_id, received_items, user_id):
        """
        Registra una recepción parcial o completa de una orden.
        Las cantidades representan exclusivamente las unidades
        recibidas en esta entrega.
        """
        try:
            if not user_id:
                raise ValueError("No se identificó al usuario responsable.")

            if not isinstance(received_items, list) or not received_items:
                raise ValueError("Debes indicar los productos recibidos.")

            if isinstance(order_id, bool):
                raise ValueError("El identificador de la orden no es válido.")

            try:
                order_id = int(order_id)
            except (TypeError, ValueError):
                raise ValueError("El identificador de la orden no es válido.")

            if order_id <= 0:
                raise ValueError("El identificador de la orden no es válido.")

            # Validar y normalizar todos los datos antes de modificar el inventario.
            received_by_item = {}

            for received in received_items:
                if not isinstance(received, dict):
                    raise ValueError("Los datos de recepción no son válidos.")

                item_id = received.get("item_id")
                quantity_value = received.get("quantity_received")

                if isinstance(item_id, bool):
                    raise ValueError("El identificador del producto no es válido.")

                try:
                    parsed_item_id = int(item_id)
                except (TypeError, ValueError):
                    raise ValueError("El identificador del producto no es válido.")

                if str(item_id).strip() != str(parsed_item_id) or parsed_item_id <= 0:
                    raise ValueError("El identificador del producto no es válido.")

                if isinstance(quantity_value, bool):
                    raise ValueError("La cantidad recibida no es válida.")

                try:
                    quantity = int(quantity_value)
                except (TypeError, ValueError):
                    raise ValueError("La cantidad recibida debe ser un entero.")

                if str(quantity_value).strip() != str(quantity):
                    raise ValueError("La cantidad recibida debe ser un entero.")

                if quantity <= 0:
                    raise ValueError("La cantidad recibida debe ser mayor que cero.")

                if parsed_item_id in received_by_item:
                    raise ValueError("Hay productos duplicados en la recepción.")

                received_by_item[parsed_item_id] = quantity

            # Bloquea la orden para reducir recepciones simultáneas.
            order = (
                PurchaseOrderModel.query
                .filter_by(id=order_id)
                .with_for_update()
                .first()
            )

            if not order:
                raise ValueError("La orden de compra no existe.")

            if order.status in ("Recibida", "Cancelada"):
                raise ValueError("La orden ya está recibida o cancelada.")

            if not order.items:
                raise ValueError("La orden no contiene productos.")

            order_items = {item.id: item for item in order.items}

            if not set(received_by_item).issubset(order_items):
                raise ValueError("Uno o más productos no pertenecen a esta orden.")

            # Validar todas las cantidades antes de modificar datos.
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

                pending_quantity = requested - already_received

                if quantity > pending_quantity:
                    raise ValueError(
                        f"La cantidad recibida supera lo pendiente "
                        f"para el producto {item.product.name}."
                    )

            # Registrar la recepción usando el repositorio.
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

            # Actualizar el estado de la orden.
            all_received = all(
                (item.quantity_received or 0) == item.quantity
                for item in order.items
            )

            order.status = "Recibida" if all_received else "Parcial"

            # Una sola confirmación para orden, cantidades y movimientos.
            db.session.commit()

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

        except Exception:
            db.session.rollback()
            raise

    def get_purchases_summary(self):
        total_orders = PurchaseOrderModel.query.count()

        pending_orders = PurchaseOrderModel.query.filter_by(
            status="Pendiente"
        ).count()

        partial_orders = PurchaseOrderModel.query.filter_by(
            status="Parcial"
        ).count()

        received_orders = PurchaseOrderModel.query.filter_by(
            status="Recibida"
        ).count()

        cancelled_orders = PurchaseOrderModel.query.filter_by(
            status="Cancelada"
        ).count()

        total_spent = (
            db.session.query(
                db.func.sum(PurchaseOrderModel.total_amount)
            )
            .filter(PurchaseOrderModel.status == "Recibida")
            .scalar()
            or Decimal("0.00")
        )

        return {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "partial_orders": partial_orders,
            "received_orders": received_orders,
            "cancelled_orders": cancelled_orders,
            "total_spent": float(total_spent),
        }

    # ==========================================
    # FACTURAS DE PROVEEDORES / CUENTAS POR PAGAR
    # ==========================================
    def get_all_invoices(self):
        invoices = (
            PurchaseInvoiceModel.query
            .order_by(PurchaseInvoiceModel.invoice_date.desc())
            .all()
        )
        return [inv.to_dict() for inv in invoices]

    def create_invoice(self, data):
        try:
            if not isinstance(data, dict):
                raise ValueError("Los datos de la factura no son válidos.")

            invoice_number = str(data.get("invoice_number", "")).strip()
            purchase_order_id = data.get("purchase_order_id")
            amount_value = data.get("amount")
            invoice_date_value = data.get("invoice_date")
            due_date_value = data.get("due_date")
            file_url = data.get("file_url")

            if not invoice_number:
                raise ValueError("El número de factura es obligatorio.")

            if len(invoice_number) > 50:
                raise ValueError(
                    "El número de factura no puede superar 50 caracteres."
                )

            if (
                isinstance(purchase_order_id, bool)
                or not str(purchase_order_id).isdigit()
                or int(purchase_order_id) <= 0
            ):
                raise ValueError("El ID de la orden no es válido.")

            purchase_order_id = int(purchase_order_id)

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

            if file_url is not None:
                file_url = str(file_url).strip() or None

            existing_invoice = PurchaseInvoiceModel.query.filter_by(
                invoice_number=invoice_number
            ).first()

            if existing_invoice:
                raise ValueError("Ya existe una factura con ese número.")

            order = (
                PurchaseOrderModel.query
                .filter_by(id=purchase_order_id)
                .with_for_update()
                .first()
            )

            if not order:
                raise ValueError("La orden de compra no existe.")

            if order.status not in ("Recibida", "Parcial"):
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
                payment_status="Pendiente",
                payment_method=None,
                payment_date=None,
            )

            db.session.add(invoice)
            db.session.commit()

            return {
                "message": "Factura registrada correctamente.",
                "invoice": invoice.to_dict(),
            }

        except Exception:
            db.session.rollback()
            raise

    def process_invoice_payment(self, invoice_id, payment_data):
        try:
            if (
                isinstance(invoice_id, bool)
                or not str(invoice_id).isdigit()
                or int(invoice_id) <= 0
            ):
                raise ValueError("El ID de la factura no es válido.")

            if not isinstance(payment_data, dict):
                raise ValueError("Los datos del pago no son válidos.")

            invoice = (
                PurchaseInvoiceModel.query
                .filter_by(id=int(invoice_id))
                .with_for_update()
                .first()
            )

            if not invoice:
                raise ValueError("La factura no existe.")

            new_status = str(payment_data.get("payment_status", "")).strip()

            if new_status not in ("Pendiente", "Pagada"):
                raise ValueError("El estado de pago no es válido.")

            if invoice.payment_status == "Pagada" and new_status != "Pagada":
                raise ValueError(
                    "No se puede revertir una factura que ya figura como pagada."
                )

            if new_status == "Pagada":
                payment_method = str(payment_data.get("payment_method", "")).strip()

                if not payment_method:
                    raise ValueError("Debes indicar el método de pago registrado.")

                if len(payment_method) > 100:
                    raise ValueError(
                        "El método de pago no puede superar 100 caracteres."
                    )

                invoice.payment_status = "Pagada"
                invoice.payment_method = payment_method
                invoice.payment_date = datetime.utcnow()
            else:
                invoice.payment_status = "Pendiente"
                invoice.payment_method = None
                invoice.payment_date = None

            db.session.commit()

            return {
                "message": "Estado de la factura actualizado correctamente.",
                "invoice": invoice.to_dict(),
            }

        except Exception:
            db.session.rollback()
            raise

    def get_accounts_payable_summary(self):
        invoices = PurchaseInvoiceModel.query.all()

        total_pending = sum(
            (
                Decimal(str(inv.amount))
                for inv in invoices
                if inv.payment_status == "Pendiente"
            ),
            Decimal("0.00"),
        )

        total_paid = sum(
            (
                Decimal(str(inv.amount))
                for inv in invoices
                if inv.payment_status == "Pagada"
            ),
            Decimal("0.00"),
        )

        return {
            "total_pending": float(total_pending),
            "total_paid": float(total_paid),
            "total_invoices": len(invoices),
        }

    # ==========================================
    # HISTORIAL DE COMPRAS DE CLIENTES Y WOMPI
    # ==========================================

    # ==========================================
    # HISTORIAL DE COMPRAS DE CLIENTES
    # ==========================================

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
        """
        No procesa webhooks ni pagos reales.
        Se conserva el método temporalmente para evitar romper
        las rutas existentes mientras se adapta el módulo.
        """

        raise ValueError(
            "Los pagos reales están deshabilitados. "
            "Este proyecto utiliza exclusivamente simulaciones académicas."
        )

    def get_client_purchase_history(self, user_id):
        """
        Consulta el historial de compras de un cliente.

        El usuario debe estar autenticado y la autorización
        se verifica también en la capa de rutas.
        """

        if isinstance(user_id, bool):
            raise ValueError("El identificador del cliente no es válido.")

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise ValueError("El identificador del cliente no es válido.")

        if user_id <= 0:
            raise ValueError("El identificador del cliente no es válido.")

        user = db.session.get(UserModel, user_id)

        if not user:
            raise ValueError("El cliente no existe.")

        orders = (
            CustomerOrderModel.query
            .filter_by(user_id=user_id)
            .order_by(
                CustomerOrderModel.created_at.desc(),
                CustomerOrderModel.id.desc()
            )
            .all()
        )

        return [order.to_dict() for order in orders]

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