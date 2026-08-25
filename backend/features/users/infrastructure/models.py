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

    terms_accepted_at = db.Column(db.DateTime, nullable=False)
    age_confirmed_at = db.Column(db.DateTime, nullable=False)
    terms_version = db.Column(db.String(20), nullable=True)