from app.extensions import db


class PromotionModel(db.Model):
    __tablename__ = "promotions"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), nullable=False, unique=True)
    discount_percent = db.Column(db.Integer, nullable=False, default=0)
    active = db.Column(db.Boolean, nullable=False, default=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f"<PromotionModel {self.code}>"
