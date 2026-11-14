
from datetime import datetime

from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.users.infrastructure.models import UserModel
from features.sales.infrastructure.models import SaleModel
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

