
class InvalidRequestError(Exception):
    """La solicitud contiene datos inválidos."""
    pass


class CartInvalidError(Exception):
    """El carrito contiene productos o cantidades no válidas."""

    def __init__(self, issues, items=None, total=None):
        self.issues = issues
        self.items = items if items is not None else []
        self.total = total

        super().__init__(
            "El carrito contiene productos que no se pueden procesar."
        )


class UnderageError(Exception):
    """El usuario no cumple el requisito de edad."""
    pass


class PaymentMismatchError(Exception):
    """Los datos del pago no coinciden con la orden."""
    pass


class PaymentNotFoundError(Exception):
    """No se encontró el pago solicitado."""
    pass
