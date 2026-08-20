# Esta es tu entidad de dominio: representa el concepto "Usuario"
# con SUS PROPIAS reglas de negocio, sin saber nada de bases de
# datos ni de HTTP.
class DomainValidationError(Exception):
    def __init__(self, errors: dict[str, list[str]]):
        self.errors = errors
        super().__init__()

class User:
    def __init__(self, name, email, password, terms=False):
        errors = {}
        if not name:
            errors.setdefault('name', []).append('El nombre es obligatorio')
        if not email:
            errors.setdefault('email', []).append('El email es obligatorio')
        if not password:
            errors.setdefault('password', []).append('La contraseña es obligatoria')
        if len(password) < 6:
            errors.setdefault('password', []).append('La contraseña debe tener al menos 6 caracteres')
        if not terms:
            errors.setdefault('terms', []).append('Debes aceptar los términos y condiciones')
        if errors:
            raise DomainValidationError(errors)

        self.name = name
        self.email = email
        self.password = password
        self.terms = terms