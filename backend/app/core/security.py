import ipaddress
import socket
from urllib.parse import urlparse
import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_session_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=settings.SESSION_EXPIRE_HOURS)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SESSION_SECRET, algorithm="HS256")

def decode_session_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

# PKCE generation
def generate_pkce_pair():
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return code_verifier, code_challenge

# SSRF Protection
def is_safe_external_url(url: str) -> bool:
    """
    Validate that an URL does not point to internal, private, loopback,
    link-local or cloud metadata addresses (SSRF prevention).
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False

        # Check banned hostnames
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            return False

        # Resolve IP addresses
        addr_info = socket.getaddrinfo(hostname, None)
        for family, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_private or
                ip.is_loopback or
                ip.is_reserved or
                ip.is_link_local or
                ip.is_multicast or
                ip == ipaddress.ip_address("169.254.169.254")  # AWS/Cloud metadata
            ):
                return False
        return True
    except Exception:
        return False

# Field encryption for connector credentials
def get_aes_key() -> bytes:
    key_bytes = settings.ENCRYPTION_KEY.encode("utf-8")
    return hashlib.sha256(key_bytes).digest()

def encrypt_secret(plain_text: str) -> str:
    if not plain_text:
        return ""
    key = get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plain_text.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")

def decrypt_secret(cipher_text_b64: str) -> str:
    if not cipher_text_b64:
        return ""
    try:
        raw = base64.b64decode(cipher_text_b64.encode("utf-8"))
        nonce = raw[:12]
        ciphertext = raw[12:]
        aesgcm = AESGCM(get_aes_key())
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")
    except Exception:
        return ""
