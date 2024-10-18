#!/usr/bin/env python3
"""Holds class User_Profile"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship


class User_Profile(BaseModel, Base):
    """Representation of a vault """
    __tablename__ = 'user_profile'
    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False)
    bio = Column(String(512), nullable=True)
    profile_pic = Column(String(255), nullable=True)
    user = relationship("User", back_populates="user_profiles",)

    def __init__(self, *args, **kwargs):
        """initializes vault"""
        super().__init__(*args, **kwargs)
