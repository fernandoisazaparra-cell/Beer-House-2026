
from datetime import datetime

from app.extensions import db


class SaleModel(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)

    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    status = db.Column(db.String(20), nullable=False, default="PENDING")

    total = db.Column(db.Numeric(12, 2), nullable=False)

    payment_method = db.Column(db.String(30), nullable=False)
    gateway = db.Column(db.String(30), nullable=False)

    payment_status = db.Column(db.String(30), nullable=True)
    transaction_code = db.Column(db.String(150), nullable=True)
    failure_reason = db.Column(db.String(255), nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    paid_at = db.Column(db.DateTime, nullable=True)

    items = db.relationship(
        "SaleItemModel",
        backref="sale",
        lazy=True,
        cascade="all, delete-orphan",
    )

    user = db.relationship("UserModel", backref="sales")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "status": self.status,
            "total": float(self.total),
            "payment_method": self.payment_method,
            "gateway": self.gateway,
            "payment_status": self.payment_status,
            "transaction_code": self.transaction_code,
            "failure_reason": self.failure_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "items": [item.to_dict() for item in self.items],
        }


class SaleItemModel(db.Model):
    __tablename__ = "sale_items"

    id = db.Column(db.Integer, primary_key=True)

    sale_id = db.Column(
        db.Integer,
        db.ForeignKey("sales.id"),
        nullable=False,
        index=True,
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False,
    )

    # Conservamos el nombre y precio de cuando se realizó la venta.
    product_name = db.Column(db.String(150), nullable=False)

    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)

    product = db.relationship("ProductModel")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "unit_price": float(self.unit_price),
            "quantity": self.quantity,
            "subtotal": float(self.subtotal),
        }
