# =====================================================================
# Casos de uso de pedidos/ventas
# =====================================================================
from ..infrastructure.repository import OrderRepository

ESTADOS_PERMITIDOS = {"pendiente", "completado", "cancelado"}


def serializar_orden(order, con_items=True):
    data = {
        "id": order.id,
        "code": order.code,
        "client_name": order.client_name,
        "client_email": order.client_email or "",
        "total": float(order.total),
        "status": order.status,
        "payment_method": order.payment_method or "",
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }
    if con_items:
        data["items"] = [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in order.items
        ]
    return data


class OrderService:
    def __init__(self):
        self.repository = OrderRepository()

    def get_orders(self, con_items=False):
        return [serializar_orden(o, con_items) for o in self.repository.get_all()]

    def get_order(self, order_id):
        order = self.repository.get_by_id(order_id)
        if order is None:
            raise ValueError("Pedido no encontrado")
        return serializar_orden(order, con_items=True)

    def create_order(self, client_name, client_email, payment_method, items, status="completado"):
        client_name = (client_name or "").strip()
        if not client_name:
            raise ValueError("El nombre del cliente es obligatorio")
        if not items:
            raise ValueError("La venta debe tener al menos un producto")
        if status not in ESTADOS_PERMITIDOS:
            raise ValueError("Estado de pedido inválido")

        from app.extensions import db

        try:
            self._descontar_stock(items)
            order = self.repository.create(client_name, client_email, payment_method, items, status)
        except ValueError:
            db.session.rollback()
            raise

        return serializar_orden(order, con_items=True)

    def _descontar_stock(self, items):
        from features.products.infrastructure.models import ProductModel

        for item in items:
            if not item.get("product_id"):
                continue
            product = ProductModel.query.get(item["product_id"])
            if product is None:
                continue
            if product.stock - item["quantity"] < 0:
                raise ValueError(f"Stock insuficiente para {product.name}")

        for item in items:
            if not item.get("product_id"):
                continue
            product = ProductModel.query.get(item["product_id"])
            if product is None:
                continue
            product.stock -= item["quantity"]
        # El commit lo hace el repository al guardar la orden

    def update_status(self, order_id, status):
        if status not in ESTADOS_PERMITIDOS:
            raise ValueError("Estado de pedido inválido")
        order = self.repository.get_by_id(order_id)
        if order is None:
            raise ValueError("Pedido no encontrado")
        return serializar_orden(self.repository.update_status(order, status))

    # ---------- Estadísticas del dashboard ----------
    def stats(self):
        pedidos = self.repository.count()
        completados = sum(1 for o in self.repository.get_all() if o.status == "completado")
        pendientes = sum(1 for o in self.repository.get_all() if o.status == "pendiente")
        ingresos = float(self.repository.total_income())
        return {
            "total_orders": pedidos,
            "completed_orders": completados,
            "pending_orders": pendientes,
            "total_income": ingresos,
        }
