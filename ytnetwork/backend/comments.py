import time
from flask import Blueprint, jsonify, request
from yt_dlp import YoutubeDL
from backend.config import BASE

bp = Blueprint("comments", __name__)


cc = {}


@bp.route("/api/comments/<vid>")
def api_comments(vid):
    sort = "new" if request.args.get("sort") == "new" else "top"
    try:
        n = min(100, max(10, int(request.args.get("n", 20))))
    except ValueError:
        n = 20
    k = (vid, sort, n)
    c = cc.get(k)
    if c and c[0] > time.time():
        return jsonify(c[1])
    out = {"count": None, "items": []}
    ttl = 60
    try:
        opts = {**BASE, "skip_download": True, "getcomments": True,
                "extractor_args": {"youtube": {"max_comments": [str(n * 3), str(n), str(n * 2), "3", "1"],
                                               "comment_sort": [sort]}}}
        with YoutubeDL(opts) as y:
            info = y.extract_info("https://youtu.be/" + vid, download=False)
        rows = info.get("comments") or []
        by = {}
        for x in rows:
            if x.get("parent") in (None, "root"):
                by[x["id"]] = {"id": x["id"], "author": x.get("author"), "text": x.get("text"),
                               "likes": x.get("like_count"), "ts": x.get("timestamp"),
                               "thumb": x.get("author_thumbnail"), "pinned": bool(x.get("is_pinned")),
                               "creator": bool(x.get("author_is_uploader")), "heart": bool(x.get("is_favorited")),
                               "replies": []}
        for x in rows:
            p = by.get(x.get("parent"))
            if p is not None:
                p["replies"].append({"id": x["id"], "author": x.get("author"), "text": x.get("text"),
                                     "likes": x.get("like_count"), "ts": x.get("timestamp"),
                                     "thumb": x.get("author_thumbnail"), "creator": bool(x.get("author_is_uploader")),
                                     "heart": bool(x.get("is_favorited")), "pinned": False})
        out = {"count": info.get("comment_count"), "items": list(by.values())}
        ttl = 3600 if out["items"] else 60
    except Exception:
        pass
    cc[k] = (time.time() + ttl, out)
    return jsonify(out)
