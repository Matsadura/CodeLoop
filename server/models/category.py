"""Contains the Category class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Enum
from sqlalchemy.orm import relationship


class Category(BaseModel, Base):
    """Representation of a category"""
    __tablename__ = 'categories'
    title = Column(String(128), nullable=False)
    difficulty = Column(Enum('Easy', 'Medium', 'Hard'), nullable=False)
    description = Column(String(128), nullable=False)
    imageUrl = Column(String(128), nullable=False)
    tasks = relationship("Task",
                         back_populates="category",
                         cascade="all, delete")

    def __init__(self, *args, **kwargs):
        """initializes category"""
        super().__init__(*args, **kwargs)
