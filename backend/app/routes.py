from flask import Blueprint

from app.extensions import db

main_bp = Blueprint("main", __name__)

@main_bp.get("/test_Conexion")
def test():
    try:
        db.session.execute(db.text("SELECT 1"))

        return {"status": "ok", "database": "connected"}

    except Exception as error:
        return {"status": "error", "database": "disconnected", "message": str(error)}, 500
