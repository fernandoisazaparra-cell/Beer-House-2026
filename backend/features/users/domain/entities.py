# Esta es tu entidad de dominio: representa el concepto "Usuario"
# con SUS PROPIAS reglas de negocio, sin saber nada de bases de
# datos ni de HTTP.
import re

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

        if name:
            name = " ".join(
                "'".join(
                    "-".join(
                        part.capitalize()
                        for part in piece.split("-")
                    )
                    for piece in word.split("'")
                )
                for word in name.strip().split()
            )
        else: name = ""
        lettersName = name.replace(" ", "") if name else ""
        wordsName = name.split() if name else []

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

        if not email:
            errors.setdefault('email', []).append('El email es obligatorio')

        if not password:
            errors.setdefault('password', []).append('La contraseña es obligatoria')
        if len(password) < 6:
            errors.setdefault('password', []).append('La contraseña debe tener al menos 6 caracteres')

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