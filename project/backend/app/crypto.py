import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from .config import get_settings


def _fernet() -> Fernet:
    digest = hashlib.sha256(get_settings().app_secret.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        raise ValueError("Не удалось расшифровать ключ: APP_SECRET не совпадает")


def hint(value: str) -> str:
    return f"…{value[-4:]}" if len(value) > 4 else "…"
