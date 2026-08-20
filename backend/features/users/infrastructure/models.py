from datetime import UTC, datetime
from app.extensions import db

# Este es el modelo de SQLAlchemy: representa la TABLA en la
# base de datos. Es distinto de `User` (dominio) y de `RegisterUserDTO`
# (aplicación) — cada capa tiene su propia representación del "usuario".
class UserModel(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)