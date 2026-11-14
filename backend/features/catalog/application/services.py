import json
import math

from ..domain.exceptions import InvalidFilterError, ProductNotAvailableError
from ..domain.rules import is_visible_to_clients

MAX_PER_PAGE = 48
VALID_ORDERS = {"recientes", "menor", "mayor", "nombre"}


def _to_client_dict(product):
    """Solo lo que el cliente necesita ver (RI-016 / RI-020)."""
    return {
        "id": product.id,
        "name": product.name,
        "liquor_type": product.liquor_type,
        "price": float(product.price),
        "stock": product.stock,
        "image_url": product.image_url,
        "description": product.description or "",
        "legal_warning": product.legal_warning,  # RN-014 / RN-019
    }


def _parse_price(value, field):
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise InvalidFilterError(f"El filtro '{field}' debe ser un número.") from None
    if number < 0:
        raise InvalidFilterError(f"El filtro '{field}' no puede ser negativo.")
    return number


def _parse_int(value, default, minimum, maximum):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(number, maximum))


class CatalogService:
    def __init__(self, repository):
        self.repository = repository

    def list_products(self, user_id, args):
        search = (args.get("search") or "").strip()[:100]
        types = [t.strip() for t in (args.get("types") or "").split(",") if t.strip()]
        min_price = _parse_price(args.get("min_price"), "min_price")
        max_price = _parse_price(args.get("max_price"), "max_price")
        if min_price is not None and max_price is not None and min_price > max_price:
            raise InvalidFilterError("El precio mínimo no puede ser mayor que el máximo.")

        order = args.get("order") if args.get("order") in VALID_ORDERS else "recientes"
        page = _parse_int(args.get("page"), 1, 1, 10_000)
        per_page = _parse_int(args.get("per_page"), 12, 1, MAX_PER_PAGE)

        items, total = self.repository.search(search, types, min_price, max_price, order, page, per_page)
        low, high = self.repository.get_price_bounds()

        # RF-022: queda registrado qué consultó el usuario
        self.repository.log_access(
            user_id,
            "LIST",
            detail=json.dumps(
                {"search": search, "types": types, "min_price": min_price,
                 "max_price": max_price, "order": order, "page": page,
                 "product_ids": [p.id for p in items]},
                ensure_ascii=False,
            ),
            results_count=total,
        )

        return {
            "items": [_to_client_dict(p) for p in items],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": max(1, math.ceil(total / per_page)),
            "filters": {
                "types": self.repository.get_type_counts(),
                "price_min": low,
                "price_max": high,
            },
        }

    def get_product(self, user_id, product_id):
        product = self.repository.get_by_id(product_id)
        if product is None or not is_visible_to_clients(product):
            raise ProductNotAvailableError("Este producto no está disponible.")

        self.repository.log_access(user_id, "DETAIL", product_id=product.id)
        return _to_client_dict(product)