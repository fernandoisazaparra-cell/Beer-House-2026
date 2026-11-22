
from datetime import datetime, date

from sqlalchemy import func

from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.users.infrastructure.models import UserModel
from features.sales.infrastructure.models import SaleModel, SaleItemModel
from features.inventory.infrastructure.models import (
    LossRecordModel,
    PhysicalCountModel,
)


class DashboardService:

    def get_summary(self):
        now = datetime.now()
        month_start = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )

        active_products = (
            ProductModel.query
            .filter(ProductModel.is_active.is_(True))
            .count()
        )

        low_stock = (
            ProductModel.query
            .filter(
                ProductModel.is_active.is_(True),
                ProductModel.stock <= ProductModel.min_stock
            )
            .order_by(ProductModel.stock.asc())
            .limit(10)
            .all()
        )

        total_customers = (
            UserModel.query
            .filter(UserModel.rol == "user")
            .count()
        )

        monthly_sales_count = (
            SaleModel.query
            .filter(SaleModel.created_at >= month_start)
            .count()
        )

        pending_losses = (
            LossRecordModel.query
            .filter(LossRecordModel.status == "Pendiente")
            .count()
        )

        monthly_physical_counts = (
            PhysicalCountModel.query
            .filter(PhysicalCountModel.count_date >= month_start)
            .count()
        )

        return {
            "metrics": {
                "active_products": active_products,
                "total_customers": total_customers,
                "monthly_orders": monthly_sales_count,
                "pending_losses": pending_losses,
                "monthly_physical_counts": monthly_physical_counts,
            },
            "low_stock_items": [
                {
                    "id": product.id,
                    "name": product.name,
                    "stock": product.stock,
                    "min_stock": product.min_stock,
                }
                for product in low_stock
            ],
        }

    # -----------------------------------------------------------------
    # RF-047 / RI-047 / RN-044: reporte de ventas por producto.
    # Solo ventas pagadas, dentro de un periodo, con nº de clientes distinto.
    # -----------------------------------------------------------------
    def get_sales_by_product(self, date_from=None, date_to=None):
        def parsear(valor, nombre):
            if not valor:
                return None
            try:
                return datetime.combine(
                    date.fromisoformat(str(valor)), datetime.min.time()
                )
            except ValueError:
                raise ValueError(f"{nombre} debe tener formato AAAA-MM-DD.") from None

        inicio = parsear(date_from, "date_from")
        fin = parsear(date_to, "date_to")

        if inicio and fin and fin < inicio:
            raise ValueError("date_to no puede ser anterior a date_from.")

        consulta = (
            db.session.query(
                SaleItemModel.product_id,
                SaleItemModel.product_name,
                func.sum(SaleItemModel.quantity).label("quantity"),
                func.count(func.distinct(SaleModel.user_id)).label("clients"),
                func.sum(SaleItemModel.subtotal).label("revenue"),
            )
            .join(SaleModel, SaleItemModel.sale_id == SaleModel.id)
            .filter(SaleModel.status == "PAID")
        )

        if inicio:
            consulta = consulta.filter(
                func.coalesce(SaleModel.paid_at, SaleModel.created_at) >= inicio
            )
        if fin:
            consulta = consulta.filter(
                func.coalesce(SaleModel.paid_at, SaleModel.created_at) < fin.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )
            )

        filas = (
            consulta.group_by(
                SaleItemModel.product_id, SaleItemModel.product_name
            )
            .order_by(func.sum(SaleItemModel.quantity).desc())
            .all()
        )

        periodo = (
            f"{inicio.date().isoformat() if inicio else 'inicio'} / "
            f"{fin.date().isoformat() if fin else 'hoy'}"
        )

        return {
            "period": periodo,
            "products": [
                {
                    "product_id": fila.product_id,
                    "product": fila.product_name,
                    "quantity_sold": int(fila.quantity or 0),
                    "clients": int(fila.clients or 0),
                    "revenue": float(fila.revenue or 0),
                    "period": periodo,
                }
                for fila in filas
            ],
        }

