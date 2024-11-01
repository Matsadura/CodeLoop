"""Holds the Submission class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, Enum, ForeignKey
from sqlalchemy.orm import relationship


class Submission(BaseModel, Base):
    """Representation of a submission"""
    __tablename__ = 'submissions'
    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False)
    task_id = Column(String(128),
                     ForeignKey('tasks.id', ondelete='CASCADE'),
                     nullable=False)
    code = Column(TEXT, nullable=False)
    language = Column(Enum('python', 'c'), nullable=False)
    status = Column(Enum('pending', 'correct', 'incorrect'),
                    nullable=False)
    task = relationship("Task", back_populates="submissions",)
    solution_results = relationship("Solution_Result",
                                    back_populates="submission",)


def __init__(self, *args, **kwargs):
    """initializes submission"""
    super().__init__(*args, **kwargs)
