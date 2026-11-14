
from datetime import datetime
from app.extensions import db

class SupplierModel(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    nit = db.Column(db.String(50), unique=True, nullable=False)  # RN-030: NIT Único
    representative = db.Column(db.String(150), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    payment_terms = db.Column(db.String(100), nullable=True)
    delivery_method = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # RF-036: Borrado lógico
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "nit": self.nit,
            "representative": self.representative or "",
            "email": self.email,
            "phone": self.phone,
            "address": self.address or "",
            "payment_terms": self.payment_terms or "",
            "delivery_method": self.delivery_method or "",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }