# =====================================================================
# Seed: puebla la base de datos con datos de prueba.
# ---------------------------------------------------------------------
# Ejecutar con: npm run db:seed
# Incluye: categorías, los productos del catálogo actual, un usuario
# admin demo, un usuario normal, promociones y ventas de ejemplo.
# El script es idempotente: no duplica lo que ya existe.
# =====================================================================
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from features.categories.infrastructure.models import CategoryModel
from features.orders.application.services import OrderService
from features.products.infrastructure.models import ProductModel
from features.promotions.application.services import PromotionService
from features.users.infrastructure.models import UserModel
from features.users.infrastructure.repository import ahora_utc

app = create_app()

CATEGORIAS = [
    {
        "name": "Whisky",
        "description": "Whisky escocés, irlandés, americano y japbnés.",
        "icon": "GiIceCubes",
    },
    {
        "name": "Ron",
        "description": "Rones añejos, especiados y de destilería.",
        "icon": "GiBrandyBottle",
    },
    {
        "name": "Vodka",
        "description": "Vodka blanco, saborizados y premium.",
        "icon": "GiBeerBottle",
    },
    {"name": "Tequila", "description": "Tequila blanco, reposado y añejo.", "icon": "GiGlassShot"},
    {"name": "Vino", "description": "Vinos tintos, blancos y espumosos.", "icon": "GiWineGlass"},
    {
        "name": "Champaña",
        "description": "Champaña y espumantes para celebraciones.",
        "icon": "GiSquareBottle",
    },
    {"name": "Cerveza", "description": "Cerveza nacional e importada.", "icon": "GiBeerStein"},
    {"name": "Cócteles", "description": "Cócteles listos para servir.", "icon": "GiMartini"},
    {
        "name": "Nacionales",
        "description": "Licores de producción nacional.",
        "icon": "GiWineBottle",
    },
    {"name": "Importados", "description": "Licores importados premium.", "icon": "GiEarthAmerica"},
]

# (nombre, categoria, precio, precio_anterior, descuento, stock, stock_min, imagen, destacado)
PRODUCTOS = [
    (
        "Reserva Ron Viejo de Caldas Esencial 12 Años",
        "Ron",
        65000,
        70000,
        "15%",
        18,
        5,
        "./src/ui/assets/ing/Products/LICOR_DE__RON_VIEJO_DE_CALDAS_ESENCIAL_12_750_ML-removebg-preview.png",
        True,
    ),
    (
        "Reserva Mast-Jagermeister",
        "Whisky",
        385000,
        450000,
        "15%",
        12,
        4,
        "./src/ui/assets/ing/Products/2603712280137549-removebg-preview.png",
        True,
    ),
    (
        "Reserva Don Julio Reposado",
        "Whisky",
        185000,
        250000,
        "15%",
        20,
        5,
        "./src/ui/assets/ing/Products/Don_Julio_Reposado-removebg-preview.png",
        True,
    ),
    (
        "Reserva Ámbar 12 Años",
        "Whisky",
        385000,
        450000,
        "15%",
        15,
        5,
        "./src/ui/assets/ing/Products/AGUARDIENTE AGUARDIENTE ROJO ANTIOQUEÑO 750ML.jpg",
        True,
    ),
    (
        "Aguardiente Antioqueño Sin Azúcar",
        "Nacionales",
        385000,
        450000,
        "15%",
        10,
        4,
        "./src/ui/assets/ing/Products/AGUARDIENTE ANTIOQUEÑO SIN AZUCAR TAPA AZUL 1000 ML.jpg",
        True,
    ),
    (
        "Reserva Buchanan's 12 Años",
        "Whisky",
        385000,
        450000,
        "15%",
        14,
        5,
        "./src/ui/assets/ing/Products/Buchanan_s_12_Years_Aged-removebg-preview.png",
        True,
    ),
    (
        "Reserva Club Colombia",
        "Cerveza",
        105000,
        120000,
        "15%",
        30,
        8,
        "./src/ui/assets/ing/Products/647673990202911566.jpg ",
        True,
    ),
    (
        "Águila",
        "Cerveza",
        5000,
        4500,
        "15%",
        80,
        20,
        "./src/ui/assets/ing/Products/20195898325118156.jpg",
        True,
    ),
    (
        "Sípack Corona",
        "Importados",
        25000,
        22000,
        "15%",
        40,
        10,
        "./src/ui/assets/ing/Products/43136108926806306-removebg-preview (1).png",
        True,
    ),
    (
        "Caja de Cerveza Águila",
        "Cerveza",
        75000,
        85000,
        "15%",
        0,
        12,
        "./src/ui/assets/ing/Products/455637687320506852-removebg-preview (1).png",
        True,
    ),
]

ADMIN_EMAIL = "admin@beerhouse.com"
ADMIN_PASSWORD = "Admin123!"
USER_EMAIL = "carlos@gmail.com"
USER_PASSWORD = "Carlos123!"

PROMOS = [
    {"code": "BEERHAPPY", "discount_percent": 15, "active": True},
    {"code": "FINDE10", "discount_percent": 10, "active": True},
    {"code": "OCTUBRE20", "discount_percent": 20, "active": False},
]


def semilla_categorias():
    creadas = 0
    for cat in CATEGORIAS:
        if not CategoryModel.query.filter_by(name=cat["name"]).first():
            db.session.add(CategoryModel(**cat, slug=cat["name"].lower(), created_at=ahora_utc()))
            creadas += 1
    db.session.commit()
    return creadas


def semilla_productos():
    creados = 0
    for (
        nombre,
        categoria,
        precio,
        precio_anterior,
        descuento,
        stock,
        min_stock,
        imagen,
        destacado,
    ) in PRODUCTOS:
        if ProductModel.query.filter_by(name=nombre).first():
            continue
        cat = CategoryModel.query.filter_by(name=categoria).first()
        if cat is None:
            continue
        db.session.add(
            ProductModel(
                name=nombre,
                description="",
                category_id=cat.id,
                price=precio,
                old_price=precio_anterior,
                discount=descuento,
                stock=stock,
                min_stock=min_stock,
                image_url=imagen,
                featured=destacado,
                active=True,
                created_at=ahora_utc(),
            )
        )
        creados += 1
    db.session.commit()
    return creados


def semilla_usuarios():
    creados = 0

    if not UserModel.query.filter_by(email=ADMIN_EMAIL).first():
        db.session.add(
            UserModel(
                name="Administrador",
                email=ADMIN_EMAIL,
                password=generate_password_hash(ADMIN_PASSWORD, method="pbkdf2:sha256"),
                rol="admin",
                terms_accepted_at=ahora_utc(),
                age_confirmed_at=ahora_utc(),
                terms_version="v1.0",
                created_at=ahora_utc(),
            )
        )
        creados += 1

    if not UserModel.query.filter_by(email=USER_EMAIL).first():
        db.session.add(
            UserModel(
                name="Carlos Pérez",
                email=USER_EMAIL,
                password=generate_password_hash(USER_PASSWORD, method="pbkdf2:sha256"),
                rol="user",
                terms_accepted_at=ahora_utc(),
                age_confirmed_at=ahora_utc(),
                terms_version="v1.0",
                created_at=ahora_utc(),
            )
        )
        creados += 1

    db.session.commit()
    return creados


def semilla_promociones():
    creadas = 0
    service = PromotionService()
    for promo in PROMOS:
        try:
            service.create_promotion(promo["code"], promo["discount_percent"], promo["active"])
            creadas += 1
        except ValueError:
            pass  # ya existe
    return creadas


def semilla_ventas():
    if ProductModel.query.count() == 0:
        return 0

    creadas = 0
    service = OrderService()
    productos = ProductModel.query.filter(
        ProductModel.name.in_(["Águila", "Reserva Don Julio Reposado", "Sípack Corona"])
    ).all()
    indice = {p.name: p for p in productos}

    ventas = [
        {
            "client_name": "Carlos Pérez",
            "client_email": USER_EMAIL,
            "payment_method": "Tarjeta de Crédito",
            "status": "completado",
            "items": [
                {
                    "product_id": indice["Águila"].id,
                    "product_name": "Águila",
                    "quantity": 6,
                    "unit_price": 5000,
                },
                {
                    "product_id": indice["Sípack Corona"].id,
                    "product_name": "Sípack Corona",
                    "quantity": 1,
                    "unit_price": 25000,
                },
            ],
        },
        {
            "client_name": "Mariana Gómez",
            "client_email": "mariana@gmail.com",
            "payment_method": "Nequi / Transferencia",
            "status": "pendiente",
            "items": [
                {
                    "product_id": indice["Reserva Don Julio Reposado"].id,
                    "product_name": "Reserva Don Julio Reposado",
                    "quantity": 1,
                    "unit_price": 185000,
                },
            ],
        },
    ]

    for venta in ventas:
        try:
            service.create_order(
                venta["client_name"],
                venta["client_email"],
                venta["payment_method"],
                venta["items"],
                venta["status"],
            )
            creadas += 1
        except ValueError as error:
            print(f"  [aviso] {error}")

    return creadas


def main():
    print("[seed] Cargando datos de prueba en beer_house...")

    with app.app_context():
        categorias = semilla_categorias()
        productos = semilla_productos()
        usuarios = semilla_usuarios()
        promos = semilla_promociones()
        ventas = semilla_ventas()

    print(f"  [ok] Categorias creadas: {categorias}")
    print(f"  [ok] Productos creados: {productos}")
    print(f"  [ok] Usuarios creados: {usuarios}")
    print(f"  [ok] Promociones creadas: {promos}")
    print(f"  [ok] Ventas creadas: {ventas}")
    print()
    print(f"  Usuario admin : {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"  Usuario normal: {USER_EMAIL} / {USER_PASSWORD}")


if __name__ == "__main__":
    main()
