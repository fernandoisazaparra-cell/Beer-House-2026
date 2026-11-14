
# Moneda utilizada por el sistema
CURRENCY = "COP"

# Estados de las ventas
PENDING = "PENDING"
PAID = "PAID"
EXPIRED = "EXPIRED"
REVIEW = "REVIEW"
FAILED = "FAILED"

# Límites del carrito
MAX_LINES = 20
MAX_QUANTITY = 20

# Tiempo máximo para completar el pago
PENDING_MINUTES = 30

# Métodos de pago permitidos para pasarelas que los solicitan
PAYMENT_METHODS = (
    "CASH",
    "CARD",
    "TRANSFER",
    "PSE",
    "NEQUI",
)
