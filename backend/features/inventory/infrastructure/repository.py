
from app.extensions import db
from features.inventory.infrastructure.models import InventoryMovementModel
from features.products.infrastructure.models import ProductModel


class SQLAlchemyInventoryRepository:

    MOVEMENT_TYPES = {
        "ENTRY",
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT",
        "LOSS",
        "ADJUSTMENT_AUTO",
    }

    def create_movement(
        self,
        movement_type,
        product,
        quantity,
        user_id,
        supplier_id=None,
        invoice_number=None,
        reason=None,
    ):
        if not product:
            raise ValueError("El producto no existe.")

        if movement_type not in self.MOVEMENT_TYPES:
            raise ValueError("Tipo de movimiento no válido.")

        if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
            raise ValueError("La cantidad debe ser un entero mayor que cero.")

        if movement_type in {"ADJUSTMENT_OUT", "LOSS"}:
            if product.stock < quantity:
                raise ValueError("Stock insuficiente para realizar la salida.")
            product.stock -= quantity

        elif movement_type in {"ENTRY", "ADJUSTMENT_IN", "ADJUSTMENT_AUTO"}:
            product.stock += quantity

        movement = InventoryMovementModel(
            product_id=product.id,
            supplier_id=supplier_id,
            user_id=user_id,
            movement_type=movement_type,
            quantity=quantity,
            invoice_number=invoice_number,
            reason=reason,
        )

        db.session.add(movement)
        db.session.flush()

        return movement

    def get_low_stock_products(self):
        return ProductModel.query.filter(
            ProductModel.is_active.is_(True),
            ProductModel.stock <= ProductModel.min_stock,
        ).all()

    def get_movements_history(self, product_id=None):
        query = InventoryMovementModel.query

        if product_id is not None:
            query = query.filter_by(product_id=product_id)

        return query.order_by(
            InventoryMovementModel.created_at.desc()
        ).all()
