from pydantic import BaseModel, EmailStr

# Define QUÉ datos espera tu API y los VALIDA automáticamente.
# Si el email no tiene formato válido o falta un campo, Pydantic
# lanza un error antes de que tu código de negocio se entere.
class RegisterUserSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    terms: bool