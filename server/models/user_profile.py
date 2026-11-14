#!/usr/bin/env python3
"""Holds class User_Profile"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, ForeignKey
from sqlalchemy.orm import relationship


class User_Profile(BaseModel, Base):
    """Representation of a user profile"""
    __tablename__ = 'user_profile'
    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False, unique=True)
    bio = Column(TEXT, nullable=True)
    profile_pic = Column(String(512), nullable=True)
    user = relationship("User", back_populates="user_profiles")
