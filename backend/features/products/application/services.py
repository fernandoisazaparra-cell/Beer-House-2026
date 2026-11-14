
class ProductService:

    def __init__(self, repository):
        self.repository = repository

    def get_products(self, include_inactive=False):
        products = self.repository.get_all(include_inactive)
        return [product.to_dict() for product in products]

    def create_product(self, data):
        if not isinstance(data, dict):
            raise ValueError("Los datos del producto no son válidos.")

        # RN-009: el stock inicial debe ser mayor a cero.
        try:
            stock = int(data.get("stock", 0))
        except (TypeError, ValueError):
            raise ValueError("El stock debe ser un número entero válido.")

        if stock <= 0:
            raise ValueError("El stock inicial debe ser mayor a 0.")

        product = self.repository.create(data)
        return product.to_dict()

    def update_product(self, product_id: int, data: dict):
        if not isinstance(data, dict):
            raise ValueError("Los datos del producto no son válidos.")

        # Obtener el producto.
        product = self.repository.get_by_id(product_id)

        if not product:
            raise ValueError("El producto no existe.")

        # Validar stock si se envía.
        if "stock" in data:
            try:
                stock = int(data["stock"])
            except (TypeError, ValueError):
                raise ValueError("El stock debe ser un número entero válido.")

            if stock < 0:
                raise ValueError("El stock no puede ser negativo.")

        updated_product = self.repository.update(product, data)
        return updated_product.to_dict()

    def delete_product(self, product_id):
        product = self.repository.get_by_id(product_id)

        if not product:
            raise ValueError("El producto no existe.")

        self.repository.soft_delete(product)

        return {
            "message": f"Producto '{product.name}' desactivado correctamente."
        }


class ComboService:

    def __init__(self, repository):
        self.repository = repository

    def get_combos(self):
        combos = self.repository.get_all()
        return [combo.to_dict() for combo in combos]

    def create_combo(self, data):
        if not isinstance(data, dict):
            raise ValueError("Los datos del combo no son válidos.")

        if not data.get("name"):
            raise ValueError("El nombre del combo es obligatorio.")

        if data.get("price") is None:
            raise ValueError("El precio del combo es obligatorio.")

        return self.repository.save(data)

    def update_combo(self, combo_id, data):
        if not isinstance(data, dict):
            raise ValueError("Los datos del combo no son válidos.")

        return self.repository.update(combo_id, data)

    def delete_combo(self, combo_id):
        return self.repository.delete(combo_id)
