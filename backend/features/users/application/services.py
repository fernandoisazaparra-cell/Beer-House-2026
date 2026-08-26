from ..domain.entities import User, DomainValidationError, EmailVerification
from ..domain.repositories import UserRepository
from .dto import RegisterUserDTO

from datetime import datetime, UTC

# Aquí vive la LÓGICA DE NEGOCIO real: qué significa "registrar
# un usuario". No sabe si los datos vienen de Flask, ni si se
# guardan en SQLAlchemy o Mongo — solo conoce el "contrato" (repository).
class UserService:
    def __init__(self, dto: UserRepository):
        self.repository = dto

    def register(self, data: RegisterUserDTO):
        # 1. Creamos la entidad de dominio -> aquí se validan las reglas
        user = User(
            name=data.name,
            email=data.email,
            password=data.password,
            terms=data.terms,
            years=data.years
        )

        # 2. Verificamos si el email ya existe (regla de negocio,
        #    pero usando el repositorio para consultar)
        if self.repository.find_by_email(user.email):
            raise DomainValidationError({'email': ['El email ya está registrado']})

        pending = self.repository.find_pending_by_email(user.email)
        if pending:
            return self.repository.update_pending_registration(pending, user)
        # 3. Persistimos
        return self.repository.create_pending_registration(user)

    def verify_email(self, data: UserRepository):
        now = datetime.now(self.UTF)
        verification  = EmailVerification(
            email=data.email,
            code=data.code
        )

        pending = self.repository.find_pending_by_email(verification .email)
        if not pending:
            raise ValueError('No existe una verificación pendiente')

        if pending.locked_until and now < pending.locked_until:
            raise DomainValidationError({
                'code': [
                    'Has superado el número máximo de intentos. '
                    'Intenta nuevamente más tarde.'
                ]
            })