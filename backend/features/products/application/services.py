import math

from features.products.infrastructure.models import normalize_legal_warning


class ProductValidationError(ValueError):
    """Datos de producto inválidos (responde 400)."""


class ProductNotFoundError(ValueError):
    """Producto inexistente (responde 404)."""


def _first_value(data, *keys):
    """Devuelve el primer valor presente y no vacío entre varios alias."""
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        return value
    return None


def _required_text(data, *keys, label):
    value = _first_value(data, *keys)
    if value is None:
        raise ProductValidationError(f"El {label} es obligatorio.")
    text = str(value).strip()
    if not text:
        raise ProductValidationError(f"El {label} es obligatorio.")
    return text


def _required_positive_number(data, *keys, label, integer=False):
    raw = _first_value(data, *keys)
    if raw is None:
        raise ProductValidationError(f"El {label} es obligatorio.")

    try:
        value = int(raw) if integer else float(raw)
    except (TypeError, ValueError):
        kind = "un número entero válido" if integer else "un número válido"
        raise ProductValidationError(f"El {label} debe ser {kind}.") from None

    if integer and isinstance(raw, float) and not raw.is_integer():
        raise ProductValidationError(f"El {label} debe ser un número entero válido.")
    if not math.isfinite(value) or value <= 0:
        raise ProductValidationError(f"El {label} debe ser mayor a 0.")
    return value


class ProductService:
    def __init__(self, repository):
        self.repository = repository

    def get_products(self, include_inactive=False):
        products = self.repository.get_all(include_inactive)
        return [product.to_dict() for product in products]

    def create_product(self, data):
        # RF-010 / RI-010: todos los campos obligatorios se validan en backend.
        if not isinstance(data, dict):
            raise ProductValidationError("Los datos del producto no son válidos.")

        payload = dict(data)
        payload.update({
            "name": _required_text(data, "name", "nombre", label="nombre"),
            "liquor_type": _required_text(
                data, "liquor_type", "category", "categoria", label="tipo/licor"
            ),
            "price": _required_positive_number(
                data, "price", "precio", label="precio"
            ),
            # RN-009: la cantidad inicial debe ser mayor a cero.
            "stock": _required_positive_number(
                data, "stock", "cantidad", label="stock inicial", integer=True
            ),
            "description": _required_text(
                data, "description", "descripcion", label="descripción"
            ),
            "image_url": _required_text(
                data, "image_url", "imageUrl", "imagen", label="imagen"
            ),
            "legal_warning": normalize_legal_warning(
                _first_value(data, "legal_warning")
            ),
        })

        product = self.repository.create(payload)
        return product.to_dict()

    def update_product(self, product_id: int, data: dict):
        if not isinstance(data, dict):
            raise ProductValidationError("Los datos del producto no son válidos.")

        product = self.repository.get_by_id(product_id)
        if not product:
            raise ProductNotFoundError("El producto no existe.")

        payload = dict(data)
        required_text_fields = (
            (("name", "nombre"), "name", "nombre"),
            (("liquor_type", "category", "categoria"), "liquor_type", "tipo/licor"),
            (("description", "descripcion"), "description", "descripción"),
            (("image_url", "imageUrl", "imagen"), "image_url", "imagen"),
        )
        for aliases, canonical, label in required_text_fields:
            if any(key in data and data[key] is not None for key in aliases):
                payload[canonical] = _required_text(data, *aliases, label=label)

        if any(key in data and data[key] is not None for key in ("price", "precio")):
            payload["price"] = _required_positive_number(
                data, "price", "precio", label="precio"
            )

        if "stock" in data and data["stock"] is not None:
            try:
                stock = int(data["stock"])
            except (TypeError, ValueError):
                raise ProductValidationError(
                    "El stock debe ser un número entero válido."
                ) from None
            if isinstance(data["stock"], float) and not data["stock"].is_integer():
                raise ProductValidationError(
                    "El stock debe ser un número entero válido."
                )
            # RN-009 aplica al alta; en edición se permite agotar (stock 0).
            if stock < 0:
                raise ProductValidationError("El stock no puede ser negativo.")
            payload["stock"] = stock

        if "legal_warning" in data:
            payload["legal_warning"] = normalize_legal_warning(data["legal_warning"])

        updated_product = self.repository.update(product, payload)
        return updated_product.to_dict()

    def delete_product(self, product_id):
        product = self.repository.get_by_id(product_id)

        if not product:
            raise ProductNotFoundError("El producto no existe.")

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
