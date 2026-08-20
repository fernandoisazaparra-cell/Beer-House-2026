from flask import Flask

from app.extensions import db, migrate
from flask_cors import CORS

from app.routes import main_bp
from features.users.presentation.routes import auth_bp

from config.settings import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=["http://localhost:5173"])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Routes
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)

    # Importar modelos para que SQLAlchemy los conozca
    from features.users.infrastructure.models import UserModel

    return app
