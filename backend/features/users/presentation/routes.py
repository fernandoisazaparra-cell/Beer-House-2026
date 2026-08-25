from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from .schemas import RegisterUserSchema
from .error_helpers import (
    traducir_errores_pydantic,
    formatear_respuesta_errores,
    formatear_respuesta_mensaje
)

from ..application.dto import RegisterUserDTO
from ..application.services import UserService
from ..infrastructure.repository import SQLAlchemyUserRepository
from ..domain.entities import User, DomainValidationError

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.post('/register')
def register():
    data = request.get_json(silent=True)
    if data is None: return formatear_respuesta_mensaje('Body JSON inválido o vacío')

    # 1. Validar formato con Pydantic (capturar errores, NO retornar aún)
    try:
        schema = RegisterUserSchema(**data)
    except ValidationError as e:
        errores_pydantic = traducir_errores_pydantic(e)
    else:
        errores_pydantic = {}

    # 2. Validar reglas de dominio (capturar errores, NO retornar aún)
    try:
        User(
            name=data.get('name', ''),
            email=data.get('email', ''),
            password=data.get('password', ''),
            terms=data.get('terms', False),
            years=data.get('years', False)
        )
    except DomainValidationError as e:
        errores_dominio = e.errors
    else:
        errores_dominio = {}

    # 3. Combinar y retornar solo si hay errores
    todos_errores = {**errores_pydantic, **errores_dominio}
    if todos_errores:
        return formatear_respuesta_errores(todos_errores)

    # 4. Registrar usuario
    dto = RegisterUserDTO(
        name=schema.name,
        email=schema.email,
        password=schema.password,
        terms=schema.terms,
        years=schema.years
    )

    repository = SQLAlchemyUserRepository()
    service = UserService(repository)

    try:
        service.register(dto)
    except DomainValidationError as e:
        return formatear_respuesta_errores(e.errors)
    except ValueError as e:
        return formatear_respuesta_mensaje(str(e))

    return jsonify({'message': 'Usuario registrado correctamente'}), 201