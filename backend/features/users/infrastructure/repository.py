from datetime import datetime, UTC, timedelta
import hashlib
import secrets

from app.extensions import db

from .models import UserModel, PendingRegistration
from ..domain.repositories import UserRepository

CHARACTERS = (
    "ABCDEFGHJKLMNPQRSTUVWXYZ"
    "abcdefghijkmnopqrstuvwxyz"
    "23456789"
)

def generate_verification_code():
    return ''.join(
        secrets.choice(CHARACTERS)
        for _ in range(6)
    )

def hash_verification_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

class SQLAlchemyUserRepository(UserRepository):
    def create(self, user):
        now = datetime.now(UTC)
        # password_hast = hash_verification_code(user.password)

        model = UserModel(
            name=user.name,
            email=user.email,
            password=user.password,
            terms_accepted_at=now,
            age_confirmed_at=now,
            terms_version="v1.0"
        )

        db.session.add(model)
        db.session.commit()
        return model

    def create_pending_registration(self, user):
        now = datetime.now(UTC)
        code = generate_verification_code()
        code_hash = hash_verification_code(code)

        model = PendingRegistration(
            name=user.name,
            email=user.email,
            password=user.password,
            terms_accepted_at=now,
            age_confirmed_at=now,
            terms_version="v1.0",
            code_hash=code_hash,
            attempts_used=0,
            created_at=now,
            expires_at=now + timedelta(minutes=10),
            locked_until=None
        )

        db.session.add(model)
        db.session.commit()
        return model, code

    def find_by_email(self, email):
        return UserModel.query.filter_by(email=email).first()

    def find_pending_by_email(self, email):
        return PendingRegistration.query.filter_by(email=email).first()

    def update_pending_registration(self, pending, user):
        now = datetime.now(UTC)

        code = generate_verification_code()
        code_hash = hash_verification_code(code)

        pending.name = user.name
        pending.password = user.password
        pending.terms_accepted_at = now
        pending.age_confirmed_at = now
        pending.terms_version = "v1.0"

        pending.code_hash = code_hash
        pending.attempts_used = 0
        pending.created_at = now
        pending.expires_at = now + timedelta(minutes=10)

        db.session.commit()

        return code

    def delete_expired_pending_registrations(self):
        now = datetime.now(UTC)

        deleted = PendingRegistration.query.filter(
            PendingRegistration.expires_at < now
        ).delete(
            synchronize_session=False
        )

        db.session.commit()
        return deleted

    def delete_pending_registration(self, pending):
        db.session.delete(pending)
        db.session.commit()