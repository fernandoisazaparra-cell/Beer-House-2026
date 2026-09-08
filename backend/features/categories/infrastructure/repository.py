# =====================================================================
# Acceso a la base de datos de categorías
# =====================================================================
from app.extensions import db
from features.users.infrastructure.repository import ahora_utc

from .models import CategoryModel


class CategoryRepository:
    def get_all(self):
        return CategoryModel.query.order_by(CategoryModel.name.asc()).all()

    def get_by_id(self, category_id):
        return CategoryModel.query.get(category_id)

    def get_by_name(self, name):
        return CategoryModel.query.filter_by(name=name).first()

    def get_by_slug(self, slug):
        return CategoryModel.query.filter_by(slug=slug).first()

    def create(self, name, slug, description, icon):
        model = CategoryModel(
            name=name,
            slug=slug,
            description=description,
            icon=icon,
            created_at=ahora_utc(),
        )
        db.session.add(model)
        db.session.commit()
        return model

    def update(self, category, name, slug, description, icon):
        category.name = name
        category.slug = slug
        category.description = description
        category.icon = icon
        db.session.commit()
        return category

    def delete(self, category):
        db.session.delete(category)
        db.session.commit()
