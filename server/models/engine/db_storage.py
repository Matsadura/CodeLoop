#!/usr/bin/env python3
"""
Contains the class DBStorage
"""

from models.base_model import Base
from models.category import Category
from models.solution_result import Solution_Result
from models.submission import Submission
from models.task import Task
from models.task_test_cases import Task_Test_Cases
from models.user import User
from models.user_favorite import User_Favorite
from models.user_profile import User_Profile
from sqlalchemy import create_engine, event, func, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool

classes = {"User": User,
           "User_Profile": User_Profile,
           "Task": Task,
           "Task_Test_Cases":
           Task_Test_Cases,
           "Submission": Submission,
           "Solution_Result": Solution_Result,
           "User_Favorite": User_Favorite,
           "Category": Category
           }


class StorageNotConfigured(RuntimeError):
    """Raised when storage is used before ``configure`` was called."""


def _resolve(cls):
    """Accept a model class or its name"""
    if isinstance(cls, str):
        return classes[cls]
    return cls


def _enable_sqlite_foreign_keys(dbapi_connection, _record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


class DBStorage:
    """Interacts with the database through a scoped SQLAlchemy session.

    The engine is created by ``configure`` (called from the Flask app
    factory) rather than at import time, so importing the models never opens
    a database connection.
    """
    __engine = None
    __session = None

    def configure(self, database_url, **engine_options):
        """Create the engine and session factory for ``database_url``"""
        url = make_url(database_url)
        if url.get_backend_name() == 'sqlite':
            engine_options.setdefault(
                'connect_args', {'check_same_thread': False})
            if url.database in (None, '', ':memory:'):
                engine_options.setdefault('poolclass', StaticPool)
        else:
            # Detect connections dropped by MySQL (wait_timeout) or a
            # managed provider and transparently reconnect.
            engine_options.setdefault('pool_pre_ping', True)
            engine_options.setdefault('pool_recycle', 280)
        if self.__session is not None:
            self.__session.remove()
        if self.__engine is not None:
            self.__engine.dispose()
        self.__engine = create_engine(url, **engine_options)
        if url.get_backend_name() == 'sqlite':
            event.listen(self.__engine, 'connect',
                         _enable_sqlite_foreign_keys)
        self.reload()

    @property
    def engine(self):
        if self.__engine is None:
            raise StorageNotConfigured('storage.configure() was not called')
        return self.__engine

    @property
    def session(self):
        """The current scoped session"""
        if self.__session is None:
            raise StorageNotConfigured('storage.configure() was not called')
        return self.__session

    def reload(self):
        """(Re)create the session factory bound to the engine"""
        sess_factory = sessionmaker(bind=self.engine, expire_on_commit=False)
        self.__session = scoped_session(sess_factory)

    def create_all(self):
        """Create missing tables (tests and throwaway databases only;
        real deployments use Alembic migrations)"""
        Base.metadata.create_all(self.engine)

    def drop_all(self):
        """Drop every table (tests only)"""
        Base.metadata.drop_all(self.engine)

    def ping(self):
        """Run a trivial query; raises if the database is unreachable"""
        with self.engine.connect() as connection:
            connection.execute(text('SELECT 1'))

    def query(self, cls):
        """Start a query for ``cls``"""
        return self.session.query(_resolve(cls))

    def all(self, cls=None):
        """query on the current database session and return a dict"""
        new_dict = {}
        targets = [_resolve(cls)] if cls is not None else classes.values()
        for clss in targets:
            for obj in self.session.query(clss).all():
                new_dict[f"{obj.__class__.__name__}.{obj.id}"] = obj
        return new_dict

    def all_list(self, cls=None):
        """query on the current database session and return a list"""
        if cls is None:
            return list(self.all().values())
        cls = _resolve(cls)
        return self.session.query(cls).order_by(cls.created_at).all()

    def all_list_specific(self, cls, attribute, value):
        """
        query on the current database session and return a list
        of a specific object class with a specific attribute
        and a specific value
        """
        cls = _resolve(cls)
        return self.session.query(cls).filter(
            getattr(cls, attribute) == value).order_by(cls.created_at).all()

    def new(self, obj):
        """Add the object to the current database session"""
        self.session.add(obj)

    def save(self):
        """Commit all changes of the current database session.

        On failure the session is rolled back so it stays usable, and the
        original exception is re-raised.
        """
        try:
            self.session.commit()
        except BaseException:
            self.session.rollback()
            raise

    def rollback(self):
        """Discard pending changes"""
        self.session.rollback()

    def delete(self, obj=None):
        """Delete from the current database session obj if not None"""
        if obj is not None:
            self.session.delete(obj)

    def close(self):
        """Call remove() method on the private session attribute"""
        if self.__session is not None:
            self.__session.remove()

    def get(self, cls, id):
        """Returns the object based on the class and its ID,
            or None if not found"""
        if id is None:
            return None
        return self.session.get(_resolve(cls), id)

    def get_specific(self, cls, attribute, value):
        """Retun the object based on the class, attrubite and value"""
        cls = _resolve(cls)
        return self.session.query(cls).filter(
            getattr(cls, attribute) == value).first()

    def get_specific_double(self, cls, attr_1, val_1, attr_2, val_2):
        """Retun the object based on the class, and multiple attributes"""
        cls = _resolve(cls)
        return self.session.query(cls).filter(
            getattr(cls, attr_1) == val_1,
            getattr(cls, attr_2) == val_2).first()

    def count(self, cls=None):
        """
        Returns the number of objects in storage matching the given class.
        If no class is passed, returns the count of all objects in storage.
        """
        targets = [_resolve(cls)] if cls is not None else classes.values()
        return sum(self.session.query(func.count(clss.id)).scalar()
                   for clss in targets)

    def count_where(self, cls, *criteria):
        """Count rows of ``cls`` matching SQLAlchemy ``criteria``"""
        cls = _resolve(cls)
        return self.session.query(func.count(cls.id)).filter(
            *criteria).scalar()

    def count_specific(self, cls, attribute, value):
        """Number of ``cls`` rows where ``attribute == value``"""
        cls = _resolve(cls)
        return self.count_where(cls, getattr(cls, attribute) == value)

    def count_specific_double(self, cls, attr_1, val_1, attr_2, val_2):
        """Number of ``cls`` rows matching two attribute values"""
        cls = _resolve(cls)
        return self.count_where(cls,
                                getattr(cls, attr_1) == val_1,
                                getattr(cls, attr_2) == val_2)

    def count_specific_triple(self, cls, attr_1, val_1,
                              attr_2, val_2, attr_3, val_3):
        """Number of ``cls`` rows matching three attribute values"""
        cls = _resolve(cls)
        return self.count_where(cls,
                                getattr(cls, attr_1) == val_1,
                                getattr(cls, attr_2) == val_2,
                                getattr(cls, attr_3) == val_3)

    def count_grouped(self, cls, group_attribute, *criteria):
        """Return ``{group_value: count}`` for ``cls`` rows matching
        ``criteria``, grouped by ``group_attribute``"""
        cls = _resolve(cls)
        column = getattr(cls, group_attribute)
        rows = self.session.query(column, func.count(cls.id)).filter(
            *criteria).group_by(column).all()
        return {key: count for key, count in rows}
