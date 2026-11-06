import hashlib, json, re, time
from concurrent.futures import as_completed
from flask import Blueprint, Response, request
from yt_dlp import YoutubeDL
from backend.config import BASE, S, pool
from backend.language import DEFAULTS, lang_of

bp = Blueprint("feed", __name__)
sg = {}


sc = {}


def ysearch(q, n):
    k = (q, n)
    c = sc.get(k)
    if c and c[0] > time.time():
        return c[1]
    with YoutubeDL({**BASE, "extract_flat": True, "skip_download": True}) as y:
        r = y.extract_info(f"ytsearch{n}:{q}", download=False)
    items = [{"id": e["id"], "title": e.get("title"), "channel": e.get("channel") or e.get("uploader"),
              "cid": e.get("channel_id"), "dur": e.get("duration"), "views": e.get("view_count"),
              "lang": lang_of(e.get("title")),
              "thumb": f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg"}
             for e in r.get("entries", []) if e and len(e.get("id", "")) == 11]
    sc[k] = (time.time() + 900, items)
    return items


def allowed(i, L, mix):
    if L == "a" or i["lang"] in (None, L):
        return True
    return mix > 0 and int(hashlib.md5(i["id"].encode()).hexdigest()[:2], 16) % 100 < mix * 100


def suggest(q):
    c = sg.get(q)
    if c and c[0] > time.time():
        return c[1]
    try:
        r = S.get("https://suggestqueries.google.com/complete/search", params={"client": "firefox", "ds": "yt", "q": q}, timeout=4).json()
        out = [x for x in r[1] if x.lower() != q.lower()]
    except Exception:
        out = []
    sg[q] = (time.time() + 3600, out)
    return out


def related(q, hs):
    toks = lambda s: set(re.findall(r"\w+", s.lower()))
    hist = [toks(x) for x in hs if x.strip() and x.strip().lower() != q.lower()]
    cands = suggest(q)[:8]
    cands.sort(key=lambda s: -max([len(toks(s) & h) for h in hist] or [0]))
    return cands[:2]


@bp.route("/api/feed")
def api_feed():
    L = request.args.get("l", "en")
    qs = [x for x in request.args.get("q", "").split("|") if x.strip()][:4]
    if not qs:
        qs = DEFAULTS.get(L, DEFAULTS["en"])[:2]
    p = max(1, int(request.args.get("page", 1)))
    short = request.args.get("short") == "1"
    mix = min(0.5, float(request.args.get("mix", 0) or 0))
    expand = request.args.get("x") == "1" and not short
    hs = [x for x in request.args.get("hs", "").split("|") if x]

    def job(q, n):
        try:
            if short:
                items = ysearch(q + " #shorts", 30 * p)[30 * (p - 1):]
                items = [i for i in items if i["dur"] and i["dur"] <= 61]
            else:
                items = ysearch(q, n * p)[n * (p - 1):]
            return [i for i in items if allowed(i, L, mix)]
        except Exception:
            return []

    if expand:
        futs = [pool.submit(job, qs[0], 18)]
        futs += [pool.submit(job, r, 6) for r in related(qs[0], hs)]
        order = futs
    else:
        per = 12 if len(qs) > 1 else 24
        futs = [pool.submit(job, q, per) for q in qs]
        order = None

    def gen():
        seen = set()
        for f in (order or as_completed(futs)):
            for i in f.result():
                if i["id"] not in seen:
                    seen.add(i["id"])
                    yield json.dumps(i) + "\n"

    return Response(gen(), mimetype="application/x-ndjson", headers={"X-Accel-Buffering": "no", "Cache-Control": "no-store"})
