from datetime import datetime
from app.extensions import db

class CampaignModel(db.Model):
    __tablename__ = "campaigns"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    budget = db.Column(db.Numeric(10, 2), nullable=False)
    channels = db.Column(db.String(255), nullable=False)
    included_products = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default="PLANNING", nullable=False)
    
    closed_at = db.Column(db.DateTime, nullable=True)
    final_results = db.Column(db.Text, nullable=True)
    learnings = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    legal_approval = db.relationship("CampaignLegalApprovalModel", backref="campaign", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "start_date": self.start_date.strftime("%Y-%m-%d") if self.start_date else "",
            "end_date": self.end_date.strftime("%Y-%m-%d") if self.end_date else "",
            "budget": float(self.budget) if self.budget else 0.0,
            "channels": self.channels,
            "included_products": self.included_products,
            "status": self.status,
            "legal_approved": self.legal_approval.is_approved if self.legal_approval else False,
            "closed_at": self.closed_at.strftime("%Y-%m-%d %H:%M:%S") if self.closed_at else None,
            "final_results": self.final_results,
            "learnings": self.learnings
        }


class CampaignLegalApprovalModel(db.Model):
    __tablename__ = "campaign_legal_approvals"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id"), nullable=False)
    document_url = db.Column(db.String(255), nullable=False)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    approved_by = db.Column(db.String(100), nullable=True)
    approval_date = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "document_url": self.document_url,
            "is_approved": self.is_approved,
            "approved_by": self.approved_by,
            "approval_date": self.approval_date.strftime("%Y-%m-%d %H:%M:%S") if self.approval_date else ""
        }


class ComboModel(db.Model):
    __tablename__ = "combos"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Numeric(5, 2), default=0.0, nullable=False)
    image_url = db.Column(db.Text, nullable=True)
    stock = db.Column(db.Integer, default=0, nullable=False)
    status = db.Column(db.String(20), default="Activo", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship("ComboItemModel", backref="combo", cascade="all, delete-orphan", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price) if self.price else 0.0,
            "discount": float(self.discount) if self.discount else 0.0,
            "image_url": self.image_url or "",
            "stock": self.stock,
            "status": self.status,
            "items": [item.to_dict() for item in self.items]
        }


class ComboItemModel(db.Model):
    __tablename__ = "combo_items"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    combo_id = db.Column(db.BigInteger, db.ForeignKey("combos.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    product = db.relationship("ProductModel", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else "N/A",
            "quantity": self.quantity
        }