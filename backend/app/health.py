
# =====================================================================
# Health Check - Beer House
# Comprueba el estado del servidor y la conexión con MySQL.
# =====================================================================

import logging

from flask import Blueprint, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db, limiter

logger = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__)


# ---------------------------------------------------------------------
# Comprobar servidor y base de datos
# ---------------------------------------------------------------------

@health_bp.get("/test_conexion")
@limiter.limit("60 per minute")
def test():

    try:
        # Comprobar conexión con la base de datos.
        db.session.execute(text("SELECT 1"))

        return jsonify({
            "status": "ok",
            "database": "connected",
            "message": "Servidor y base de datos funcionando correctamente."
        }), 200

    except SQLAlchemyError:
        db.session.rollback()

        logger.exception(
            "Error al comprobar la conexión con la base de datos."
        )

        return jsonify({
            "status": "error",
            "database": "disconnected",
            "message": "No fue posible conectar con la base de datos."
        }), 503

    except Exception:
        db.session.rollback()

        logger.exception(
            "Error inesperado en el health check."
        )

        return jsonify({
            "status": "error",
            "message": "Servicio no disponible."
        }), 500

