# =====================================================================
# Casos de uso de productos
# =====================================================================
from ..infrastructure.repository import ProductRepository


def serializar(producto):
    return {
        "id": producto.id,
        "name": producto.name,
        "description": producto.description or "",
        "category_id": producto.category_id,
        "category": producto.category.name if producto.category else "",
        "price": float(producto.price),
        "old_price": float(producto.old_price) if producto.old_price is not None else None,
        "discount": producto.discount or "",
        "stock": producto.stock,
        "min_stock": producto.min_stock,
        "image_url": producto.image_url or "",
        "featured": bool(producto.featured),
        "active": bool(producto.active),
        "created_at": producto.created_at.isoformat() if producto.created_at else None,
    }


class ProductService:
    def __init__(self):
        self.repository = ProductRepository()

    def get_products(self, active_only=False, category=None):
        if active_only:
            return [serializar(p) for p in self.repository.get_active(category)]
        return [serializar(p) for p in self.repository.get_all()]

    def get_product(self, product_id):
        product = self.repository.get_by_id(product_id)
        if product is None:
            raise ValueError("Producto no encontrado")
        return serializar(product)

    def get_low_stock(self):
        return [serializar(p) for p in self.repository.get_low_stock()]

    def create_product(self, data):
        if not (data.get("name") or "").strip():
            raise ValueError("El nombre del producto es obligatorio")
        if data.get("price") is None or float(data["price"]) < 0:
            raise ValueError("El precio debe ser mayor o igual a 0")

        product = self.repository.create(data)
        return serializar(product)

    def update_product(self, product_id, data):
        product = self.repository.get_by_id(product_id)
        if product is None:
            raise ValueError("Producto no encontrado")

        if "name" in data and data["name"] is not None and not str(data["name"]).strip():
            raise ValueError("El nombre del producto es obligatorio")
        if data.get("price") is not None and float(data["price"]) < 0:
            raise ValueError("El precio debe ser mayor o igual a 0")

        # Mantener solo los campos que existen en el modelo
        campos = {
            "name",
            "description",
            "category_id",
            "price",
            "old_price",
            "discount",
            "stock",
            "min_stock",
            "image_url",
            "featured",
            "active",
        }
        datos_validos = {k: v for k, v in data.items() if k in campos and v is not None}
        product = self.repository.update(product, datos_validos)
        return serializar(product)

    def adjust_stock(self, product_id, cantidad):
        product = self.repository.get_by_id(product_id)
        if product is None:
            raise ValueError("Producto no encontrado")
        return serializar(self.repository.adjust_stock(product, cantidad))

    def delete_product(self, product_id):
        product = self.repository.get_by_id(product_id)
        if product is None:
            raise ValueError("Producto no encontrado")
        self.repository.delete(product)
        return {"message": "Producto eliminado"}
