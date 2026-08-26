from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from .schemas import RegisterUserSchema, VerifyEmailSchema
from .error_helpers import (
    traducir_errores_pydantic,
    formatear_respuesta_errores,
    formatear_respuesta_mensaje
)

from threading import Thread

from ..application.dto import RegisterUserDTO, VerifyEmailDTO
from ..application.services import UserService
from ..infrastructure.repository import SQLAlchemyUserRepository
from ..domain.entities import User, DomainValidationError, EmailVerification

from app.email.email_service import EmailService, EmailError

def send_email_background(recipient, subject, template_name, context):
    try:
        email_service = EmailService()

        email_service.send_email(
            recipient=recipient,
            subject=subject,
            template_name=template_name,
            context=context
        )

    except EmailError as e:
        print(f"Error enviando correo: {e}")

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
        code = service.register(dto)
    except DomainValidationError as e:
        return formatear_respuesta_errores(e.errors)
    except ValueError as e:
        return formatear_respuesta_mensaje(str(e))

    Thread(
        target=send_email_background,
        args=(
            dto.email,
            "Bienvenido a Beer House",
            "registrer.html",
            {
                "code": code,
                "name": dto.name
            }
        ),
        daemon=True 
    ).start()

    return jsonify({'message': 'Usuario registrado correctamente'}), 201

@auth_bp.post("/verify-email")
def verify_email():
    data = request.get_json(silent=True)
    if data is None: return formatear_respuesta_mensaje('Body JSON inválido o vacío')

    try:
        schema = VerifyEmailSchema(**data)
    except ValidationError as e:
        errores_pydantic = traducir_errores_pydantic(e)
    else:
        errores_pydantic = {}

    try:
        EmailVerification(
            email=data.get('email', ''),
            code=data.get('code', '')
        )
    except DomainValidationError as e:
        errores_dominio = e.errors
    else:
        errores_dominio = {}

    todos_errores = {**errores_pydantic, **errores_dominio}
    if todos_errores:
        return formatear_respuesta_errores(todos_errores)

    dto = VerifyEmailDTO(
        email=schema.email,
        code=schema.code
    )

    repository = SQLAlchemyUserRepository()
    service = UserService(repository)
    
    return jsonify({'message': 'Código recibido correctamente'}), 201