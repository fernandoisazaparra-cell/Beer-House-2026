
from datetime import datetime

from app.extensions import db


# ==========================================
# 1. ÓRDENES DE COMPRA A PROVEEDORES
# ==========================================

class PurchaseOrderModel(db.Model):
    __tablename__ = "purchase_orders"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)

    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    supplier_id = db.Column(
        db.Integer,
        db.ForeignKey("suppliers.id"),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    status = db.Column(
        db.String(20),
        default="Pendiente",
        nullable=False
    )

    total_amount = db.Column(
        db.Numeric(10, 2),
        default=0.0
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    notes = db.Column(db.Text, nullable=True)

    supplier = db.relationship(
        "SupplierModel",
        lazy="joined"
    )

    items = db.relationship(
        "PurchaseOrderItemModel",
        backref="order",
        cascade="all, delete-orphan",
        lazy="joined"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "supplier_id": self.supplier_id,
            "supplier_name": (
                self.supplier.name if self.supplier else None
            ),
            "user_id": self.user_id,
            "status": self.status,
            "total_amount": float(self.total_amount or 0),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "notes": self.notes,
            "items": [
                item.to_dict()
                for item in self.items
            ]
        }


class PurchaseOrderItemModel(db.Model):
    __tablename__ = "purchase_order_items"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)

    purchase_order_id = db.Column(
        db.Integer,
        db.ForeignKey("purchase_orders.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(
        "quantity_requested",
        db.Integer,
        nullable=False
    )

    quantity_received = db.Column(
        db.Integer,
        default=0,
        nullable=True
    )

    unit_cost = db.Column(
        "unit_price",
        db.Numeric(10, 2),
        nullable=False
    )

    product = db.relationship(
        "ProductModel",
        lazy="joined"
    )

    def to_dict(self):
        quantity_requested = self.quantity or 0
        quantity_received = self.quantity_received or 0

        return {
            "id": self.id,
            "purchase_order_id": self.purchase_order_id,
            "product_id": self.product_id,
            "product_name": (
                self.product.name if self.product else None
            ),
            "quantity": quantity_requested,
            "quantity_requested": quantity_requested,
            "quantity_received": quantity_received,
            "pending_quantity": max(
                quantity_requested - quantity_received,
                0
            ),
            "unit_cost": float(self.unit_cost or 0),
            "subtotal": float(
                quantity_requested * (self.unit_cost or 0)
            )
        }


# ==========================================
# 2. HISTORIAL DE COMPRAS DE CLIENTES
# ==========================================

class CustomerOrderModel(db.Model):
    __tablename__ = "customer_orders"
    __table_args__ = {"extend_existing": True}

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Nullable temporalmente para permitir migrar
    # los registros históricos existentes.
    order_number = db.Column(
        db.String(50),
        unique=True,
        nullable=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # Nullable para conservar pedidos antiguos
    # que no tengan un producto relacionado.
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=True
    )

    # Datos históricos del producto al momento del pedido.
    product_name = db.Column(
        db.String(150),
        nullable=False
    )

    quantity = db.Column(
        db.Integer,
        nullable=False
    )

    unit_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    total_amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    payment_method = db.Column(
        db.String(50),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        default="PENDING",
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = db.relationship(
        "UserModel",
        backref=db.backref(
            "customer_orders",
            lazy=True
        )
    )

    product = db.relationship(
        "ProductModel"
    )

    # Una compra puede tener varios intentos de pago.
    # Esto permite conservar el historial de transacciones.
    payment_transactions = db.relationship(
        "PaymentTransactionModel",
        back_populates="order",
        lazy="select"
    )

    def to_dict(self):
        client_name = "N/A"

        if self.user:
            first_name = getattr(
                self.user,
                "first_name",
                ""
            ) or ""

            last_name = getattr(
                self.user,
                "last_name",
                ""
            ) or ""

            client_name = (
                f"{first_name} {last_name}".strip()
                or "N/A"
            )

        unit_price = float(self.unit_price or 0)
        quantity = self.quantity or 0

        return {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "client_name": client_name,
            "product_id": self.product_id,
            "product_name": self.product_name,
            "quantity": quantity,
            "unit_price": unit_price,
            "total": float(self.total_amount or 0),
            "total_amount": float(self.total_amount or 0),
            "payment_method": self.payment_method,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "items": [
                {
                    "id": self.product_id or self.id,
                    "product_id": self.product_id,
                    "product_name": self.product_name,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "subtotal": round(
                        unit_price * quantity,
                        2
                    )
                }
            ],
            "payments": [
                payment.to_dict()
                for payment in self.payment_transactions
            ]
        }


# ==========================================
# 3. TRANSACCIONES DE PAGO
# ==========================================

class PaymentTransactionModel(db.Model):
    __tablename__ = "payment_transactions"
    __table_args__ = {"extend_existing": True}

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("customer_orders.id"),
        nullable=False
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    transaction_reference = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    gateway_status = db.Column(
        db.String(50),
        nullable=False
    )

    amount = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    currency = db.Column(
        db.String(10),
        default="COP",
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    order = db.relationship(
        "CustomerOrderModel",
        back_populates="payment_transactions"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "user_id": self.user_id,
            "transaction_reference": self.transaction_reference,
            "gateway_status": self.gateway_status,
            "amount": float(self.amount or 0),
            "currency": self.currency,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            )
        }
