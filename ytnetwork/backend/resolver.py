import re, threading, time
from urllib.parse import quote
from yt_dlp import YoutubeDL
from backend.config import BASE
from backend.language import lang_of

lock, locks, cache = threading.Lock(), {}, {}


def _res(f):
    w, h = f.get("width") or 0, f.get("height") or 0
    return min(w, h) if w and h else (h or 0)


def _fmt(f):
    return {"url": f["url"], "h": f.get("http_headers") or {}, "res": _res(f),
            "ext": f.get("ext"), "vc": f.get("vcodec") or "none", "ac": f.get("acodec") or "none",
            "tbr": f.get("tbr") or f.get("vbr") or f.get("abr") or 0, "size": f.get("filesize") or f.get("filesize_approx"),
            "proto": f.get("protocol", "")}


def resolve(vid):
    c = cache.get(vid)
    if c and c["exp"] > time.time():
        return c
    with lock:
        l = locks.setdefault(vid, threading.Lock())
    with l:
        c = cache.get(vid)
        if c and c["exp"] > time.time():
            return c
        with YoutubeDL({**BASE, "skip_download": True, "check_formats": False}) as y:
            info = y.extract_info("https://youtu.be/" + vid, download=False)
        fm = [_fmt(f) for f in (info.get("formats") or []) if f.get("url") and str(f.get("protocol", "")).startswith("http")]
        if not fm and info.get("url"):
            fm = [_fmt(info)]
        c = {"fm": fm, "exp": time.time() + 3 * 3600,
             "title": info.get("title", ""), "channel": info.get("uploader", ""),
             "cid": info.get("channel_id"), "views": info.get("view_count"),
             "likes": info.get("like_count"), "date": info.get("upload_date"),
             "desc": (info.get("description") or "")[:5000],
             "tags": [t for t in (info.get("tags") or []) if " " not in t][:3],
             "subs": info.get("channel_follower_count"), "dur": info.get("duration"),
             "lang": lang_of(info.get("title", "")),
             "chapters": [{"start": x.get("start_time", 0), "title": x.get("title", "")} for x in (info.get("chapters") or [])],
             "comment_count": info.get("comment_count"), "verified": bool(info.get("channel_is_verified"))}
        c["muxh"] = max([f["res"] for f in fm if f["vc"] != "none" and f["ac"] != "none"] or [0])
        c["q"] = sorted({f["res"] for f in fm if f["vc"] != "none" and f["ac"] == "none" and f["res"] and f["ext"] == "mp4"}
                        | ({c["muxh"]} if c["muxh"] else set()))
        c["creators"] = creators(c)
        cache[vid] = c
        return c


def creators(c):
    names = [n.strip() for n in re.split(r"\s+(?:&|and)\s+", c["channel"] or "") if n.strip()] or [c["channel"] or ""]
    out = []
    for k, n in enumerate(names[:2]):
        src = "/avatar/" + c["cid"] if k == 0 and c["cid"] else "/avatar/name?n=" + quote(n)
        out.append({"name": n, "src": src})
    return out


def pick(c, kind, h=0):
    fm = c["fm"]
    if kind == "a":
        xs = [f for f in fm if f["ac"] != "none" and f["vc"] == "none"]
        xs.sort(key=lambda f: (f["ext"] == "m4a", f["tbr"]), reverse=True)
        return xs[0] if xs else None
    if kind == "v":
        xs = [f for f in fm if f["vc"] != "none" and f["ac"] == "none" and f["ext"] == "mp4" and f["res"] and (not h or f["res"] <= h)]
        xs.sort(key=lambda f: (f["res"], f["vc"].startswith("avc1"), f["tbr"]), reverse=True)
        return xs[0] if xs else None
    xs = [f for f in fm if f["vc"] != "none" and f["ac"] != "none"]
    xs.sort(key=lambda f: (f["ext"] == "mp4", f["res"], f["tbr"]), reverse=True)
    return xs[0] if xs else (fm[0] if fm else None)


def plan(c, cap=1080):
    vf = pick(c, "v", cap or 1080)
    if vf and vf["res"] > c["muxh"]:
        return {"dual": True, "h": vf["res"]}
    return {"dual": False, "h": c["muxh"]}
