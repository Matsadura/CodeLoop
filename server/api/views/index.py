#!/usr/bin/python3
"""Metrics Routes"""
from api.views import app_views


@app_views.route('/status')
def status():
    """Return the API status all wrapped in a json object"""
    return {"status": "OK"}, 200


@app_views.route('stats')
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
    from models import storage

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
