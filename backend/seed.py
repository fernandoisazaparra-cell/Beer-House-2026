import os
import sys

backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app
from app.extensions import db
from features.users.infrastructure.models import UserModel
from features.products.infrastructure.models import ProductModel
from features.suppliers.infrastructure.models import SupplierModel
from features.inventory.infrastructure.models import InventoryMovementModel
from werkzeug.security import generate_password_hash

app = create_app()

def seed_database():
    with app.app_context():
        # Elimina y recrea las tablas con la nueva estructura de columnas
        db.drop_all()
        db.create_all()

                # 1. Crear usuarios de prueba (uno por rol)
        from datetime import date, datetime

        ahora = datetime.utcnow()
        usuarios = [
            ("Administrador", "Beer House", "admin@beerhouse.com", "admin123", "admin"),
            ("Supervisor", "Beer House", "supervisor@beerhouse.com", "supervisor123", "supervisor"),
            ("Cliente", "Prueba", "cliente@beerhouse.com", "cliente123", "user"),
        ]
        for first_name, last_name, email, password, rol in usuarios:
            db.session.add(UserModel(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password=generate_password_hash(password),
                birth_date=date(1995, 1, 1),
                terms_accepted_at=ahora,
                age_confirmed_at=ahora,
                terms_version="v1.0",
                rol=rol,
            ))
            print(f" -> Usuario {rol} creado: {email}")
        db.session.commit()
        admin = UserModel.query.filter_by(email="admin@beerhouse.com").first()
        
        db.session.add(admin)
        db.session.commit()
        print(" -> Usuario Admin creado: admin@beerhouse.com")

        # 2. Crear Proveedor de prueba
        supplier = SupplierModel(
            name="Cervecería Nacional S.A.",
            nit="900123456-1",
            representative="Carlos Mendoza",
            email="contacto@cervecerianacional.com",
            phone="6044445566",
            address="Calle 50 # 45-20, Medellín",
            payment_terms="Contado",
            delivery_terms="Inmediato"
        )
        db.session.add(supplier)
        db.session.commit()
        print(" -> Proveedor de prueba creado.")

        # 3. Crear Productos de prueba
        prod1 = ProductModel(
            name="Cerveza Artesanal IPA 500ml",
            liquor_type="Cerveza",
            price=12000.0,
            stock=15,
            min_stock=10,
            description="Cerveza artesanal de intenso aroma a lúpulo."
        )
        prod2 = ProductModel(
            name="Ron Añejo 750ml",
            liquor_type="Ron",
            price=65000.0,
            stock=2,
            min_stock=5,
            description="Ron añejado en barricas de roble."
        )
        db.session.add_all([prod1, prod2])
        db.session.commit()
        print(" -> Productos de prueba creados.")

        # 4. Crear Movimiento de Inventario de prueba
        movement = InventoryMovementModel(
            product_id=prod1.id,
            supplier_id=supplier.id,
            user_id=admin.id,
            movement_type="ENTRY",
            quantity=15,
            invoice_number="FACT-2026-001",
            reason="Entrada inicial por compra a proveedor"
        )
        db.session.add(movement)
        db.session.commit()
        print(" -> Movimiento de inventario de prueba registrado.")

        print("\n¡Base de datos regenerada y poblada con éxito!")

if __name__ == "__main__":
    seed_database()