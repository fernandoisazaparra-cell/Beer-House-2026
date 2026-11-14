from datetime import datetime

from app.extensions import db


class CatalogAccessLog(db.Model):
    """
    RF-022: registro de accesos y consultas al catálogo.
    Guarda fecha/hora, usuario y producto(s) consultados.
    RN-020: sirve para auditoría; usarlo para marketing requiere consentimiento.
    """

    __tablename__ = "catalog_access_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    action = db.Column(db.String(20), nullable=False)  # 'LIST' o 'DETAIL'
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    detail = db.Column(db.Text, nullable=True)  # filtros usados (JSON) e ids listados
    results_count = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)