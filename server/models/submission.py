"""Holds the Submission class"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, TEXT, Enum, ForeignKey
from sqlalchemy.orm import relationship

SUBMISSION_LANGUAGES = ('python', 'c')
# pending: waiting for Judge0; error: the code could not be executed
# (e.g. the execution service was unavailable), so it was not graded.
SUBMISSION_STATUSES = ('pending', 'correct', 'incorrect', 'error')


class Submission(BaseModel, Base):
    """Representation of a submission"""
    __tablename__ = 'submissions'
    hidden_fields = ('judge0_tokens',)

    user_id = Column(String(128),
                     ForeignKey('users.id', ondelete='CASCADE'),
                     nullable=False)
    task_id = Column(String(128),
                     ForeignKey('tasks.id', ondelete='CASCADE'),
                     nullable=False)
    code = Column(TEXT, nullable=False)
    language = Column(Enum(*SUBMISSION_LANGUAGES), nullable=False)
    status = Column(Enum(*SUBMISSION_STATUSES), nullable=False)
    # Human readable reason when status is "error" or still "pending".
    status_detail = Column(String(255), nullable=True)
    # JSON list of {"test_case_id", "token", "stdin", "expected_output"}
    # for the Judge0 executions backing this submission (internal only).
    judge0_tokens = Column(TEXT, nullable=True)
    task = relationship("Task", back_populates="submissions")
    solution_results = relationship("Solution_Result",
                                    back_populates="submission",
                                    cascade="all, delete-orphan",
                                    passive_deletes=True)
