from sqlalchemy import func

from app.extensions import db
from features.products.infrastructure.models import ProductModel

from .models import CatalogAccessLog


def _visible():
    """Base de toda consulta del cliente: activos y con stock (RN-015 / RN-016)."""
    return ProductModel.query.filter(ProductModel.is_active.is_(True), ProductModel.stock > 0)


def _escape_like(text):
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class SQLAlchemyCatalogRepository:

    def search(self, search, types, min_price, max_price, order, page, per_page):
        query = _visible()

        if search:
            query = query.filter(ProductModel.name.ilike(f"%{_escape_like(search)}%", escape="\\"))
        if types:
            query = query.filter(ProductModel.liquor_type.in_(types))
        if min_price is not None:
            query = query.filter(ProductModel.price >= min_price)
        if max_price is not None:
            query = query.filter(ProductModel.price <= max_price)

        total = query.count()

        if order == "menor":
            query = query.order_by(ProductModel.price.asc(), ProductModel.id.desc())
        elif order == "mayor":
            query = query.order_by(ProductModel.price.desc(), ProductModel.id.desc())
        elif order == "nombre":
            query = query.order_by(ProductModel.name.asc())
        else:  # "recientes"
            query = query.order_by(ProductModel.id.desc())

        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    def get_type_counts(self):
        """Categorías reales con cuántos productos disponibles tiene cada una."""
        rows = (
            db.session.query(ProductModel.liquor_type, func.count(ProductModel.id))
            .filter(ProductModel.is_active.is_(True), ProductModel.stock > 0)
            .group_by(ProductModel.liquor_type)
            .order_by(ProductModel.liquor_type)
            .all()
        )
        return [{"name": name, "count": count} for name, count in rows]

    def get_price_bounds(self):
        low, high = (
            db.session.query(func.min(ProductModel.price), func.max(ProductModel.price))
            .filter(ProductModel.is_active.is_(True), ProductModel.stock > 0)
            .one()
        )
        return (float(low) if low is not None else 0.0, float(high) if high is not None else 0.0)

    def get_by_id(self, product_id):
        return db.session.get(ProductModel, product_id)

    def log_access(self, user_id, action, product_id=None, detail=None, results_count=None):
        db.session.add(
            CatalogAccessLog(
                user_id=user_id,
                action=action,
                product_id=product_id,
                detail=detail,
                results_count=results_count,
            )
        )
        db.session.commit()