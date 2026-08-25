from dataclasses import dataclass

# DTO = "Data Transfer Object". Es solo un contenedor de datos,
# sin lógica ni validación. Sirve para mover información entre
# capas SIN que la capa de aplicación dependa de Pydantic/Flask.
@dataclass
class RegisterUserDTO:
    name: str
    email: str
    password: str
    terms: bool
    years: bool