import json, os, re, threading, time
from flask import Blueprint, abort, redirect, request
from yt_dlp import YoutubeDL
from backend.config import BASE, HERE

bp = Blueprint("avatars", __name__)



AV_FILE = os.path.join(HERE, "avatars.json")
try:
    av = json.load(open(AV_FILE))
except Exception:
    av = {}
av_sem = threading.Semaphore(8)


def fetch_avatar(cid):
    try:
        with YoutubeDL({**BASE, "extract_flat": True, "playlistend": 1, "skip_download": True}) as y:
            info = y.extract_info(f"https://www.youtube.com/channel/{cid}", download=False)
        th = info.get("thumbnails") or []
        pick = next((t for t in th if "avatar" in str(t.get("id", ""))), None) or \
            next((t for t in th if t.get("width") and t.get("width") == t.get("height")), None)
        url = pick["url"] if pick else None
        if url and ("ggpht" in url or "googleusercontent" in url):
            url = re.sub(r"=s\d+.*$", "=s96-c", url)
        a = {"url": url}
    except Exception:
        a = {"url": None, "retry": time.time() + 600}
    av[cid] = a
    try:
        json.dump(av, open(AV_FILE, "w"))
    except Exception:
        pass
    return a


@bp.route("/avatar/<cid>")
def avatar(cid):
    if not re.fullmatch(r"[\w-]{10,40}", cid):
        abort(404)
    a = av.get(cid)
    if not a or (not a.get("url") and a.get("retry", 0) < time.time()):
        with av_sem:
            a = av.get(cid) if (av.get(cid) or {}).get("url") else fetch_avatar(cid)
    if not a.get("url"):
        abort(404)
    r = redirect(a["url"], 302)
    r.headers["Cache-Control"] = "public, max-age=86400"
    return r


@bp.route("/avatar/name")
def avatar_by_name():
    n = request.args.get("n", "").strip()[:80]
    if not n:
        abort(404)
    key = "n:" + n
    a = av.get(key)
    if not a or (not a.get("cid") and a.get("retry", 0) < time.time()):
        cid = None
        try:
            with YoutubeDL({**BASE, "extract_flat": True, "skip_download": True}) as y:
                r = y.extract_info(f"ytsearch5:{n}", download=False)
            for e in r.get("entries", []):
                if e and (e.get("channel") or "").strip().lower() == n.lower() and e.get("channel_id"):
                    cid = e["channel_id"]
                    break
        except Exception:
            cid = None
        a = {"cid": cid} if cid else {"cid": None, "retry": time.time() + 600}
        av[key] = a
    if not a.get("cid"):
        abort(404)
    return avatar(a["cid"])
