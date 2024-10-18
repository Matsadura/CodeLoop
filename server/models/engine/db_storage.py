#!/usr/bin/env python3
"""
Contains the class DBStorage
"""

from models.base_model import Base
from models.user import User
from models.user_profile import User_Profile
from os import getenv
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

classes = {"User": User, "User_Profile": User_Profile}


class DBStorage:
    """Interaacts with the MySQL database"""
    __engine = None
    __session = None

    def __init__(self):
        """Instantiate a DBStorage object"""
        CODE_DB_USER = getenv('CODE_DB_USER')
        CODE_DB_PASSWORD = getenv('CODE_DB_PASSWORD')
        CODE_DB_HOST = getenv('CODE_DB_HOST')
        CODE_DB_NAME = getenv('CODE_DB_NAME')
        self.__engine = create_engine('mysql+mysqldb://{}:{}@{}/{}'.
                                      format(CODE_DB_USER,
                                             CODE_DB_PASSWORD,
                                             CODE_DB_HOST,
                                             CODE_DB_NAME))

    def all(self, cls=None):
        """query on the current database session and return a dict"""
        new_dict = {}
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs = self.__session.query(classes[clss]).all()
                for obj in objs:
                    key = f"{obj.__class__.__name__}.{obj.id}"
                    new_dict[key] = obj
        return (new_dict)

    def all_list(self, cls=None):
        """query on the current database session and return a list"""
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs = self.__session.query(classes[clss]).all()
        return objs

    def all_list_specific(self, cls, attribute, value):
        """
        query on the current database session and return a list
        of a specific object class with a specific attribute
        and a specific value
        """
        objs = []
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs.extend(self.__session.query(classes[clss]).filter(
                    getattr(cls, attribute) == value).all())
        return objs

    def new(self, obj):
        """Add the object to the current database session"""
        self.__session.add(obj)

    def save(self):
        """Commit all changes of the current database session"""
        self.__session.commit()

    def delete(self, obj=None):
        """Delete from the current database session obj if not None"""
        if obj is not None:
            self.__session.delete(obj)

    def reload(self):
        """Reloads data from the database"""
        Base.metadata.create_all(self.__engine)
        sess_factory = sessionmaker(bind=self.__engine, expire_on_commit=False)
        Session = scoped_session(sess_factory)
        self.__session = Session

    def close(self):
        """Call remove() method on the private session attribute"""
        self.__session.remove()

    def get(self, cls, id):
        """Returns the object based on the class and its ID,
            or None if not found"""
        return self.__session.query(cls).filter(getattr(cls, 'id') == id)

    def get_specific(self, cls, attribute, value):
        """Retun the object based on the class, attrubite and value"""
        return self.__session.query(cls).filter(
            getattr(cls, attribute) == value).first()

    def get_specific_double(self, cls, attr_1, val_1, attr_2, val_2):
        """Retun the object based on the class, and multiple attributes"""
        return self.__session.query(cls).filter(
            getattr(cls, attr_1) == val_1,
            getattr(cls, attr_2) == val_2).first()

    def count(self, cls=None):
        """
        Returns the number of objects in storage matching the given class.
        If no class is passed, returns the count of all objects in storage.
        """
        return len(self.all(cls).keys())