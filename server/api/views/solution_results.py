"""Handle solution results related routes.

Routes:
    - /submissions/<submission_id>/results:
        GET : Retrieves the per-test-case results of one of the current
              user's submissions.
"""
from api.views import app_views
from api.views.submissions import get_owned_submission
from flask import jsonify
from flask_jwt_extended import jwt_required
from models import storage
from models.solution_result import Solution_Result


@app_views.route('/submissions/<submission_id>/results', methods=['GET'])
@jwt_required()
def get_solution_results(submission_id):
    """Retrieves the solution results for a submission.

    - Header: Authorization: Bearer <token>
    """
    get_owned_submission(submission_id)
    solution_result = storage.all_list_specific(Solution_Result,
                                                'submission_id',
                                                submission_id)
    if not solution_result:
        return jsonify({'error': 'Solution result not found'}), 404
    return jsonify([result.to_dict() for result in solution_result])
