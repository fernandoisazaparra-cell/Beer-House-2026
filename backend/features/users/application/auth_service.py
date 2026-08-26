import jwt
from datetime import datetime, timedelta, UTC
from werkzeug.security import check_password_hash

from config.settings import Config
from ..domain.repositories import UserRepository


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def login(self, email: str, password: str) -> dict:
        user = self.repository.find_by_email(email)
        if not user:
            raise ValueError('Credenciales inválidas')

        if user.locked_until and datetime.utcnow() < user.locked_until:
            raise ValueError(
                'Cuenta bloqueada temporalmente. '
                'Intenta nuevamente más tarde.'
            )

        if not check_password_hash(user.password, password):
            self.repository.register_failed_login(user)
            raise ValueError('Credenciales inválidas')

        self.repository.reset_failed_logins(user)
        token = self.generate_token(user.id, user.email)

        return {
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'rol': user.rol
            }
        }

    def generate_token(self, user_id: int, email: str) -> str:
        payload = {
            'user_id': user_id,
            'email': email,
            'exp': datetime.now(UTC) + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
            'iat': datetime.now(UTC)
        }
        return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

    def decode_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError('Token expirado')
        except jwt.InvalidTokenError:
            raise ValueError('Token inválido')
