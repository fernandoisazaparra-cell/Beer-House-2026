# Esta es tu entidad de dominio: representa el concepto "Usuario"
# con SUS PROPIAS reglas de negocio, sin saber nada de bases de
# datos ni de HTTP.
import re

# Conjunto de contraseñas prohibidas (en minúsculas para comparar fácil)
COMMON_PASSWORDS = {
    "password1", "password123", "12345678", "123456789", 
    "admin123", "welcome1", "contraseña", "qwerty123", "secret123"
}

SEQUENCE_PATTERNS = [
    r"0123|1234|2345|3456|4567|5678|6789",
    r"9876|8765|7654|6543|5432|4321|3210",
    r"(\d)\1{3,}"
]

class DomainValidationError(Exception):
    def __init__(self, errors: dict[str, list[str]]):
        self.errors = errors
        super().__init__()

class User:
    def __init__(self, name, email, password, terms=False, years=False):
        errors = {}
        # Errores especiales
        if name and not re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü '-]+", name):
            errors.setdefault('name', []).append('El nombre solo puede contener letras y espacios')
        if password and " " in password:
            errors.setdefault('password', []).append('La contraseña no puede contener espacios')

        if name:
            name = " ".join("'".join("-".join(
                        part.capitalize()
                        for part in piece.split("-")
                    )
                    for piece in word.split("'")
                )
                for word in name.strip().split()
            )
        else: name = ""

        if password: password = "".join(password.strip().split())
        else: password = ""

        if email: email = "".join(email.strip().split()).lower()
        else: email = ""

        lettersName = name.replace(" ", "") if name else ""
        wordsName = name.split() if name else []

        clean_pass = password.strip().lower()
        clean_email = email.strip().lower()
        lettersPassword = password.replace(" ", "") if password else ""
        clean_pass = password.strip().lower()
        is_obvious_sequence = any(re.search(pattern, password) for pattern in SEQUENCE_PATTERNS)      

        # Validaciones de nombre
        if not name:
            errors.setdefault('name', []).append('El nombre es obligatorio')
        if any(len(word) < 2 for word in wordsName):
            errors.setdefault('name', []).append('Cada nombre o apellido debe tener al menos 2 letras')
        if len(lettersName) < 3:
            errors.setdefault('name', []).append('El nombre es demasiado corto')
        if len(name) > 100:
            errors.setdefault('name', []).append('El nombre es demasiado largo')
        if name.startswith('-') or name.endswith('-'):
            errors.setdefault('name', []).append('El nombre no puede comenzar ni terminar con guion')
        if name.startswith("'") or name.endswith("'"):
            errors.setdefault('name', []).append('El nombre no puede comenzar ni terminar con apóstrofe')
        if '--' in name:
            errors.setdefault('name', []).append('El nombre no puede contener guiones consecutivos')
        if "''" in name:
            errors.setdefault('name', []).append('El nombre no puede contener apóstrofes consecutivos')
        if ' - ' in name:
            errors.setdefault('name', []).append('El guion debe estar unido a las palabras')

        # Validaciones de correo
        if not email:
            errors.setdefault('email', []).append('El email es obligatorio')
        if len(email) > 255:
            errors.setdefault('email', []).append('El email debe tener menos de 255 caracteres')

        # Validaciones de contraseña
        if not password:
            errors.setdefault('password', []).append('La contraseña es obligatoria')
        if len(lettersPassword) < 8:
            errors.setdefault('password', []).append('La contraseña debe tener al menos 8 caracteres')
        if len(password) > 72:
            errors.setdefault('password', []).append('La contraseña debe tener menos de 72 caracteres')
        if not any(c.isupper() for c in password):
            errors.setdefault('password', []).append('La contraseña debe tener almenos una mayuscula')
        if not any(c.islower() for c in password):
            errors.setdefault('password', []).append('La contraseña debe tener almenos una minuscula')
        if not any(c.isdigit() for c in password):
            errors.setdefault('password', []).append('La contraseña debe tener almenos un digito')
        if clean_pass in COMMON_PASSWORDS:
            errors.setdefault('password', []).append('Esta contraseña es demasiado común y no es segura')
        if is_obvious_sequence:
            errors.setdefault('password', []).append('La contraseña contiene secuencias numéricas muy obvias')
        if re.search(r'(.)\1{3,}', password):
            errors.setdefault('password', []).append('La contraseña no puede contener caracteres repetidos consecutivamente')
        if clean_pass == clean_email:
            errors.setdefault('password', []).append('La contraseña no puede ser igual al correo electrónico')

        if not terms:
            errors.setdefault('terms', []).append('Debes aceptar los términos y condiciones')

        if not years:
            errors.setdefault('years', []).append('Debes confirmar que eres mayor de edad')
        
        if errors:
            raise DomainValidationError(errors)

        self.name = name
        self.email = email
        self.password = password
        self.terms = terms
        self.years = years

class EmailVerification:
    def __init__(self, email, code):
        errors = {}

        if not email:
            errors.setdefault('email', []).append('El email es obligatorio')
        if not code:
            errors.setdefault('code', []).append('El código es obligatorio')
        elif len(code) != 6:
            errors.setdefault('code', []).append('El código debe tener 6 caracteres')

        if errors:
            raise DomainValidationError(errors)

        self.email = "".join(email.strip().split()).lower()
        self.code = code.strip()