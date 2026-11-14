"""Contains the Category class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship

CATEGORY_DIFFICULTIES = ('Easy', 'Medium', 'Hard')


class Category(BaseModel, Base):
    """Representation of a category"""
    __tablename__ = 'categories'
    title = Column(String(128), nullable=False, unique=True)
    difficulty = Column(Enum(*CATEGORY_DIFFICULTIES), nullable=False)
    description = Column(String(512), nullable=False)
    imageUrl = Column(String(512), nullable=False)
    tasks = relationship("Task",
                         back_populates="category",
                         cascade="all, delete-orphan")
