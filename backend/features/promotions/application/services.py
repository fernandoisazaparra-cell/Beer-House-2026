# =====================================================================
# Casos de uso de promociones
# =====================================================================
from ..infrastructure.repository import PromotionRepository


def serializar(promocion):
    return {
        "id": promocion.id,
        "code": promocion.code,
        "discount_percent": promocion.discount_percent,
        "active": bool(promocion.active),
        "expires_at": promocion.expires_at.isoformat() if promocion.expires_at else None,
        "created_at": promocion.created_at.isoformat() if promocion.created_at else None,
    }


class PromotionService:
    def __init__(self):
        self.repository = PromotionRepository()

    def get_promotions(self):
        return [serializar(p) for p in self.repository.get_all()]

    def get_promotion(self, promotion_id):
        promocion = self.repository.get_by_id(promotion_id)
        if promocion is None:
            raise ValueError("Promoción no encontrada")
        return serializar(promocion)

    def create_promotion(self, code, discount_percent, active, expires_at=None):
        code = (code or "").strip().upper()
        if not code:
            raise ValueError("El código de la promoción es obligatorio")
        if discount_percent is None or not (0 <= discount_percent <= 100):
            raise ValueError("El descuento debe estar entre 0 y 100")

        if self.repository.get_by_code(code):
            raise ValueError("Ya existe una promoción con ese código")

        promocion = self.repository.create(code, discount_percent, bool(active), expires_at)
        return serializar(promocion)

    def update_promotion(self, promotion_id, code, discount_percent, active, expires_at=None):
        promocion = self.repository.get_by_id(promotion_id)
        if promocion is None:
            raise ValueError("Promoción no encontrada")

        code = (code or "").strip().upper()
        if not code:
            raise ValueError("El código de la promoción es obligatorio")
        if discount_percent is not None and not (0 <= discount_percent <= 100):
            raise ValueError("El descuento debe estar entre 0 y 100")

        existente = self.repository.get_by_code(code)
        if existente and existente.id != promocion.id:
            raise ValueError("Ya existe una promoción con ese código")

        promocion = self.repository.update(
            promocion,
            code,
            discount_percent if discount_percent is not None else promocion.discount_percent,
            active if active is not None else promocion.active,
            expires_at if expires_at is not None else promocion.expires_at,
        )
        return serializar(promocion)

    def delete_promotion(self, promotion_id):
        promocion = self.repository.get_by_id(promotion_id)
        if promocion is None:
            raise ValueError("Promoción no encontrada")
        self.repository.delete(promocion)
        return {"message": "Promoción eliminada"}
