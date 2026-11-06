from flask import Blueprint, send_from_directory
from backend.config import STATIC

bp = Blueprint("pages", __name__)


def page():
    r = send_from_directory(STATIC, "index.html")
    r.headers["Cache-Control"] = "no-store"
    return r


@bp.route("/")
@bp.route("/watch")
@bp.route("/results")
@bp.route("/shorts")
@bp.route("/channel")
def pages():
    return page()
