"""Errors shared by the code execution backends (Judge0, Piston)."""


class ExecutionError(Exception):
    """The execution service returned an unexpected or rejected response"""


class ExecutionUnavailable(ExecutionError):
    """The execution service could not be reached or is overloaded"""
