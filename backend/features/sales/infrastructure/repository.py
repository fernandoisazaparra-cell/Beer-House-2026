
import re
from datetime import datetime, timedelta

from app.extensions import db
from features.inventory.infrastructure.models import InventoryMovementModel
from features.products.infrastructure.models import ProductModel

from ..domain.rules import FAILED, PAID, PENDING
from .models import SaleItemModel, SaleModel


_REFERENCE = re.compile(r"^BH[-x](\d+)(?:[-x][0-9a-f]+)?$")


class SQLAlchemySalesRepository:

    # ---------------- consultas ----------------
    def get_products(self, product_ids):
        if not product_ids:
            return {}

        rows = ProductModel.query.filter(
            ProductModel.id.in_(product_ids)
        ).all()

        return {p.id: p for p in rows}

    def get_sale_by_order_number(self, reference):
        """
        Referencia enviada a la pasarela -> venta.
        Wompi: BH-000012 o BH-000012-ab12cd
        PayU: BHx000012xab12cd
        """
        match = _REFERENCE.match(reference or "")

        return (
            db.session.get(SaleModel, int(match.group(1)))
            if match else None
        )

    def get_pending_sales(self, user_id=None, older_than_minutes=None):
        query = SaleModel.query.filter(
            SaleModel.status == PENDING
        )
    def get_sales_by_user(self, user_id):
        return (
        SaleModel.query
        .filter(SaleModel.user_id == user_id)
        .order_by(SaleModel.created_at.desc())
        .all()
    )

        if user_id is not None:
            query = query.filter(SaleModel.user_id == user_id)

        if older_than_minutes is not None:
            limit = datetime.utcnow() - timedelta(
                minutes=older_than_minutes
            )
            query = query.filter(SaleModel.created_at < limit)

        return query.all()

    # ---------------- escritura ----------------
    def create_sale(self, user_id, lines, total, payment_method, gateway_name):
        sale = SaleModel(
            user_id=user_id,
            status=PENDING,
            total=total,
            payment_method=payment_method,
            gateway=gateway_name,
        )

        for line in lines:
            sale.items.append(
                SaleItemModel(
                    product_id=line["product_id"],
                    product_name=line["name"],
                    unit_price=line["unit_price"],
                    quantity=line["quantity"],
                    subtotal=line["subtotal"],
                )
            )

        db.session.add(sale)
        db.session.flush()

        # La referencia se genera con el ID definitivo de la venta.
        sale.order_number = f"BH-{sale.id:06d}"

        db.session.flush()
        return sale

    def reserve_stock(self, product_id, quantity):
        updated = (
            ProductModel.query
            .filter(
                ProductModel.id == product_id,
                ProductModel.is_active.is_(True),
                ProductModel.stock >= quantity,
            )
            .update(
                {
                    ProductModel.stock:
                        ProductModel.stock - quantity
                },
                synchronize_session=False,
            )
        )

        return updated == 1

    def release_stock(self, product_id, quantity):
        (
            ProductModel.query
            .filter(ProductModel.id == product_id)
            .update(
                {
                    ProductModel.stock:
                        ProductModel.stock + quantity
                },
                synchronize_session=False,
            )
        )

    def add_movement(
        self, product_id, user_id, movement_type, quantity, reason
    ):
        db.session.add(
            InventoryMovementModel(
                product_id=product_id,
                user_id=user_id,
                movement_type=movement_type,
                quantity=quantity,
                reason=reason,
            )
        )

    def mark_paid(self, sale, result, payment_method=None):
        sale.status = PAID
        sale.payment_status = result.status
        sale.transaction_code = result.transaction_id
        sale.failure_reason = None
        sale.paid_at = datetime.utcnow()

        if payment_method:
            sale.payment_method = payment_method[:20]

    def mark_failed(self, sale, result, status=FAILED):
        sale.status = status
        sale.payment_status = result.status
        sale.transaction_code = result.transaction_id
        sale.failure_reason = (result.message or "")[:255]

    def set_status(self, sale, status, reason=None):
        sale.status = status
        sale.failure_reason = (reason or "")[:255] or None

    def commit(self):
        db.session.commit()

    def rollback(self):
        db.session.rollback()
