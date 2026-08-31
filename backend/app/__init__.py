# =====================================================================
# Fábrica de la aplicación (create_app)
# ---------------------------------------------------------------------
# Es la función que "arma" la app: carga la configuración, conecta la
# base de datos, registra las rutas y deja todo listo para arrancar.
# =====================================================================
import os

from flask import Flask, jsonify
from flask_cors import CORS

from app.extensions import db, limiter, migrate
from app.health import health_bp
from app.scheduler import start_scheduler
from config.settings import Config

# Importar los blueprints (rutas) que viven dentro de cada feature
from features.users.presentation.routes import auth_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Permite que el frontend (Vue/React) pueda llamar a la API
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    CORS(app, origins=CORS_ORIGINS)

    # Extensiones: base de datos, migraciones y límite de peticiones
    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # Importar los modelos para que SQLAlchemy/Alembic conozcan las tablas
    # (si los modelos no se importan, las migraciones no los detectan)
    import features.users.infrastructure.models  # noqa: F401

    # Rutas
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)

    # Tarea programada: limpiar registros expirados cada 15 minutos
    if os.getenv("RUN_SCHEDULER", "true").lower() == "true":
        start_scheduler(app)

    # Respuesta cuando Flask-Limiter bloquea una petición (código 429)
    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({
            "error": "too_many_requests",
            "message": "Demasiados intentos. Inténtalo nuevamente más tarde.",
        }), 429

    return app
