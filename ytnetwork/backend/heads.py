import re, threading
from collections import OrderedDict
from backend.config import S

HEADS = OrderedDict()
state = {"bytes": 0}
guard = threading.Lock()
CAP = 96 * 1024 * 1024
CH1, CH = 1024 * 1024, 4 * 1024 * 1024


def head_get(k):
    with guard:
        v = HEADS.get(k)
        if v:
            HEADS.move_to_end(k)
        return v


def head_put(k, v):
    with guard:
        old = HEADS.pop(k, None)
        if old:
            state["bytes"] -= len(old["b"])
        HEADS[k] = v
        state["bytes"] += len(v["b"])
        while state["bytes"] > CAP and HEADS:
            _, o = HEADS.popitem(last=False)
            state["bytes"] -= len(o["b"])


def rng(f, s0, e0):
    h = dict(f["h"])
    h["Range"] = f"bytes={s0}-{e0}"
    r = None
    for _ in range(2):
        try:
            r = S.get(f["url"], headers=h, timeout=15)
            if r.status_code < 400:
                return r
        except Exception:
            r = None
    return r


def total_of(r):
    m = re.search(r"/(\d+)$", r.headers.get("Content-Range", ""))
    return int(m.group(1)) if m else int(r.headers.get("Content-Length", 0))
