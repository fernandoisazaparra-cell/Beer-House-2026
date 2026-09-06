# =====================================================================
# Servicio de autenticación: login + tokens JWT
# ---------------------------------------------------------------------
# Aquí se crea y se valida el token que el usuario usa en cada petición
# (endpoint /auth/me). El token asegura "esta persona ya está logueada".
# =====================================================================
from datetime import UTC, datetime, timedelta

import jwt
from werkzeug.security import check_password_hash

from config.settings import Config

from ..infrastructure.repository import SQLAlchemyUserRepository, ahora_utc


class AuthService:
    def __init__(self):
        self.repository = SQLAlchemyUserRepository()

    def login(self, email, password):
        """
        Comprueba credenciales y devuelve el token + datos del usuario.
        Lanza ValueError con el mensaje cuando las credenciales no valen.
        """
        user = self.repository.find_by_email(email)
        if not user:
            raise ValueError("Credenciales inválidas")

        # ¿La cuenta está bloqueada por muchos intentos fallidos?
        if user.locked_until and ahora_utc() < user.locked_until:
            raise ValueError("Cuenta bloqueada temporalmente. Intenta nuevamente más tarde.")

        if not check_password_hash(user.password, password):
            self.repository.register_failed_login(user)
            raise ValueError("Credenciales inválidas")

        self.repository.reset_failed_logins(user)
        token = self.generate_token(user.id, user.email)

        return {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "rol": user.rol,
            },
        }

    def login_google(self, google_id: str, email: str, name: str):
        """
        Busca o crea un usuario a partir de los datos verificados de Google.
        Devuelve el token + datos del usuario, igual que login().
        """
        user = self.repository.find_by_google_id(google_id)

        if not user:
            # ¿ya existe una cuenta local con ese email? la vinculamos
            user = self.repository.find_by_email(email)
            if user:
                user = self.repository.link_google_account(user, google_id)
            else:
                user = self.repository.create_google_user(name, email, google_id)

        token = self.generate_token(user.id, user.email)

        return {
            "token": token,
            "requires_confirmation": user.age_confirmed_at is None,  # el frontend usa esto
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "rol": user.rol,
            },
        }

    def confirm_terms_and_age(self, user_id, terms_version="v1.0"):
        user = self.repository.find_by_id(user_id)  # necesitás agregar este método simple al repo
        if not user:
            raise ValueError("Usuario no encontrado")
        self.repository.confirm_terms_and_age(user, terms_version)

    def generate_token(self, user_id, email):
        """Crea un token JWT que expira en JWT_EXPIRATION_HOURS horas."""
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": datetime.now(UTC) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
            "iat": datetime.now(UTC),
        }
        return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

    def decode_token(self, token):
        """Decodifica un token. Lanza ValueError si expiró o es inválido."""
        try:
            return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expirado") from None
        except jwt.InvalidTokenError:
            raise ValueError("Token inválido") from None