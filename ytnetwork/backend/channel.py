import json, re, time
from flask import Blueprint, abort, jsonify, request
from yt_dlp import YoutubeDL
from backend.config import BASE, S

bp = Blueprint("channel", __name__)


chc = {}


def flat(url, n):
    k = (url, n)
    c = chc.get(k)
    if c and c[0] > time.time():
        return c[1]
    with YoutubeDL({**BASE, "extract_flat": True, "skip_download": True, "playlistend": n}) as y:
        r = y.extract_info(url, download=False)
    chc[k] = (time.time() + 600, r)
    return r


def find_all(o, key, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == key:
                out.append(v)
            else:
                find_all(v, key, out)
    elif isinstance(o, list):
        for v in o:
            find_all(v, key, out)
    return out


def posts_of(cid):
    hd = {"User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9", "Cookie": "CONSENT=YES+1; SOCS=CAI"}
    for tab in ("posts", "community"):
        try:
            html = S.get(f"https://www.youtube.com/channel/{cid}/{tab}", headers=hd, timeout=12).text
            m = re.search(r"ytInitialData\s*=\s*(\{.+?\});</script>", html, re.S)
            if not m:
                continue
            out = []
            for p in find_all(json.loads(m.group(1)), "backstagePostRenderer", []):
                txt = "".join(x.get("text", "") for x in (p.get("contentText") or {}).get("runs", []))
                img = None
                for im in find_all(p.get("backstageAttachment", {}), "thumbnails", []):
                    if im:
                        img = im[-1]["url"]; break
                out.append({"id": p.get("postId"), "text": txt, "time": ((p.get("publishedTimeText") or {}).get("runs") or [{}])[0].get("text"),
                            "likes": (p.get("voteCount") or {}).get("simpleText"), "img": img})
            if out:
                return out
        except Exception:
            continue
    return []


@bp.route("/api/channel/<cid>")
def api_channel(cid):
    if not re.fullmatch(r"[\w-]{10,40}", cid):
        abort(404)
    tab = request.args.get("tab", "videos")
    p = max(1, int(request.args.get("page", 1)))
    try:
        if tab == "posts":
            return jsonify({"items": posts_of(cid) if p == 1 else []})
        r = flat(f"https://www.youtube.com/channel/{cid}/{'shorts' if tab == 'shorts' else 'videos'}", 24 * p)
        items = [{"id": e["id"], "title": e.get("title"), "channel": r.get("channel") or r.get("uploader"), "cid": cid,
                  "dur": e.get("duration"), "views": e.get("view_count"), "short": tab == "shorts",
                  "thumb": f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg"}
                 for e in (r.get("entries") or [])[24 * (p - 1):] if e and len(e.get("id", "")) == 11]
        return jsonify({"name": r.get("channel") or r.get("uploader") or r.get("title"),
                        "subs": r.get("channel_follower_count"), "items": items})
    except Exception as e:
        return jsonify({"items": [], "error": str(e)[:200]})
