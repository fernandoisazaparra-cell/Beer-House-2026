# =====================================================================
# Seguridad compartida entre features
# ---------------------------------------------------------------------
# Decoradores para proteger rutas que requieren sesión (require_auth) o
# rol de administrador (require_admin). Reutilizan el JWT que ya genera
# AuthService y dejan el usuario autenticado en request.current_user.
# =====================================================================
from functools import wraps

from flask import jsonify, request

from features.users.application.services_auth import AuthService


def get_token():
    """Extrae el token del header Authorization: Bearer <token>."""
    return request.headers.get("Authorization", "").replace("Bearer ", "").strip()


def current_user():
    """Devuelve el UserModel autenticado o None si el token no es válido."""
    token = get_token()
    if not token:
        return None

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError:
        return None

    return service.repository.find_by_email(payload["email"])


def require_auth(view):
    """Exige un token válido. Deja el usuario en request.current_user."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({"message": "Token no proporcionado o inválido"}), 401
        request.current_user = user
        return view(*args, **kwargs)

    return wrapped


def require_admin(view):
    """Exige un token válido y rol 'admin'."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({"message": "Token no proporcionado o inválido"}), 401
        if user.rol != "admin":
            return jsonify({"message": "No tienes permisos de administrador"}), 403
        request.current_user = user
        return view(*args, **kwargs)

    return wrapped
