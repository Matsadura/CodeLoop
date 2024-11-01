#!/usr/bin/env python3
"""Holds class Task"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, Enum, ForeignKey
from sqlalchemy.orm import relationship


class Task(BaseModel, Base):
    """Representation of a task """
    __tablename__ = 'tasks'
    title = Column(String(255), nullable=False)
    category_id = Column(String(60),
                         ForeignKey('categories.id'),
                         nullable=False)
    description = Column(TEXT, nullable=False)
    difficulty = Column(Enum('easy', 'medium', 'hard'), nullable=False)
    user_id = Column(String(60), nullable=False)
    submissions = relationship("Submission", back_populates="task",)
    task_test_cases = relationship("Task_Test_Cases", back_populates="task",)
    user_favorites = relationship("User_Favorite", back_populates="task",)
    category = relationship("Category", back_populates="tasks")

    def __init__(self, *args, **kwargs):
        """Initializes task"""
        super().__init__(*args, **kwargs)
