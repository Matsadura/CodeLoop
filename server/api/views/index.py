#!/usr/bin/python3
"""Status, health and metrics routes"""
import logging

from api.views import app_views
from flask import jsonify
from models import storage
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


@app_views.route('/status')
def status():
    """Liveness: the process is up and serving requests"""
    return {"status": "OK"}, 200


@app_views.route('/health')
def health():
    """Readiness: the API can reach its database.

    Returns 200 when ready and 503 otherwise. Judge0 is deliberately not
    part of readiness: when it is down the API keeps serving everything
    except code execution, and submissions report the outage themselves.
    """
    try:
        storage.ping()
    except SQLAlchemyError as error:
        logger.warning('Health check: database unavailable (%s)',
                       error.__class__.__name__)
        return jsonify({"status": "unavailable",
                        "database": "unavailable"}), 503
    return jsonify({"status": "ok", "database": "ok"}), 200


@app_views.route('/stats')
def stats():
    """Return the count of all classes"""
    from models.solution_result import Solution_Result
    from models.submission import Submission
    from models.user import User
    from models.user_favorite import User_Favorite
    from models.user_profile import User_Profile
    from models.task import Task
    from models.task_test_cases import Task_Test_Cases
    from models.category import Category

    return {
            "Categories": storage.count(Category),
            "Users": storage.count(User),
            "User_Favorites": storage.count(User_Favorite),
            "User_Profile": storage.count(User_Profile),
            "Tasks": storage.count(Task),
            "Task_Test_Cases": storage.count(Task_Test_Cases),
            "Submissions": storage.count(Submission),
            "Solution_Results": storage.count(Solution_Result)
            }
