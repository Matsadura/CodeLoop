#!/usr/bin/env python3
"""Holds class User"""
import hashlib
import hmac
import re

from models.base_model import BaseModel, Base
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from werkzeug.security import check_password_hash, generate_password_hash

# PBKDF2 hashes fit comfortably in the column and are supported everywhere.
PASSWORD_HASH_METHOD = 'pbkdf2:sha256:600000'
_LEGACY_SHA256 = re.compile(r'^[0-9a-f]{64}$')


class User(BaseModel, Base):
    """Representation of a user """
    __tablename__ = 'users'
    email = Column(String(128), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    first_name = Column(String(128), nullable=False)
    last_name = Column(String(128), nullable=False)
    user_profiles = relationship("User_Profile",
                                 back_populates="user",
                                 cascade="all, delete-orphan",
                                 passive_deletes=True)

    def __init__(self, *args, **kwargs):
        """Initializes user, hashing the plain text password if given"""
        password = kwargs.pop("password", None)
        super().__init__(*args, **kwargs)
        if password is not None:
            self.set_password(password)

    def set_password(self, plain_password):
        """Store a salted hash of ``plain_password``"""
        self.password = generate_password_hash(plain_password,
                                               method=PASSWORD_HASH_METHOD)

    def check_password(self, plain_password):
        """Return True if ``plain_password`` matches the stored hash"""
        return verify_password_hash(plain_password, self.password)

    @property
    def password_needs_rehash(self):
        """True when the stored hash uses an outdated scheme"""
        return not (self.password or '').startswith(PASSWORD_HASH_METHOD)

    @staticmethod
    def verify_password(plain_password, hashed_password):
        """Backward compatible helper: verify a password against a hash"""
        return verify_password_hash(plain_password, hashed_password)


def verify_password_hash(plain_password, stored):
    """Return True if ``plain_password`` matches ``stored``.

    Accounts created before salted hashing was introduced store an unsalted
    SHA-256 hex digest; those are still accepted so users can log in (the
    login route then upgrades the hash).
    """
    stored = stored or ''
    if _LEGACY_SHA256.match(stored):
        digest = hashlib.sha256(plain_password.encode()).hexdigest()
        return hmac.compare_digest(digest, stored)
    try:
        return check_password_hash(stored, plain_password)
    except ValueError:
        return False
