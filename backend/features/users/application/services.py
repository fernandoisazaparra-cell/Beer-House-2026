from ..domain.entities import User, DomainValidationError, EmailVerification
from ..domain.repositories import UserRepository
from .dto import RegisterUserDTO, VerifyEmailDTO

from datetime import datetime, timedelta, UTC
from werkzeug.security import check_password_hash

from app.extensions import db


class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def register(self, data: RegisterUserDTO):
        user = User(
            name=data.name,
            email=data.email,
            password=data.password,
            terms=data.terms,
            years=data.years
        )

        if self.repository.find_by_email(user.email):
            raise DomainValidationError({'email': ['El email ya está registrado']})

        pending = self.repository.find_pending_by_email(user.email)
        if pending:
            return self.repository.update_pending_registration(pending, user)

        return self.repository.create_pending_registration(user)

    def verify_email(self, data: VerifyEmailDTO):
        now = datetime.now(UTC).replace(tzinfo=None)
        verification = EmailVerification(
            email=data.email,
            code=data.code
        )

        pending = self.repository.find_pending_by_email(verification.email)
        if not pending:
            raise ValueError('No existe una verificación pendiente')

        if pending.locked_until and now < pending.locked_until:
            raise DomainValidationError({
                'code': [
                    'Has superado el número máximo de intentos. '
                    'Intenta nuevamente más tarde.'
                ]
            })

        if now > pending.expires_at:
            raise DomainValidationError({
                'code': ['El código de verificación ha expirado']
            })

        if not check_password_hash(pending.code_hash, data.code):
            pending.attempts_used += 1
            if pending.attempts_used >= 5:
                pending.locked_until = now + timedelta(minutes=15)
            db.session.commit()
            raise DomainValidationError({
                'code': ['El código de verificación es incorrecto']
            })

        self.repository.delete_pending_registration(pending)
        user = User(
            name=pending.name,
            email=pending.email,
            password=pending.password,
            terms=True,
            years=True
        )
        return self.repository.create(user)
