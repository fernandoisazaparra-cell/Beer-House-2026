from app.extensions import db
from features.categories.infrastructure.models import CategoryModel


class ProductModel(db.Model):
    __tablename__ = "products"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    old_price = db.Column(db.Numeric(12, 2), nullable=True)
    discount = db.Column(db.String(10), nullable=True)
    stock = db.Column(db.Integer, nullable=False, default=0)
    min_stock = db.Column(db.Integer, nullable=False, default=5)
    image_url = db.Column(db.String(500), nullable=True)
    featured = db.Column(db.Boolean, nullable=False, default=False)
    active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False)

    category = db.relationship(CategoryModel, backref="products")

    def __repr__(self):
        return f"<ProductModel {self.name}>"
