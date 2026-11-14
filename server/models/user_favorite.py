"""Holds the user favorite class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship


class User_Favorite(BaseModel, Base):
    """Representation of a user favorite"""
    __tablename__ = 'user_favorites'
    __table_args__ = (
        UniqueConstraint('user_id', 'task_id', name='uq_user_favorites'),
    )
    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False)
    task_id = Column(String(128),
                     ForeignKey('tasks.id', ondelete='CASCADE'),
                     nullable=False)
    task = relationship("Task", back_populates="user_favorites")
