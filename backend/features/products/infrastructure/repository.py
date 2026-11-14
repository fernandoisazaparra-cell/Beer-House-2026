from app.extensions import db
from features.products.infrastructure.models import ProductModel
from features.products.infrastructure.models import Combo

class SQLAlchemyProductRepository:

    def get_all(self, include_inactive: bool = False):
        if include_inactive:
            return ProductModel.query.all()
        return ProductModel.query.filter_by(is_active=True).all()

    def get_by_id(self, product_id: int):
        return ProductModel.query.get(product_id)

    def create(self, data: dict):
        try:
            name = data.get("name") or data.get("nombre")
            liquor_type = data.get("liquor_type") or data.get("category") or data.get("categoria") or "Licor"
            
            # Conversión segura de números
            raw_price = data.get("price") if data.get("price") is not None else data.get("precio", 0)
            price = float(raw_price) if raw_price else 0.0
            
            raw_stock = data.get("stock", 0)
            stock = int(raw_stock) if raw_stock else 0

            description = data.get("description") or data.get("descripcion") or ""
            image_url = data.get("image_url") or data.get("imageUrl") or data.get("imagen")

            new_product = ProductModel(
                name=name,
                liquor_type=liquor_type,
                price=price,
                stock=stock,
                description=description,
                image_url=image_url
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