# =====================================================================
# Rutas de autenticación (la "capa HTTP")
# ---------------------------------------------------------------------
# Una ruta hace 4 cosas simples, en orden:
#   1) Leer el JSON que llega por la petición.
#   2) Validar el FORMATO con un schema (Pydantic).
#   3) Llamar al servicio, que valida reglas y habla con la BD.
#   4) Convertir el resultado en una respuesta JSON.
# =====================================================================
# =====================================================================
# Rutas de autenticación y gestión de usuarios (capa HTTP)
# =====================================================================
from threading import Thread
import requests
import os
from app.extensions import db
from ..infrastructure.repository import SQLAlchemyUserRepository, ahora_utc
from ..infrastructure.models import ProfileUpdateRequest

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from app.email.email_service import EmailError, EmailService
from app.extensions import limiter

from ..application.services import UserService
from ..application.services_auth import AuthService
from shared.security.decorators import role_required
from shared.security.roles import STAFF_ROLES
from .schemas import (
    ConfirmTermsSchema,
    GoogleLoginSchema,
    LoginSchema,
    RegisterUserSchema,
    ResendCodeSchema,
    VerifyEmailSchema
)
from werkzeug.security import generate_password_hash

# Blueprints
auth_bp = Blueprint("auth", __name__)
users_bp = Blueprint("users_admin", __name__)
repo = SQLAlchemyUserRepository()

def errores_pydantic(validation_error):
    errores = {}
    for error in validation_error.errors():
        campo = str(error["loc"][0])
        if campo == "email" and error["type"].startswith("value_error"):
            mensaje = "El email no tiene un formato válido"
        else:
            mensaje = error["msg"]
        errores.setdefault(campo, []).append(mensaje)
    return errores

def enviar_codigo_por_email(destinatario, codigo, nombre=None):
    try:
        EmailService().send_email(
            recipient=destinatario,
            subject="Bienvenido a Beer House",
            template_name="registrer.html",
            context={"code": codigo, "name": nombre or ""},
        )
    except EmailError as error:
        print(f"Error enviando correo: {error}")

def enviar_codigo_en_background(destinatario, codigo, nombre=None):
    Thread(
        target=enviar_codigo_por_email,
        args=(destinatario, codigo, nombre),
        daemon=True,
    ).start()

@auth_bp.post("/register")
@limiter.limit("10 per minute")
def register():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = RegisterUserSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    # Tu lógica original usa first_name y last_name, ajustamos el registro según corresponda
    partes = schema.name.split(" ", 1)
    f_name = partes[0]
    l_name = partes[1] if len(partes) > 1 else "Cliente"

    codigo, errores = service.register(
    schema.name,
    schema.email,
    schema.password,
    schema.terms,
    schema.years
)
    if errores:
        return {"errors": errores}, 400

    enviar_codigo_en_background(schema.email, codigo, schema.name)
    return {"message": "Usuario registrado correctamente"}, 201

@auth_bp.post("/verify-email")
@limiter.limit("10 per minute")
def verify_email():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = VerifyEmailSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    try:
        errores = service.verify_email(schema.email, schema.code)
    except ValueError as error:
        return {"message": str(error)}, 400

    if errores:
        return {"errors": errores}, 400

    return {"message": "Correo verificado correctamente"}, 200

@auth_bp.post("/token-repeat")
@limiter.limit("5 per hour")
def token_repeat():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = ResendCodeSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = UserService()
    try:
        codigo, errores = service.re_send_code(schema.email)
    except ValueError as error:
        return {"message": str(error)}, 400

    if errores:
        return {"errors": errores}, 400

    enviar_codigo_en_background(schema.email, codigo)
    return {"message": "Código reenviado. Revisa tu correo."}, 200

@auth_bp.route("/login", methods=["POST", "OPTIONS"])
@limiter.limit("10 per minute")
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = LoginSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    service = AuthService()
    try:
        resultado = service.login(schema.email, schema.password)
    except ValueError as error:
        return {"message": str(error)}, 400

    return resultado, 200

@limiter.limit("10 per minute")
@auth_bp.post("/token-google")
def login_google():
    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = GoogleLoginSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": schema.code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code",
        },
    )

    if not token_response.ok:
        return {"message": "No se pudo validar el código con Google", "detail": token_response.json()}, 400

    tokens = token_response.json()
    id_token_jwt = tokens.get("id_token")

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_jwt, google_requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
    except ValueError:
        return {"message": "Token de Google inválido"}, 400

    email = idinfo.get("email")
    name = idinfo.get("name")
    google_id = idinfo.get("sub")

    if not email or not google_id:
        return {"message": "Token de Google incompleto (falta email o sub)"}, 400

    service = AuthService()
    try:
        resultado = service.login_google(google_id, email, name)
    except ValueError as error:
        return {"message": str(error)}, 400

    return resultado, 200

@auth_bp.post("/confirm-terms")
@limiter.limit("10 per minute")
def confirm_terms():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return {"message": "Token no proporcionado"}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    data = request.get_json(silent=True)
    if data is None:
        return {"message": "Body JSON inválido o vacío"}, 400

    try:
        schema = ConfirmTermsSchema(**data)
    except ValidationError as error:
        return {"errors": errores_pydantic(error)}, 400

    try:
        service.confirm_terms_and_age(payload["user_id"], schema.terms_version)
    except ValueError as error:
        return {"message": str(error)}, 400

    return {"message": "Términos y edad confirmados correctamente"}, 200

@auth_bp.get("/me")
@limiter.limit("10 per minute")
def me():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return {"message": "Token no proporcionado"}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    user = service.repository.find_by_email(payload["email"])
    if not user:
        return {"message": "Usuario no encontrado"}, 404

    return {
    "user": {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
        "email": user.email,
        "rol": user.rol,
    },
    "requires_confirmation": user.age_confirmed_at is None
}, 200

@auth_bp.put("/profile")
@limiter.limit("10 per minute")
def update_profile():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return {"message": "Token no proporcionado"}, 401

    service = AuthService()
    try:
        payload = service.decode_token(token)
    except ValueError as error:
        return {"message": str(error)}, 401

    data = request.get_json(silent=True)
    if not data:
        return {"message": "Body JSON inválido o vacío"}, 400

    user = service.repository.find_by_email(payload["email"])
    if not user:
        return {"message": "Usuario no encontrado"}, 404

    fecha_registro = getattr(user, 'created_at', None) or user.terms_accepted_at or user.age_confirmed_at
    dias_antiguedad = (ahora_utc() - fecha_registro).days if fecha_registro else 0

    if dias_antiguedad < 30:
        nueva_solicitud = ProfileUpdateRequest(
            user_id=user.id,
            requested_first_name=data.get("first_name", user.first_name),
            requested_last_name=data.get("last_name", user.last_name),
            requested_birth_date=data.get("birth_date") if "birth_date" in data else user.birth_date,
            status="pending"
        )
        db.session.add(nueva_solicitud)
        db.session.commit()

        return {
            "status": "pending_approval",
            "message": f"Tu cuenta fue creada hace {dias_antiguedad} días. Tu solicitud de actualización quedó registrada.",
            "days_registered": dias_antiguedad,
            "request_id": nueva_solicitud.id
        }, 202

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    if "birth_date" in data:
        user.birth_date = data["birth_date"]

    db.session.commit()

    return {
        "status": "success",
        "message": "Perfil actualizado correctamente.",
        "user": {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        }
    }, 200

@auth_bp.get("/admin/profile-requests")
@role_required(*STAFF_ROLES)
def get_profile_requests():
    solicitudes = ProfileUpdateRequest.query.filter_by(status="pending").all()
    resultado = []
    for req in solicitudes:
        resultado.append({
            "id": req.id,
            "user_id": req.user_id,
            "current_name": f"{req.user.first_name} {req.user.last_name}",
            "user_email": req.user.email,
            "requested_first_name": req.requested_first_name,
            "requested_last_name": req.requested_last_name,
            "requested_birth_date": req.requested_birth_date.isoformat() if req.requested_birth_date else None,
            "created_at": req.created_at.isoformat()
        })
    return {"requests": resultado}, 200

@auth_bp.post("/admin/profile-requests/<int:request_id>/approve")
@role_required(*STAFF_ROLES)
def approve_profile_request(request_id):
    solicitud = ProfileUpdateRequest.query.get(request_id)
    if not solicitud or solicitud.status != "pending":
        return {"message": "Solicitud no encontrada o ya procesada"}, 404

    user = solicitud.user
    user.first_name = solicitud.requested_first_name
    user.last_name = solicitud.requested_last_name
    if solicitud.requested_birth_date:
        user.birth_date = solicitud.requested_birth_date

    solicitud.status = "approved"
    solicitud.processed_at = ahora_utc()

    db.session.commit()
    return {"message": "Solicitud aprobada y perfil actualizado con éxito"}, 200

@auth_bp.post("/admin/profile-requests/<int:request_id>/reject")
@role_required(*STAFF_ROLES)
def reject_profile_request(request_id):
    solicitud = ProfileUpdateRequest.query.get(request_id)
    if not solicitud or solicitud.status != "pending":
        return {"message": "Solicitud no encontrada o ya procesada"}, 404

    solicitud.status = "rejected"
    solicitud.processed_at = ahora_utc()

    db.session.commit()
    return {"message": "Solicitud rechazada correctamente"}, 200


# =====================================================================
# Endpoints CRUD para la Gestión de Clientes en el Panel Admin (users_bp)
# =====================================================================
@users_bp.get("/")
@role_required(*STAFF_ROLES)
def get_users():
    try:
        users = repo.get_all_users()
        resultado = []
        for u in users:
            resultado.append({
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}".strip(),
                "email": u.email
            })
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": "Error al listar usuarios", "details": str(e)}), 500

@users_bp.post("/")
@role_required(*STAFF_ROLES)
def create_user():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"error": "Faltan datos obligatorios (name, email, password)"}), 400

        partes = name.split(" ", 1)
        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Cliente"

        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")
        new_user = repo.create_user(first_name=first_name, last_name=last_name, email=email, password=hashed_password)

        return jsonify({"message": "Usuario creado con éxito", "id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al crear usuario", "details": str(e)}), 500

@users_bp.put("/<int:user_id>")
@role_required(*STAFF_ROLES)
def update_user(user_id):
    try:
        data = request.get_json()
        repo.update_user_admin(user_id, data)
        return jsonify({"message": "Usuario actualizado con éxito"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al actualizar usuario", "details": str(e)}), 500

@users_bp.delete("/<int:user_id>")
@role_required(*STAFF_ROLES)
def delete_user(user_id):
    try:
        response = repo.delete_user_admin(user_id)
        return jsonify(response), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar usuario", "details": str(e)}), 500