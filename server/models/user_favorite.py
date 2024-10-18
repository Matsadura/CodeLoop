"""Holds the user favorite class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship


class User_Favorite(BaseModel, Base):
    """Representation of a user favorite"""
    __tablename__ = 'user_favorites'
    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False)
    task_id = Column(String(128),
                     ForeignKey('tasks.id', ondelete='CASCADE'),
                     nullable=False)
    task = relationship("Task", back_populates="user_favorites",)


def __init__(self, *args, **kwargs):
    """initializes user favorite"""
    super().__init__(*args, **kwargs)
