# 1 Capa
backend/
├── app/             # Aplicación Flask: bootstrap y configuración
├── features/        # El negocio: auth, users, products, sales, etc.
├── shared/          # Código compartido entre 2+ features
├── config/          # Configuración de la aplicación
└── migrations/      # Migraciones de la base de datos

# 2 Capa
backend/
│
├── app/
│   ├── __init__.py             # Factory de Flask (create_app)
│   ├── routes.py               # Registro central de blueprints
│   └── extensions.py           # Inicialización de extensiones Flask
│
├── features/
│   ├── auth/                   # Autenticación, sesión, permisos
│   ├── users/                  # Gestión de usuarios
│   ├── products/               # Gestión de productos
│   ├── categories/             # Gestión de categorías
│   └── sales/                  # Ventas, pedidos, etc.
│
├── shared/
│   ├── database/               # Recursos comunes de base de datos
│   ├── errors/                 # Errores y excepciones reutilizables
│   ├── security/               # Utilidades de seguridad
│   └── utils/                  # Utilidades genéricas
│
├── config/
│   └── settings.py             # Configuración y variables de entorno
│
├── migrations/                 # Historial de cambios de la BD
│
├── tests/                      # Tests
│   ├── auth/
│   ├── users/
│   ├── products/
│   └── sales/
│
├── .env                        # Variables locales — NO subir a Git
├── .env.example                # Plantilla de variables
├── .gitignore
├── requirements.txt
└── run.py                      # Punto de entrada del servidor

# 3 Capa
features/user/
│
├── __init__.py                         # Inicializa el módulo users como paquete Python
│
├── presentation/                       # Capa encargada de la comunicación HTTP/API
│   ├── __init__.py                     # Inicializa el paquete presentation
│   ├── routes.py                       # Endpoints Flask de usuarios
│   └── schemas.py                      # Validación y estructura de datos de entrada/salida
│
├── application/                        # Casos de uso y lógica de aplicación
│   ├── __init__.py                     # Inicializa el paquete application
│   ├── services.py                     # Servicios y casos de uso de usuarios
│   └── dto.py                           # Objetos para transportar datos entre capas
│
├── domain/                             # Reglas y conceptos propios del negocio
│   ├── __init__.py                     # Inicializa el paquete domain
│   ├── entities.py                     # Entidades y reglas propias de usuarios
│   ├── repositories.py                 # Contratos para acceder a los datos
│   └── exceptions.py                   # Excepciones específicas del dominio
│
└── infrastructure/                     # Implementaciones técnicas externas
    ├── __init__.py                     # Inicializa el paquete infrastructure
    ├── models.py                       # Modelos SQLAlchemy que representan las tablas
    └── repository.py                   # Implementación de consultas y persistencia

# presentation/routes.py
Este es el punto donde React entra al backend.

from flask import Blueprint, jsonify

from ..application.services import UserService
from ..infrastructure.repository import SQLAlchemyUserRepository


users_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/users"
)

repository = SQLAlchemyUserRepository()
service = UserService(repository)


@users_bp.get("/")
def get_users():

    users = service.get_users()

    return jsonify(users)


@users_bp.get("/<int:user_id>")
def get_user(user_id):

    user = service.get_user(user_id)

    return jsonify(user)


@users_bp.post("/")
def create_user():

    data = request.get_json()

    user = service.create_user(data)

    return jsonify(user), 201


# presentation/schemas.py
Aquí validamos los datos que vienen de React.

Por ejemplo, para crear un usuario:

from pydantic import BaseModel, EmailStr


class CreateUserSchema(BaseModel):

    name: str
    email: EmailStr
    password: str


class UpdateUserSchema(BaseModel):

    name: str | None = None
    email: EmailStr | None = None

# application/services.py

Ahora tenemos el caso de uso.

from ..domain.exceptions import (
    UserNotFoundError,
    EmailAlreadyExistsError
)


class UserService:

    def __init__(self, repository):

        self.repository = repository


    def get_users(self):

        return self.repository.get_all()


    def get_user(self, user_id):

        user = self.repository.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError()

        return user


    def create_user(self, data):

        existing_user = self.repository.get_by_email(
            data["email"]
        )

        if existing_user:
            raise EmailAlreadyExistsError()

        return self.repository.create(data)


    def delete_user(self, user_id):

        user = self.repository.get_by_id(user_id)

        if user is None:
            raise UserNotFoundError()

        self.repository.delete(user)

Aquí empieza la lógica interesante.

Por ejemplo:

existing_user = self.repository.get_by_email(
    data["email"]
)

Estamos preguntando:

"¿Ya existe este email?"

Pero no sabemos cómo se busca.

Eso no le corresponde al Service.

El Service solamente sabe:

Necesito buscar por email.

El Repository se encarga del cómo.

# application/dto.py
Podemos utilizar DTO para representar los datos que necesita nuestra aplicación.

from dataclasses import dataclass


@dataclass
class CreateUserDTO:

    name: str
    email: str
    password: str


@dataclass
class UpdateUserDTO:

    name: str | None = None
    email: str | None = None

Entonces podemos tener:

Schema
  ↓
DTO
  ↓
Service
Diferencia

Schema:

"¿Lo que mandó React tiene una estructura válida?"

DTO:

"¿Qué datos necesita nuestro caso de uso?"

En proyectos pequeños incluso puedes simplificar esto y no utilizar DTO para cada operación si no aporta valor.

# domain/entities.py
Aquí está la entidad del negocio.

class User:

    def __init__(
        self,
        user_id,
        name,
        email
    ):

        self.id = user_id
        self.name = name
        self.email = email


    def change_name(self, new_name):

        if not new_name:
            raise ValueError(
                "El nombre no puede estar vacío"
            )

        self.name = new_name

Esto representa el concepto:

User
├── id
├── name
└── email

Aquí no usamos SQLAlchemy.

No queremos:

class User(db.Model):

porque esta entidad pertenece al dominio.

# domain/repositories.py
Ahora definimos el contrato.

from abc import ABC, abstractmethod


class UserRepository(ABC):

    @abstractmethod
    def get_all(self):
        pass


    @abstractmethod
    def get_by_id(self, user_id):
        pass


    @abstractmethod
    def get_by_email(self, email):
        pass


    @abstractmethod
    def create(self, data):
        pass


    @abstractmethod
    def delete(self, user):
        pass

Esto básicamente dice:

Para que la aplicación pueda trabajar con usuarios, necesitamos estas operaciones.

Pero aquí no sabemos cómo se ejecutan.

No hay:

SQL
SQLAlchemy
MySQL

# domain/exceptions.py
Aquí colocamos los errores específicos de usuarios.

class UserNotFoundError(Exception):
    pass


class EmailAlreadyExistsError(Exception):
    pass


class InvalidUserError(Exception):
    pass

Por ejemplo:

Service
  ↓
Usuario no existe
  ↓
UserNotFoundError

Después podemos tener un manejador global que convierta eso en:

404 Not Found

# infrastructure/models.py
Ahora sí llegamos a SQLAlchemy.

from app.shared.database.connection import db


class UserModel(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        nullable=False,
        unique=True
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )

Esto representa la tabla:

users
├── id
├── name
├── email
└── password

Aquí sí estamos hablando directamente con la estructura de la base de datos.

# infrastructure/repository.py
Aquí hacemos las consultas reales.

from app.shared.database.connection import db

from .models import UserModel


class SQLAlchemyUserRepository:


    def get_all(self):

        return UserModel.query.all()


    def get_by_id(self, user_id):

        return UserModel.query.filter_by(
            id=user_id
        ).first()


    def get_by_email(self, email):

        return UserModel.query.filter_by(
            email=email
        ).first()


    def create(self, data):

        user = UserModel(
            name=data["name"],
            email=data["email"],
            password=data["password"]
        )

        db.session.add(user)
        db.session.commit()

        return user


    def delete(self, user):

        db.session.delete(user)
        db.session.commit()
Aquí está la magia que preguntabas anteriormente.

Por ejemplo:

def get_all(self):

    return UserModel.query.all()

Esta función significa:

"Dame todos los usuarios."

El Service no necesita saber si hacemos:

SELECT * FROM users

o si usamos:

SQLAlchemy

o cualquier otra tecnología.

Solamente llama:

repository.get_all()