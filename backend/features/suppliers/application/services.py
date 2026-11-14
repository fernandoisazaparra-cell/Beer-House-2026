
import re

from sqlalchemy.exc import IntegrityError

from app.extensions import db
from features.suppliers.infrastructure.models import SupplierModel


class SupplierService:

    def _clean_text(self, value, field, required=False):
        """Normaliza campos de texto y valida los obligatorios."""

        if value is None:
            value = ""

        if not isinstance(value, str):
            raise ValueError(f"El campo {field} debe ser texto.")

        value = value.strip()

        if required and not value:
            raise ValueError(f"El campo {field} es obligatorio.")

        return value

    def _validate_email(self, email):
        """Validación básica de formato de correo."""

        pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

        if not re.match(pattern, email):
            raise ValueError("El correo electrónico no tiene un formato válido.")

    def _validate_phone(self, phone):
        """Valida que el teléfono tenga una longitud razonable."""

        digits = re.sub(r"\D", "", phone)

        if len(digits) < 7 or len(digits) > 15:
            raise ValueError("El teléfono debe contener entre 7 y 15 dígitos.")

    def _validate_supplier_data(self, data, existing=None):
        """Prepara y valida los campos del proveedor."""

        fields = {
            "name": ("Nombre", True),
            "email": ("Correo", True),
            "phone": ("Teléfono", True),
            "representative": ("Representante", False),
            "address": ("Dirección", False),
            "payment_terms": ("Condiciones de pago", False),
            "delivery_method": ("Forma de entrega", False),
        }

        cleaned = {}

        for field, (label, required) in fields.items():
            current_value = getattr(existing, field, "") if existing else ""
            value = data.get(field, current_value)

            cleaned[field] = self._clean_text(
                value,
                label,
                required=required
            )

        self._validate_email(cleaned["email"])
        self._validate_phone(cleaned["phone"])

        return cleaned

    def get_all_suppliers(self, include_inactive=False):
        query = SupplierModel.query

        if not include_inactive:
            query = query.filter_by(is_active=True)

        suppliers = query.order_by(SupplierModel.name.asc()).all()

        return [supplier.to_dict() for supplier in suppliers]

    def create_supplier(self, data):
        if not isinstance(data, dict):
            raise ValueError("Los datos del proveedor no son válidos.")

        nit = self._clean_text(
            data.get("nit"),
            "NIT",
            required=True
        )

        cleaned = self._validate_supplier_data(data)

        existing = SupplierModel.query.filter_by(nit=nit).first()

        if existing:
            raise ValueError(
                f"Ya existe un proveedor registrado con el NIT '{nit}'."
            )

        supplier = SupplierModel(
            nit=nit,
            is_active=True,
            **cleaned
        )

        try:
            db.session.add(supplier)
            db.session.commit()

            return supplier.to_dict()

        except IntegrityError:
            db.session.rollback()
            raise ValueError(
                "No se pudo registrar el proveedor. Verifica que el NIT no esté duplicado."
            )

        except Exception:
            db.session.rollback()
            raise

    def update_supplier(self, supplier_id, data):
        if not isinstance(data, dict):
            raise ValueError("Los datos del proveedor no son válidos.")

        supplier = db.session.get(SupplierModel, supplier_id)

        if not supplier:
            raise ValueError("El proveedor no existe.")

        if "nit" in data and data["nit"] != supplier.nit:
            raise ValueError("El NIT no se puede modificar.")

        cleaned = self._validate_supplier_data(data, existing=supplier)

        try:
            for field, value in cleaned.items():
                setattr(supplier, field, value)

            db.session.commit()

            return supplier.to_dict()

        except Exception:
            db.session.rollback()
            raise

    def toggle_supplier_status(self, supplier_id, is_active):
        from features.purchases.infrastructure.models import PurchaseOrderModel

        if not isinstance(is_active, bool):
            raise ValueError("El estado del proveedor debe ser booleano.")

        supplier = db.session.get(SupplierModel, supplier_id)

        if not supplier:
            raise ValueError("El proveedor no existe.")

        if supplier.is_active == is_active:
            return supplier.to_dict()

        if not is_active:
            active_orders = PurchaseOrderModel.query.filter_by(
                supplier_id=supplier_id,
                status="Pendiente"
            ).first()

            if active_orders:
                raise ValueError(
                    "No se puede inactivar el proveedor porque tiene órdenes de compra pendientes."
                )

        try:
            supplier.is_active = is_active
            db.session.commit()

            return supplier.to_dict()

        except Exception:
            db.session.rollback()
            raise
