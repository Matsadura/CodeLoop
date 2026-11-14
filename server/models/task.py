#!/usr/bin/env python3
"""Holds class Task"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, Enum, ForeignKey
from sqlalchemy.orm import relationship

TASK_DIFFICULTIES = ('easy', 'medium', 'hard')


class Task(BaseModel, Base):
    """Representation of a task """
    __tablename__ = 'tasks'
    title = Column(String(255), nullable=False, unique=True)
    category_id = Column(String(60),
                         ForeignKey('categories.id'),
                         nullable=False)
    description = Column(TEXT, nullable=False)
    difficulty = Column(Enum(*TASK_DIFFICULTIES), nullable=False)
    # Author of the task. Not a foreign key on purpose: tasks are community
    # content and are kept when their author deletes their account.
    user_id = Column(String(60), nullable=False, index=True)
    submissions = relationship("Submission", back_populates="task",
                               cascade="all, delete-orphan",
                               passive_deletes=True)
    task_test_cases = relationship("Task_Test_Cases", back_populates="task",
                                   cascade="all, delete-orphan",
                                   passive_deletes=True)
    user_favorites = relationship("User_Favorite", back_populates="task",
                                  cascade="all, delete-orphan",
                                  passive_deletes=True)
    category = relationship("Category", back_populates="tasks")
