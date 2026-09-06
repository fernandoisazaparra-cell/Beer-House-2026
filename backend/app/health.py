# Ruta de salud: comprueba que el servidor y la base de datos respondan.
import logging

from flask import Blueprint, jsonify

from app.extensions import db, limiter

logger = logging.getLogger(__name__)
health_bp = Blueprint("health", __name__)

@health_bp.get("/test_conexion")
@limiter.limit("60 per minute")
def test():
    try:
        # SELECT 1 es la consulta más básica: "respondes, base de datos?"
        db.session.execute(db.text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as error:
        logger.error(f"Health check failed: {error}")
        return jsonify({"status": "error", "message": "Servicio no disponible"}), 500
