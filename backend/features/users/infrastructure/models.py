# Cada clase de aquí representa UNA TABLA en la base de datos.
# El ORM (SQLAlchemy) se encarga de traducir estas clases a SQL.

from app.extensions import db

class UserModel(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False) # RF-001
    last_name = db.Column(db.String(100), nullable=False)  # RF-001
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    birth_date = db.Column(db.Date, nullable=True)        # RN-001 / RN-005
    google_id = db.Column(db.String(255), nullable=True, unique=True)
    terms_accepted_at = db.Column(db.DateTime, nullable=True)
    age_confirmed_at = db.Column(db.DateTime, nullable=True)
    terms_version = db.Column(db.String(20), nullable=True)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)
    rol = db.Column(db.String(20), nullable=False, default='user')

class PendingRegistration(db.Model):
    __tablename__ = "pending_registrations"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    birth_date = db.Column(db.Date, nullable=True)
    terms_accepted_at = db.Column(db.DateTime, nullable=False)
    age_confirmed_at = db.Column(db.DateTime, nullable=False)
    terms_version = db.Column(db.String(20), nullable=True)
    code_hash = db.Column(db.String(255), nullable=False)
    attempts_used = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)

class ProfileUpdateRequest(db.Model):
    __tablename__ = "profile_update_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    requested_first_name = db.Column(db.String(100), nullable=False)
    requested_last_name = db.Column(db.String(100), nullable=False)
    requested_birth_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), default="pending", nullable=False)  # pending, approved, rejected
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    processed_at = db.Column(db.DateTime, nullable=True)

    # Relación para acceder a los datos actuales del usuario
    user = db.relationship("UserModel", backref=db.backref("profile_requests", lazy=True))