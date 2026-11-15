
from app.extensions import db
from sqlalchemy.dialects.mysql import LONGTEXT


class ProductModel(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    liquor_type = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    min_stock = db.Column(db.Integer, nullable=False, default=5)

    # LONGTEXT permite almacenar imágenes Base64 de gran tamaño.
    image_url = db.Column(LONGTEXT, nullable=True)

    description = db.Column(db.Text, nullable=True)
    legal_warning = db.Column(
        db.String(255),
        nullable=False,
        default="Prohibida la venta de bebidas embriagantes a menores de edad."
    )
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        precio_float = float(self.price) if self.price is not None else 0.0

        return {
            "id": self.id,
            "id_producto": self.id,
            "name": self.name,
            "nombre": self.name,
            "liquor_type": self.liquor_type,
            "category": self.liquor_type,
            "categoria": self.liquor_type,
            "price": precio_float,
            "precio": precio_float,
            "stock": self.stock,
            "min_stock": self.min_stock,
            "image_url": self.image_url,
            "imageUrl": self.image_url,
            "imagen": self.image_url,
            "description": self.description,
            "descripcion": self.description,
            "legal_warning": self.legal_warning,
            "is_active": self.is_active,
            "status": "Disponible" if self.stock > 0 else "Agotado"
        }


class Combo(db.Model):
    __tablename__ = "combos"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Numeric(5, 2), default=0.00)

    image_url = db.Column(LONGTEXT, nullable=True)
    stock = db.Column(db.Integer, default=10)
    status = db.Column(db.String(20), default="active")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price) if self.price is not None else 0.0,
            "discount": float(self.discount) if self.discount is not None else 0.0,
            "imageUrl": self.image_url,
            "stock": self.stock,
            "status": self.status
        }
