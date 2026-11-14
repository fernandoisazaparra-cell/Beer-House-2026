
from decimal import Decimal
from types import SimpleNamespace

import pytest

from features.sales.application.services import SalesService
from features.sales.domain.exceptions import (
    CartInvalidError,
    InvalidRequestError,
)
from features.sales.infrastructure.simulated_gateway import SimulatedGateway


class FakeRepository:
    """Repositorio ficticio para pruebas unitarias."""

    def __init__(self, products=None):
        self.products = products or {}
        self.expired_sales = []
        self.pending_sales = []

    def get_products(self, product_ids):
        return {
            product_id: self.products[product_id]
            for product_id in product_ids
            if product_id in self.products
        }

    def get_pending_sales(self, user_id=None, older_than_minutes=None):
        return []

    def commit(self):
        pass

    def rollback(self):
        pass


def make_product(
    product_id=1,
    name="Producto ficticio",
    price="10000.00",
    stock=10,
    is_active=True,
):
    return SimpleNamespace(
        id=product_id,
        name=name,
        price=Decimal(price),
        stock=stock,
        is_active=is_active,
    )


def make_user():
    return SimpleNamespace(
        id=1,
        email="cliente@example.test",
        first_name="Cliente",
        last_name="Prueba",
        birth_date=None,
    )


def make_service(products=None):
    repository = FakeRepository(products)
    gateway = SimulatedGateway()

    return SalesService(repository, gateway)


# --------------------------------------------------
# VALIDACIÓN DEL CARRITO
# --------------------------------------------------

def test_cart_rejects_empty_items():
    service = make_service()

    with pytest.raises(InvalidRequestError):
        service._build_cart([])


def test_cart_rejects_non_list_items():
    service = make_service()

    with pytest.raises(InvalidRequestError):
        service._build_cart("incorrecto")


def test_cart_rejects_invalid_quantity():
    service = make_service({
        1: make_product()
    })

    with pytest.raises(InvalidRequestError):
        service._build_cart([
            {"product_id": 1, "quantity": 0}
        ])


def test_cart_uses_database_price():
    service = make_service({
        1: make_product(price="15000.00")
    })

    lines, issues, total = service._build_cart([
        {
            "product_id": 1,
            "quantity": 2,
            "price": 1,
        }
    ])

    assert not issues
    assert lines[0]["unit_price"] == Decimal("15000.00")
    assert total == Decimal("30000.00")


def test_cart_rejects_inactive_product():
    service = make_service({
        1: make_product(is_active=False)
    })

    lines, issues, total = service._build_cart([
        {"product_id": 1, "quantity": 1}
    ])

    assert any(issue["code"] == "not_available" for issue in issues)


def test_cart_detects_insufficient_stock():
    service = make_service({
        1: make_product(stock=2)
    })

    lines, issues, total = service._build_cart([
        {"product_id": 1, "quantity": 5}
    ])

    assert any(
        issue["code"] == "insufficient_stock"
        for issue in issues
    )


def test_cart_combines_duplicate_products():
    service = make_service({
        1: make_product(stock=10)
    })

    lines, issues, total = service._build_cart([
        {"product_id": 1, "quantity": 2},
        {"product_id": 1, "quantity": 3},
    ])

    assert not issues
    assert len(lines) == 1
    assert lines[0]["quantity"] == 5
    assert total == Decimal("50000.00")


def test_cart_rejects_more_than_maximum_lines():
    service = make_service()

    items = [
        {"product_id": product_id, "quantity": 1}
        for product_id in range(1, 22)
    ]

    with pytest.raises(InvalidRequestError):
        service._build_cart(items)


# --------------------------------------------------
# VALIDACIÓN DE EDAD
# --------------------------------------------------

def test_underage_user_cannot_validate_cart():
    service = make_service({
        1: make_product()
    })

    user = make_user()

    with pytest.raises(Exception) as error:
        service.validate_cart(
            user,
            {"items": [{"product_id": 1, "quantity": 1}]},
        )

    assert error.type.__name__ == "UnderageError"


# --------------------------------------------------
# SERIALIZACIÓN
# --------------------------------------------------

def test_serialize_lines_converts_decimal_to_float():
    lines = [{
        "product_id": 1,
        "name": "Producto ficticio",
        "unit_price": Decimal("10000.00"),
        "quantity": 2,
        "subtotal": Decimal("20000.00"),
        "available": 10,
    }]

    result = SalesService._serialize_lines(lines)

    assert result[0]["unit_price"] == 10000.0
    assert result[0]["subtotal"] == 20000.0
    assert isinstance(result[0]["unit_price"], float)
