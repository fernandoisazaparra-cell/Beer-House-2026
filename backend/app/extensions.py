
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


# ---------------------------------------------------------------------
# Base de datos
# ---------------------------------------------------------------------

db = SQLAlchemy()


# ---------------------------------------------------------------------
# Migraciones de base de datos
# ---------------------------------------------------------------------

migrate = Migrate()


# ---------------------------------------------------------------------
# Limitador de peticiones
# ---------------------------------------------------------------------

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day"],
    storage_uri="memory://",
    headers_enabled=True
)
