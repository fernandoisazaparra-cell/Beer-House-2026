from app.extensions import db
from features.products.infrastructure.models import (
    Combo,
    ProductModel,
    normalize_legal_warning,
)

class SQLAlchemyProductRepository:

    def get_all(self, include_inactive: bool = False):
        if include_inactive:
            return ProductModel.query.all()
        return ProductModel.query.filter_by(is_active=True).all()

    def get_by_id(self, product_id: int):
        return ProductModel.query.get(product_id)

    def create(self, data: dict):
        try:
            # RF-010 / RI-010: el repositorio no inventa valores ni placeholders.
            name = data.get("name") or data.get("nombre")
            liquor_type = (
                data.get("liquor_type")
                or data.get("category")
                or data.get("categoria")
            )
            raw_price = data.get("price") if data.get("price") is not None else data.get("precio")
            raw_stock = data.get("stock") if data.get("stock") is not None else data.get("cantidad")
            description = data.get("description") or data.get("descripcion")
            image_url = data.get("image_url") or data.get("imageUrl") or data.get("imagen")

            if not name or not liquor_type or not description or not image_url:
                raise ValueError(
                    "Nombre, tipo/licor, imagen y descripción son obligatorios."
                )

            try:
                price = float(raw_price)
                stock = int(raw_stock)
            except (TypeError, ValueError):
                raise ValueError("Precio y stock deben ser números válidos.") from None

            if price <= 0:
                raise ValueError("El precio debe ser mayor a 0.")
            # RN-009: el stock inicial debe ser mayor a cero.
            if stock <= 0:
                raise ValueError("El stock inicial debe ser mayor a 0.")

            new_product = ProductModel(
                name=str(name).strip(),
                liquor_type=str(liquor_type).strip(),
                price=price,
                stock=stock,
                description=str(description).strip(),
                image_url=str(image_url).strip(),
                legal_warning=normalize_legal_warning(data.get("legal_warning")),
            )

            db.session.add(new_product)
            db.session.commit()
            return new_product
        except Exception as e:
            db.session.rollback()
            raise e

    def update(self, product, data: dict):
        try:
            product.name = data.get("name") or data.get("nombre") or product.name
            product.liquor_type = (
                data.get("liquor_type") or 
                data.get("category") or 
                data.get("categoria") or 
                product.liquor_type
            )
            
            # Actualización de Precio
            if "price" in data or "precio" in data:
                raw_price = data.get("price") if data.get("price") is not None else data.get("precio")
                product.price = float(raw_price) if raw_price is not None else product.price

            # Actualización de Stock
            if "stock" in data:
                product.stock = int(data["stock"])

            product.description = data.get("description") or data.get("descripcion") or product.description

            # Imagen
            image_val = data.get("image_url") or data.get("imageUrl") or data.get("imagen")
            if image_val:
                product.image_url = image_val

            # RF-015: el texto legal se puede editar desde el formulario admin.
            if "legal_warning" in data and data["legal_warning"] is not None:
                product.legal_warning = normalize_legal_warning(data["legal_warning"])

            db.session.commit()
            return product
        except Exception as e:
            db.session.rollback()
            raise e

    def soft_delete(self, product):
        try:
            product.is_active = False
            db.session.commit()
            return product
        except Exception as e:
            db.session.rollback()
            raise e
class SQLAlchemyComboRepository:
    def get_all(self):
        return Combo.query.filter_by(status='active').all()

    def save(self, combo_data):
        new_combo = Combo(
            name=combo_data.get('name'),
            description=combo_data.get('description'),
            price=combo_data.get('price'),
            discount=combo_data.get('discount', 0.0),
            image_url=combo_data.get('image_url') or combo_data.get('imageUrl'),
            stock=combo_data.get('stock', 10),
            status=combo_data.get('status', 'active')
        )
        db.session.add(new_combo)
        db.session.commit()
        return new_combo.to_dict()
    def update(self, combo_id, data):
        combo = Combo.query.get(combo_id)
        if not combo:
            raise ValueError("Combo no encontrado.")
        
        combo.name = data.get('name', combo.name)
        combo.description = data.get('description', combo.description)
        combo.price = data.get('price', combo.price)
        combo.discount = data.get('discount', combo.discount)
        combo.image_url = data.get('image_url') or data.get('imageUrl') or combo.image_url
        combo.stock = data.get('stock', combo.stock)
        combo.status = data.get('status', combo.status)

        db.session.commit()
        return combo.to_dict()

    def delete(self, combo_id):
        combo = Combo.query.get(combo_id)
        if not combo:
            raise ValueError("Combo no encontrado.")
        
        db.session.delete(combo)
        db.session.commit()
        return {"message": "Combo eliminado exitosamente"}