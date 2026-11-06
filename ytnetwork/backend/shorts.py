import re
from flask import Blueprint, jsonify, request
from backend.config import hpool
from backend.heads import head_get, head_put, rng, total_of
from backend.resolver import pick, plan, resolve

bp = Blueprint("shorts", __name__)


@bp.route("/api/plan/<vid>")
def api_plan(vid):
    try:
        return jsonify(plan(resolve(vid), int(request.args.get("h", 0) or 0)))
    except Exception:
        return jsonify({"dual": False, "h": 0})


@bp.route("/api/prefetch")
def prefetch():
    ids = [x for x in request.args.get("ids", "").split(",") if re.fullmatch(r"[\w-]{11}", x)][:12]
    cap = int(request.args.get("h", 0) or 0) or 1080
    secs = 4 if request.args.get("s") == "1" else 3

    def job(vid):
        try:
            c = resolve(vid)
            p = plan(c, cap)
            for kind, h in ([("v", p["h"]), ("a", 0)] if p["dual"] else [("m", 0)]):
                k = (vid, kind, h)
                f = pick(c, kind, h)
                if not f or head_get(k):
                    continue
                limit = 320 * 1024 if kind == "a" else 1500 * 1024
                n = int(min(limit, max(160 * 1024, (f["tbr"] or 600) * 1000 / 8 * secs)))
                r = rng(f, 0, n - 1)
                if r is not None and r.status_code < 400:
                    head_put(k, {"b": r.content, "total": total_of(r), "ct": r.headers.get("Content-Type", "video/mp4")})
        except Exception:
            pass
    for v in ids:
        hpool.submit(job, v)
    return "", 204
