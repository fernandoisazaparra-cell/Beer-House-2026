# Reglas de negocio del catálogo (puro Python, sin Flask ni SQLAlchemy)
from datetime import date

MIN_AGE = 18  # RN-001 / RN-020


def calculate_age(birth_date, today=None):
    today = today or date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def is_adult(user):
    """
    RN-020: solo usuarios que confirmaron ser mayores de 18.
    - Debe haber confirmado términos y edad (age_confirmed_at).
    - Si tiene fecha de nacimiento, debe tener 18 años o más.
    """
    if user.age_confirmed_at is None:
        return False
    if user.birth_date is None:
        return True
    return calculate_age(user.birth_date) >= MIN_AGE


def is_visible_to_clients(product):
    """RN-015 y RN-016: solo productos activos y con stock disponible."""
    return bool(product.is_active) and product.stock > 0