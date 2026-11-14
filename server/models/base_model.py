#!/usr/bin/env python3
"""
Contains class BaseModel
"""
from datetime import datetime, timezone
import models
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import declarative_base
import uuid

time = "%Y-%m-%dT%H:%M:%S.%f"
Base = declarative_base()


def utcnow():
    """Naive UTC timestamp (the columns are timezone-less DATETIMEs)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class BaseModel:
    """The BaseModel class from which future classes will be derived"""
    id = Column(String(60), primary_key=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, nullable=False)

    # Columns that must never be serialized in API responses.
    hidden_fields = ('password',)

    def __init__(self, *args, **kwargs):
        """Initialization of the base model"""
        for key, value in kwargs.items():
            if key != "__class__":
                setattr(self, key, value)
        if isinstance(self.created_at, str):
            self.created_at = datetime.strptime(self.created_at, time)
        if isinstance(self.updated_at, str):
            self.updated_at = datetime.strptime(self.updated_at, time)
        if not self.created_at:
            self.created_at = utcnow()
        if not self.updated_at:
            self.updated_at = self.created_at
        if not self.id:
            self.id = str(uuid.uuid4())

    def __str__(self):
        """String representation of the BaseModel class"""
        return "[{:s}] ({:s}) {}".format(self.__class__.__name__, self.id,
                                         self.to_dict())

    __repr__ = __str__

    def touch(self):
        """Mark the object as modified now"""
        self.updated_at = utcnow()

    def save(self):
        """Updates the attribute 'updated_at' with the current datetime"""
        self.touch()
        models.storage.new(self)
        models.storage.save()

    def to_dict(self):
        """Returns a dictionary containing the column values of the instance

        Only table columns are serialized, so loaded relationships never leak
        into API responses, and ``hidden_fields`` are always omitted.
        """
        new_dict = {}
        for column in self.__table__.columns:
            if column.key in self.hidden_fields:
                continue
            value = getattr(self, column.key)
            if isinstance(value, datetime):
                value = value.strftime(time)
            new_dict[column.key] = value
        new_dict["__class__"] = self.__class__.__name__
        return new_dict

    def delete(self):
        """Delete the current instance from the storage"""
        models.storage.delete(self)
