from app.extensions import db
from features.suppliers.infrastructure.models import SupplierModel

class SQLAlchemySupplierRepository:

    def get_all(self, include_inactive=False):
        query = SupplierModel.query
        if not include_inactive:
            query = query.filter_by(is_active=True)
        return query.all()

    def get_by_nit(self, nit):
        return SupplierModel.query.filter_by(nit=nit).first()

    def create(self, data):
        supplier = SupplierModel(
            name=data["name"],
            nit=data["nit"],
            representative=data.get("representative"),
            email=data["email"],
            phone=data["phone"],
            address=data.get("address"),
            payment_terms=data.get("payment_terms")
        )
        db.session.add(supplier)
        db.session.commit()
        return supplier