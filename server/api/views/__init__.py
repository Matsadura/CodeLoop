#!/usr/bin/python3
""" Contains the flask blueprint """
from flask import Blueprint

app_views = Blueprint('app_views', __name__, url_prefix="/api")

from api.views.index import *  # nopep8
from api.views.auth import *  # nopep8
from api.views.categories import *  # nopep8
from api.views.users import *  # nopep8
from api.views.tasks import *  # nopep8
from api.views.task_test_cases import *  # nopep8
from api.views.user_favorites import *  # nopep8
from api.views.user_profiles import *  # nopep8
from api.views.submissions import *  # nopep8
from api.views.solution_results import *  # nopep8
