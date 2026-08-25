from app.extensions import db

from .models import UserModel
from ..domain.repositories import UserRepository

# Esta es la implementación CONCRETA del contrato UserRepository,
# usando SQLAlchemy específicamente.
class SQLAlchemyUserRepository(UserRepository):
    def create(self, user):
        model = UserModel(
            name=user.name,
            email=user.email,
            password=user.password,
        )
        db.session.add(model)
        db.session.commit()
        return model

    def find_by_email(self, email):
        return UserModel.query.filter_by(email=email).first()