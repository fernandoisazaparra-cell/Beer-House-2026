# =====================================================================
# Acceso a la base de datos de productos
# =====================================================================
from app.extensions import db
from features.users.infrastructure.repository import ahora_utc

from .models import ProductModel


class ProductRepository:
    def get_all(self):
        return ProductModel.query.order_by(ProductModel.created_at.desc()).all()

    def get_active(self, category=None):
        query = ProductModel.query.filter_by(active=True)
        if category:
            query = query.filter_by(category_id=category)
        return query.order_by(ProductModel.created_at.desc()).all()

    def get_by_id(self, product_id):
        return ProductModel.query.get(product_id)

    def get_low_stock(self):
        return (
            ProductModel.query.filter(ProductModel.stock <= ProductModel.min_stock)
            .order_by(ProductModel.stock.asc())
            .all()
        )

    def create(self, data):
        model = ProductModel(
            name=data["name"],
            description=data.get("description"),
            category_id=data.get("category_id"),
            price=data["price"],
            old_price=data.get("old_price"),
            discount=data.get("discount"),
            stock=data.get("stock", 0),
            min_stock=data.get("min_stock", 5),
            image_url=data.get("image_url"),
            featured=data.get("featured", False),
            active=data.get("active", True),
            created_at=ahora_utc(),
        )
        db.session.add(model)
        db.session.commit()
        return model

    def update(self, product, data):
        for campo, valor in data.items():
            if valor is not None:
                setattr(product, campo, valor)
        db.session.commit()
        return product

    def adjust_stock(self, product, cantidad):
        """Suma (o resta si es negativa) la cantidad al stock y lo guarda."""
        nuevo = product.stock + cantidad
        if nuevo < 0:
            raise ValueError("El stock no puede quedar en negativo")
        product.stock = nuevo
        db.session.commit()
        return product

    def delete(self, product):
        db.session.delete(product)
        db.session.commit()
