class InvalidFilterError(ValueError):
    """Un filtro del catálogo viene mal (precio no numérico, rango inválido...)."""


class ProductNotAvailableError(Exception):
    """El producto no existe, está inactivo o está agotado (RN-015 / RN-016)."""