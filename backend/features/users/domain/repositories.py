from abc import ABC, abstractmethod

# Esto es un "contrato": dice QUÉ debe poder hacer cualquier
# repositorio de usuarios, sin decir CÓMO. No tiene código real.
class UserRepository(ABC):
    @abstractmethod
    def create(self, user):
        pass

    @abstractmethod
    def find_by_email(self, email):
        pass

    @abstractmethod
    def create_pending_registration(self, user):
        pass

    @abstractmethod
    def update_pending_registration(self, pending, user):
        pass

    @abstractmethod
    def find_pending_by_email(self, email):
        pass

    @abstractmethod
    def delete_pending_registration(self, pending):
        pass

    @abstractmethod
    def delete_expired_pending_registrations(self):
        pass