from flask import Blueprint, request, jsonify
from pydantic import BaseModel, EmailStr, ValidationError

from .error_helpers import (
    traducir_errores_pydantic,
    formatear_respuesta_errores,
    formatear_respuesta_mensaje
)
from ..application.auth_service import AuthService
from ..infrastructure.repository import SQLAlchemyUserRepository


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


auth_routes_bp = Blueprint('auth_routes', __name__, url_prefix='/auth')


@auth_routes_bp.post('/login')
def login():
    data = request.get_json(silent=True)
    if data is None:
        return formatear_respuesta_mensaje('Body JSON inválido o vacío')

    try:
        schema = LoginSchema(**data)
    except ValidationError as e:
        return formatear_respuesta_errores(traducir_errores_pydantic(e))

    repository = SQLAlchemyUserRepository()
    service = AuthService(repository)

    try:
        result = service.login(schema.email, schema.password)
    except ValueError as e:
        return formatear_respuesta_mensaje(str(e))

    return jsonify(result), 200


@auth_routes_bp.get('/me')
def me():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return formatear_respuesta_mensaje('Token no proporcionado', 401)

    repository = SQLAlchemyUserRepository()
    service = AuthService(repository)

    try:
        payload = service.decode_token(token)
    except ValueError as e:
        return formatear_respuesta_mensaje(str(e), 401)

    user = repository.find_by_email(payload['email'])
    if not user:
        return formatear_respuesta_mensaje('Usuario no encontrado', 404)

    return jsonify({
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'rol': user.rol
        }
    }), 200
