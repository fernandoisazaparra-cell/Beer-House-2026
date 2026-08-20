from werkzeug.security import generate_password_hash

from ..domain.entities import User, DomainValidationError
from ..domain.repositories import UserRepository
from .dto import RegisterUserDTO

# Aquí vive la LÓGICA DE NEGOCIO real: qué significa "registrar
# un usuario". No sabe si los datos vienen de Flask, ni si se
# guardan en SQLAlchemy o Mongo — solo conoce el "contrato" (repository).
class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register(self, data: RegisterUserDTO):
        # 1. Hasheamos el password ANTES de crear la entidad
        hashed_password = generate_password_hash(data.password)

        # 2. Creamos la entidad de dominio -> aquí se validan las reglas
        user = User(
            name=data.name,
            email=data.email,
            password=hashed_password,
            terms=data.terms
        )

        # 3. Verificamos si el email ya existe (regla de negocio,
        #    pero usando el repositorio para consultar)
        if self.repository.find_by_email(user.email):
            raise DomainValidationError({'email': ['El email ya está registrado']})

        # 4. Persistimos
        return self.repository.create(user)