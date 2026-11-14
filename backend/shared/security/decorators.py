# Seguridad de rutas: token JWT + roles
#
# Uso:
#   @role_required(ADMIN, SUPERVISOR)   -> solo esos roles
#   @login_required                     -> cualquier usuario con sesión
#
# Dentro de la ruta: current_user(), current_user_id(), etc.
# El usuario sale SIEMPRE del token (Authorization: Bearer ...),
# nunca de un campo que mande el frontend.

from functools import wraps

import jwt
from flask import g, jsonify, request

from app.extensions import db
from config.settings import Config
from features.users.infrastructure.models import UserModel

from .roles import ROLE_LABELS


def _error(message: str, status: int):
    return jsonify({"error": message, "message": message}), status


def _get_bearer_token():
    header = request.headers.get("Authorization", "")
    if header.lower().startswith("bearer "):
        return header[7:].strip() or None
    return None


def check_roles(*allowed_roles):
    """
    Valida el token JWT y, opcionalmente, los roles permitidos.
    Devuelve None si la autenticación es correcta.
    """
    bearer_token = _get_bearer_token()
    if not bearer_token:
        return _error("No autorizado. Se requiere iniciar sesión.", 401)

    try:
        payload = jwt.decode(
            bearer_token,
            Config.JWT_SECRET,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        return _error("Tu sesión expiró. Inicia sesión nuevamente.", 401)
    except jwt.InvalidTokenError:
        return _error("Token inválido.", 401)

    user_id = payload.get("user_id")
    if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id <= 0:
        return _error("El token no contiene un usuario válido.", 401)

    user = db.session.get(UserModel, user_id)
    if not user:
        return _error("Usuario no encontrado.", 401)

    if allowed_roles and user.rol not in allowed_roles:
        return _error("No tienes permisos para realizar esta acción.", 403)

    g.current_user = user
    return None


def role_required(*allowed_roles):
    """Exige autenticación y uno de los roles indicados."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Permitir peticiones preflight CORS sin exigir token JWT
            if request.method == "OPTIONS":
                return "", 200

            denied = check_roles(*allowed_roles)
            if denied:
                return denied

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def login_required(fn):
    """Exige autenticación sin restringir el rol."""
    return role_required()(fn)


def current_user():
    return g.current_user


def current_user_id():
    return g.current_user.id


def current_user_name():
    user = g.current_user
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email


def current_role_label():
    """Devuelve el nombre traducido del rol."""
    return ROLE_LABELS.get(g.current_user.rol, g.current_user.rol)