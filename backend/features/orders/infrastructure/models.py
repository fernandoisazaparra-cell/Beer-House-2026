from app.extensions import db


class OrderModel(db.Model):
    __tablename__ = "orders"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), nullable=False, unique=True)
    client_name = db.Column(db.String(150), nullable=False)
    client_email = db.Column(db.String(255), nullable=True)
    total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    status = db.Column(db.String(20), nullable=False, default="pendiente")
    payment_method = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)

    items = db.relationship(
        "OrderItemModel",
        backref="order",
        cascade="all, delete-orphan",
        order_by="OrderItemModel.id",
    )

    def __repr__(self):
        return f"<OrderModel {self.code}>"


class OrderItemModel(db.Model):
    __tablename__ = "order_items"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    product_name = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    def __repr__(self):
        return f"<OrderItemModel {self.product_name} x{self.quantity}>"
