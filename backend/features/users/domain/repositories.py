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