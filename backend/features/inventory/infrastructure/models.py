from datetime import datetime
from app.extensions import db
from features.suppliers.infrastructure.models import SupplierModel


# ---------------------------------------------------------------------
# Historial de Movimientos de Inventario (RF-023, RF-027, RF-029)
# ---------------------------------------------------------------------
class InventoryMovementModel(db.Model):
    __tablename__ = "inventory_movements"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    movement_type = db.Column(db.String(30), nullable=False)  # 'ENTRY', 'ADJUSTMENT_OUT', 'ADJUSTMENT_IN', 'LOSS', 'ADJUSTMENT_AUTO'
    quantity = db.Column(db.Integer, nullable=False)
    invoice_number = db.Column(db.String(50), nullable=True)
    reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones con lazy='joined'
    product = db.relationship("ProductModel", backref="movements", lazy="joined")
    supplier = db.relationship("SupplierModel", backref="movements", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "N/A",
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else "N/A",
            "user_id": self.user_id,
            "movement_type": self.movement_type,
            "quantity": self.quantity,
            "invoice_number": self.invoice_number or "",
            "reason": self.reason or "",
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }


# ---------------------------------------------------------------------
# Facturas de Compra (RF-040, RF-041 / RN-037, RN-038)
# ---------------------------------------------------------------------
class PurchaseInvoiceModel(db.Model):
    __tablename__ = "purchase_invoices"
    __table_args__ = (
        db.CheckConstraint(
            "payment_status IN ('Pendiente', 'Pagada')",
            name="check_purchase_invoice_payment_status"
        ),
        {'extend_existing': True}
    )

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey("purchase_orders.id"), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    invoice_date = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    file_url = db.Column(db.String(255), nullable=True)
    payment_status = db.Column(db.String(30), default="Pendiente", nullable=False)
    payment_date = db.Column(db.DateTime, nullable=True)
    payment_method = db.Column(db.String(50), nullable=True)

    order = db.relationship("PurchaseOrderModel", backref="invoices", lazy="joined")
    supplier = db.relationship("SupplierModel", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "purchase_order_id": self.purchase_order_id,
            "supplier_id": self.supplier_id,
            "supplier_name": self.supplier.name if self.supplier else "N/A",
            "amount": float(self.amount) if self.amount else 0.0,
            "invoice_date": self.invoice_date.strftime("%Y-%m-%d") if self.invoice_date else "",
            "due_date": self.due_date.strftime("%Y-%m-%d") if self.due_date else "",
            "file_url": self.file_url or "",
            "payment_status": self.payment_status,
            "payment_date": self.payment_date.strftime("%Y-%m-%d") if self.payment_date else None,
            "payment_method": self.payment_method or ""
        }


# ---------------------------------------------------------------------
# Conteos Físicos y Ajustes (RF-024 a RF-027 / RN-022 a RN-025)
# ---------------------------------------------------------------------
class PhysicalCountModel(db.Model):
    __tablename__ = "physical_counts"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    system_stock = db.Column(db.Integer, nullable=False)
    physical_stock = db.Column(db.Integer, nullable=False)
    difference_percentage = db.Column(db.Float, nullable=False)
    signed_act_url = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, nullable=False)
    count_date = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("ProductModel", backref="physical_counts", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "N/A",
            "system_stock": self.system_stock,
            "physical_stock": self.physical_stock,
            "difference": self.physical_stock - self.system_stock,
            "difference_percentage": round(self.difference_percentage or 0.0, 2),
            "signed_act_url": self.signed_act_url or "",
            "user_id": self.user_id,
            "count_date": self.count_date.isoformat() if self.count_date else None,
        }


# ---------------------------------------------------------------------
# Mermas y Pérdidas (RF-030 / RN-028)
# ---------------------------------------------------------------------
class LossRecordModel(db.Model):
    __tablename__ = "loss_records"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="Pendiente", nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    product = db.relationship("ProductModel", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "N/A",
            "quantity": self.quantity,
            "reason": self.reason,
            "status": self.status,
            "user_id": self.user_id,
            "approved_by": self.approved_by,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }