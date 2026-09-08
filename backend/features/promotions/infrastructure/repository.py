# =====================================================================
# Acceso a la base de datos de promociones
# =====================================================================
from app.extensions import db
from features.users.infrastructure.repository import ahora_utc

from .models import PromotionModel


class PromotionRepository:
    def get_all(self):
        return PromotionModel.query.order_by(PromotionModel.created_at.desc()).all()

    def get_by_id(self, promotion_id):
        return PromotionModel.query.get(promotion_id)

    def get_by_code(self, code):
        return PromotionModel.query.filter_by(code=code).first()

    def create(self, code, discount_percent, active, expires_at):
        model = PromotionModel(
            code=code,
            discount_percent=discount_percent,
            active=active,
            expires_at=expires_at,
            created_at=ahora_utc(),
        )
        db.session.add(model)
        db.session.commit()
        return model

    def update(self, promotion, code, discount_percent, active, expires_at):
        promotion.code = code
        promotion.discount_percent = discount_percent
        promotion.active = active
        promotion.expires_at = expires_at
        db.session.commit()
        return promotion

    def delete(self, promotion):
        db.session.delete(promotion)
        db.session.commit()
