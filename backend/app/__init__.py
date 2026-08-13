from flask import Flask

from app.extensions import db, migrate
from app.routes import main_bp
from config.settings import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    app.register_blueprint(main_bp)

    from features.users.infrastructure.models import UserModel

    return app
