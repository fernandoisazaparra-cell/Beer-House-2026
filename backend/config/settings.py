
# =====================================================================
# Configuración general de Beer House
# =====================================================================

import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()


class Config:

    # -----------------------------------------------------------------
    # Base de datos MySQL
    # -----------------------------------------------------------------

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "beer_house")

    # En Railway se define MYSQL_PUBLIC_URL con el formato:
    # mysql://usuario:password@host:puerto/base
    # Si existe, tiene prioridad sobre las variables DB_*.
    MYSQL_PUBLIC_URL = os.getenv("MYSQL_PUBLIC_URL", "").strip()

    if MYSQL_PUBLIC_URL:
        # SQLAlchemy necesita el driver en el esquema.
        uri = MYSQL_PUBLIC_URL
        if uri.startswith("mysql://"):
            uri = "mysql+pymysql://" + uri[len("mysql://"):]

        # Railway ya entrega las credenciales codificadas: no se
        # debe volver a aplicar quote_plus sobre la URL completa.
        if "charset=" not in uri:
            uri += ("&" if "?" in uri else "?") + "charset=utf8mb4"

        SQLALCHEMY_DATABASE_URI = uri
    else:
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://"
            f"{quote_plus(DB_USER)}:"
            f"{quote_plus(DB_PASSWORD)}@"
            f"{DB_HOST}:{DB_PORT}/"
            f"{DB_NAME}?charset=utf8mb4"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # -----------------------------------------------------------------
    # JWT - Autenticación
    # -----------------------------------------------------------------

    JWT_SECRET = os.getenv("JWT_SECRET")

    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET no está definido en las variables de entorno."
        )

    JWT_EXPIRATION_HOURS = int(
        os.getenv("JWT_EXPIRATION_HOURS", "24")
    )

    # -----------------------------------------------------------------
    # Entorno de ejecución
    # -----------------------------------------------------------------

    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    TESTING = os.getenv("FLASK_TESTING", "false").lower() == "true"

