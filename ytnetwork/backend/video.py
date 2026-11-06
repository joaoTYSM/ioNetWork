import os, re, shutil, tempfile
from concurrent.futures import ThreadPoolExecutor
from flask import Blueprint, Response, abort, jsonify, request, send_file
import requests
from backend.config import S, pool, ppool
from backend.heads import CH, CH1, head_get, rng, total_of
from backend.resolver import pick, resolve

bp = Blueprint("video", __name__)


@bp.route("/stream/<vid>")
def stream(vid):
    kind = "a" if request.args.get("a") == "1" else request.args.get("k", "m")
    h = int(request.args.get("h", 0) or 0)
    m = re.match(r"bytes=(\d*)-(\d*)", request.headers.get("Range", "bytes=0-"))
    s0 = int(m.group(1) or 0) if m else 0
    e0 = int(m.group(2)) if m and m.group(2) else None
    first = f = None
    for attempt in (0, 1):
        try:
            c = resolve(vid)
        except Exception as e:
            return str(e), 502
        f = pick(c, kind, h)
        if not f:
            kind, f = "m", pick(c, "m")
        if not f:
            abort(502)
        hd = head_get((vid, kind, f["res"] if kind == "v" else 0))
        if hd and s0 < len(hd["b"]):
            first, total, ct = hd["b"][s0:], hd["total"], hd["ct"]
            if e0 is not None:
                first = first[: e0 - s0 + 1]
            break
        r = rng(f, s0, min(s0 + CH1 - 1, e0) if e0 is not None else s0 + CH1 - 1)
        if r is not None and r.status_code < 400:
            first, total, ct = r.content, total_of(r), r.headers.get("Content-Type", "video/mp4")
            break
        from backend.resolver import cache
        cache.pop(vid, None)
    else:
        abort(502)
    end = min(e0, total - 1) if e0 is not None else total - 1
    first = first[: end - s0 + 1]
    hdr = {"Content-Type": ct, "Accept-Ranges": "bytes", "Content-Length": str(end - s0 + 1),
           "Cache-Control": "private, max-age=3600"}
    ranged = "Range" in request.headers
    if ranged:
        hdr["Content-Range"] = f"bytes {s0}-{end}/{total}"

    def gen():
        yield first
        futs = []
        nxt = s0 + len(first)

        def sched(p):
            if p <= end:
                futs.append(ppool.submit(rng, f, p, min(p + CH - 1, end)))
                return p + CH
            return p
        for _ in range(2):
            nxt = sched(nxt)
        try:
            while futs:
                rr = futs.pop(0).result()
                if rr is None or rr.status_code >= 400:
                    return
                nxt = sched(nxt)
                yield rr.content
        except GeneratorExit:
            for x in futs:
                x.cancel()

    return Response(gen(), status=206 if ranged else 200, headers=hdr)


@bp.route("/api/info/<vid>")
def api_info(vid):
    try:
        c = resolve(vid)
    except Exception as e:
        return str(e), 502
    return jsonify({k: c[k] for k in ("title", "channel", "cid", "views", "likes", "date", "desc", "tags", "subs", "dur",
                                      "lang", "chapters", "comment_count", "verified", "q", "muxh", "creators")})


@bp.route("/api/warm/<vid>")
def warm_one(vid):
    if re.fullmatch(r"[\w-]{11}", vid):
        pool.submit(resolve, vid)
    return "", 204


@bp.route("/api/quick/<vid>")
def quick(vid):
    try:
        r = S.get("https://www.youtube.com/oembed", params={"url": "https://youtu.be/" + vid, "format": "json"}, timeout=6).json()
        return jsonify({"title": r.get("title"), "channel": r.get("author_name")})
    except Exception:
        return jsonify({})


def pdl(f, path, workers=8, chunk=6 * 1024 * 1024):
    total = total_of(rng(f, 0, 0))
    with open(path, "wb") as fh:
        fh.truncate(total)
    fd = os.open(path, os.O_WRONLY)

    def part(s0):
        os.pwrite(fd, rng(f, s0, min(s0 + chunk - 1, total - 1)).content, s0)
    try:
        with ThreadPoolExecutor(workers) as ex:
            list(ex.map(part, range(0, total, chunk)))
    finally:
        os.close(fd)


@bp.route("/download/<vid>")
def download(vid):
    h = int(request.args.get("h", 0) or 0)
    try:
        c = resolve(vid)
    except Exception as e:
        return str(e), 502
    d = tempfile.mkdtemp()
    name = re.sub(r'[\\/:*?"<>|]+', "", c["title"] or vid)[:80] or vid
    vf = pick(c, "v", h) if shutil.which("ffmpeg") else None
    af = pick(c, "a")
    out = os.path.join(d, name + ".mp4")
    if vf and af and (not c["muxh"] or vf["res"] > c["muxh"]):
        jobs = [pool.submit(pdl, vf, d + "/v.mp4"), pool.submit(pdl, af, d + "/a.m4a")]
        for j in jobs:
            j.result()
        os.system(f'ffmpeg -loglevel error -y -i "{d}/v.mp4" -i "{d}/a.m4a" -c copy -movflags +faststart "{out}"')
    else:
        pdl(pick(c, "m"), out)
    resp = send_file(out, as_attachment=True, download_name=os.path.basename(out))
    resp.call_on_close(lambda: shutil.rmtree(d, ignore_errors=True))
    return resp
