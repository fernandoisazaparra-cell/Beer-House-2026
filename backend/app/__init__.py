
# =====================================================================
# Fábrica de la aplicación (create_app)
# =====================================================================

import os

from flask import Flask, jsonify
from flask_cors import CORS

from app.extensions import db, limiter, migrate
from app.health import health_bp
from app.scheduler import start_scheduler
from config.settings import Config

# ---------------------------------------------------------------------
# Blueprints
# ---------------------------------------------------------------------

from features.users.presentation.routes import auth_bp
from features.users.presentation.routes import users_bp
from features.products.presentation.routes import products_bp
from features.suppliers.presentation.routes import suppliers_bp
from features.inventory.presentation.routes import inventory_bp
from features.purchases.presentation.routes import purchases_bp
from features.dashboard.infrastructure.routes import dashboard_bp
from features.catalog.presentation.routes import catalog_bp
from features.promotions.presentation.routes import campaigns_bp
from features.customers.presentation.routes import customers_bp
from features.sales.presentation.routes import sales_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # -----------------------------------------------------------------
    # CORS
    # -----------------------------------------------------------------

    cors_origins = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    CORS(
        app,
        resources={
            r"/api/*": {"origins": cors_origins}
        },
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ]
    )

    # -----------------------------------------------------------------
    # Extensiones
    # -----------------------------------------------------------------

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # -----------------------------------------------------------------
    # Modelos SQLAlchemy
    # Importarlos antes de ejecutar migraciones.
    # -----------------------------------------------------------------

    import features.users.infrastructure.models  # noqa: F401
    import features.products.infrastructure.models  # noqa: F401
    import features.suppliers.infrastructure.models  # noqa: F401
    import features.inventory.infrastructure.models  # noqa: F401
    import features.purchases.infrastructure.models  # noqa: F401
    import features.catalog.infrastructure.models  # noqa: F401
    import features.promotions.infrastructure.models  # noqa: F401
    import features.customers.infrastructure.models  # noqa: F401
    import features.sales.infrastructure.models  # noqa: F401
    # -----------------------------------------------------------------
    # Blueprints
    # -----------------------------------------------------------------

    app.register_blueprint(health_bp)

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(products_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(purchases_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(sales_bp)

    app.register_blueprint(
        users_bp,
        url_prefix="/api/users"
    )

    app.register_blueprint(
        campaigns_bp,
        url_prefix="/api/campaigns"
    )

    app.register_blueprint(
        customers_bp,
        url_prefix="/api"
    )

    # -----------------------------------------------------------------
    # Manejador de errores
    # -----------------------------------------------------------------

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({
            "error": "too_many_requests",
            "message": (
                "Demasiados intentos. "
                "Inténtalo nuevamente más tarde."
            )
        }), 429

    # -----------------------------------------------------------------
    # Scheduler
    # -----------------------------------------------------------------

    if os.getenv("RUN_SCHEDULER", "true").lower() == "true":
        start_scheduler(app)

    return app
