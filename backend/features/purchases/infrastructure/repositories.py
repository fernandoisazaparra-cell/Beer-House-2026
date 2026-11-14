from app.extensions import db
from features.purchases.infrastructure.models import (
    PurchaseOrderModel, 
    PurchaseOrderItemModel, 
    CustomerOrderModel, 
    PaymentTransactionModel
)

class PurchaseRepository:

    # --- Proveedores (Existente)[cite: 15] ---
    def get_all(self):
        return PurchaseOrderModel.query.order_by(PurchaseOrderModel.created_at.desc()).all()

    def get_by_id(self, order_id):
        return PurchaseOrderModel.query.get(order_id)

    def count_orders(self):
        return PurchaseOrderModel.query.count()

    def save(self, order: PurchaseOrderModel):
        db.session.add(order)
        db.session.commit()
        return order

    # --- Clientes y Pagos Wompi (Nuevo) ---
    def get_all_customer_orders(self):
        return CustomerOrderModel.query.order_by(CustomerOrderModel.created_at.desc()).all()

    def get_customer_orders_by_user(self, user_id):
        return CustomerOrderModel.query.filter_by(user_id=user_id).order_by(CustomerOrderModel.created_at.desc()).all()

    def save_customer_order(self, order: CustomerOrderModel):
        db.session.add(order)
        db.session.commit()
        return order

    def save_payment_transaction(self, transaction: PaymentTransactionModel):
        db.session.add(transaction)
        db.session.commit()
        return transaction