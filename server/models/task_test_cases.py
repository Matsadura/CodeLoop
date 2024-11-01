"""Hold the Task_Test_Cases class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, ForeignKey
from sqlalchemy.orm import relationship


class Task_Test_Cases(BaseModel, Base):
    """Representation of a task test cases"""
    __tablename__ = 'task_test_cases'
    task_id = Column(String(128),
                     ForeignKey('tasks.id', ondelete='CASCADE'),
                     nullable=False)
    input = Column(TEXT, nullable=False)
    expected_output = Column(TEXT, nullable=False)
    task = relationship("Task", back_populates="task_test_cases",)


def __init__(self, *args, **kwargs):
    """initializes task test cases"""
    super().__init__(*args, **kwargs)
