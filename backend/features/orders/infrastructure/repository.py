# =====================================================================
# Acceso a la base de datos de pedidos/ventas
# =====================================================================
from app.extensions import db
from features.users.infrastructure.repository import ahora_utc

from .models import OrderItemModel, OrderModel


class OrderRepository:
    def get_all(self):
        return OrderModel.query.order_by(OrderModel.created_at.desc()).all()

    def get_by_id(self, order_id):
        return OrderModel.query.get(order_id)

    def get_by_code(self, code):
        return OrderModel.query.filter_by(code=code).first()

    def count(self):
        return OrderModel.query.count()

    def total_income(self):
        return db.session.query(db.func.coalesce(db.func.sum(OrderModel.total), 0)).scalar()

    def create(self, client_name, client_email, payment_method, items, status="completado"):
        """Crea una orden con sus items y guarda todo en una transacción."""
        order = OrderModel(
            code=self._next_code(),
            client_name=client_name,
            client_email=client_email,
            total=0,
            status=status,
            payment_method=payment_method,
            created_at=ahora_utc(),
        )
        db.session.add(order)
        db.session.flush()

        total = 0
        for item in items:
            subtotal = item["quantity"] * item["unit_price"]
            total += subtotal
            order.items.append(
                OrderItemModel(
                    product_id=item.get("product_id"),
                    product_name=item["product_name"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                )
            )

        order.total = total
        db.session.commit()
        return order

    def update_status(self, order, status):
        order.status = status
        db.session.commit()
        return order

    def _next_code(self):
        ultimo = OrderModel.query.order_by(OrderModel.id.desc()).first()
        numero = (ultimo.id + 1) if ultimo else 1
        return f"ORD-{numero:04d}"
