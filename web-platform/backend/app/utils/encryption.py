"""
Encryption utilities for API keys and sensitive data.
"""
import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


def get_encryption_key() -> bytes:
    """
    Derive encryption key from SECRET_KEY.
    Uses PBKDF2 for key derivation.
    """
    secret = settings.SECRET_KEY.encode()
    salt = os.getenv("ENCRYPTION_SALT", "crewai-platform-salt").encode()

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret))
    return key


def get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption."""
    return Fernet(get_encryption_key())


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key.

    Args:
        api_key: Plain text API key

    Returns:
        Encrypted API key as base64 string
    """
    if not api_key:
        return ""

    fernet = get_fernet()
    encrypted = fernet.encrypt(api_key.encode())
    return base64.urlsafe_b64encode(encrypted).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an API key.

    Args:
        encrypted_key: Encrypted API key as base64 string

    Returns:
        Plain text API key
    """
    if not encrypted_key:
        return ""

    try:
        fernet = get_fernet()
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception:
        # Return empty string if decryption fails
        return ""


def mask_api_key(api_key: str, visible_chars: int = 4) -> str:
    """
    Mask an API key for display, showing only last few characters.

    Args:
        api_key: Plain text API key
        visible_chars: Number of characters to show at the end

    Returns:
        Masked API key (e.g., "sk-****abcd")
    """
    if not api_key or len(api_key) <= visible_chars:
        return "*" * 8

    prefix = api_key[:3] if len(api_key) > 10 else ""
    suffix = api_key[-visible_chars:]
    hidden_length = len(api_key) - len(prefix) - visible_chars

    return f"{prefix}{'*' * min(hidden_length, 8)}{suffix}"


class APIKeyManager:
    """Manager class for handling encrypted API keys."""

    def __init__(self, encrypted_keys: dict = None):
        self._encrypted_keys = encrypted_keys or {}

    def set_key(self, provider: str, api_key: str) -> None:
        """Encrypt and store an API key for a provider."""
        self._encrypted_keys[provider] = encrypt_api_key(api_key)

    def get_key(self, provider: str) -> Optional[str]:
        """Get and decrypt an API key for a provider."""
        encrypted = self._encrypted_keys.get(provider)
        if not encrypted:
            return None
        return decrypt_api_key(encrypted)

    def delete_key(self, provider: str) -> bool:
        """Delete an API key for a provider."""
        if provider in self._encrypted_keys:
            del self._encrypted_keys[provider]
            return True
        return False

    def list_providers(self) -> list:
        """List all providers with stored API keys."""
        return list(self._encrypted_keys.keys())

    def get_masked_keys(self) -> dict:
        """Get all API keys in masked format for display."""
        result = {}
        for provider, encrypted in self._encrypted_keys.items():
            decrypted = decrypt_api_key(encrypted)
            result[provider] = mask_api_key(decrypted) if decrypted else None
        return result

    def to_dict(self) -> dict:
        """Return encrypted keys dict for storage."""
        return self._encrypted_keys.copy()

    @classmethod
    def from_dict(cls, data: dict) -> "APIKeyManager":
        """Create manager from stored encrypted keys."""
        return cls(encrypted_keys=data or {})
