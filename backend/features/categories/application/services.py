# =====================================================================
# Casos de uso de categorías
# =====================================================================
import re

from ..infrastructure.repository import CategoryRepository


def generar_slug(nombre):
    """Convierte 'Cerveza Artesanal' en 'cerveza-artesanal'."""
    slug = nombre.strip().lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug or "categoria"


def serializar(categoria):
    return {
        "id": categoria.id,
        "name": categoria.name,
        "slug": categoria.slug,
        "description": categoria.description or "",
        "icon": categoria.icon or "",
        "created_at": categoria.created_at.isoformat() if categoria.created_at else None,
    }


class CategoryService:
    def __init__(self):
        self.repository = CategoryRepository()

    def get_categories(self):
        return [serializar(cat) for cat in self.repository.get_all()]

    def get_category(self, category_id):
        categoria = self.repository.get_by_id(category_id)
        if categoria is None:
            raise ValueError("Categoría no encontrada")
        return serializar(categoria)

    def create_category(self, name, description=None, icon=None):
        name = (name or "").strip()
        if not name:
            raise ValueError("El nombre de la categoría es obligatorio")

        slug = generar_slug(name)
        if self.repository.get_by_slug(slug):
            raise ValueError("Ya existe una categoría con ese nombre")

        categoria = self.repository.create(name, slug, description, icon)
        return serializar(categoria)

    def update_category(self, category_id, name=None, description=None, icon=None):
        categoria = self.repository.get_by_id(category_id)
        if categoria is None:
            raise ValueError("Categoría no encontrada")

        name = (name or "").strip() if name is not None else categoria.name
        if not name:
            raise ValueError("El nombre de la categoría es obligatorio")

        slug = generar_slug(name)
        existente = self.repository.get_by_slug(slug)
        if existente and existente.id != categoria.id:
            raise ValueError("Ya existe una categoría con ese nombre")

        categoria = self.repository.update(
            categoria,
            name,
            slug,
            description if description is not None else categoria.description,
            icon if icon is not None else categoria.icon,
        )
        return serializar(categoria)

    def delete_category(self, category_id):
        categoria = self.repository.get_by_id(category_id)
        if categoria is None:
            raise ValueError("Categoría no encontrada")
        if categoria.products:
            raise ValueError("No se puede eliminar la categoría: tiene productos asociados")
        self.repository.delete(categoria)
        return {"message": "Categoría eliminada"}
