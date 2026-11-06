import os
import shutil
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
COOKIE_FILE = HERE / "cookies.txt"

CANDIDATES = [
    COOKIE_FILE,
    Path(os.environ.get("YTDLP_COOKIES", "")) if os.environ.get("YTDLP_COOKIES") else None,
    Path.home() / "cookies.txt",
    Path.home() / ".config" / "yt-dlp" / "cookies.txt",
    Path("/storage/emulated/0/Download/cookies.txt"),
    Path("/sdcard/Download/cookies.txt"),
    Path("/storage/emulated/0/cookies.txt"),
]


def _valid(path):
    try:
        if not path.is_file() or path.stat().st_size == 0:
            return False
        with path.open("r", encoding="utf-8", errors="ignore") as fh:
            for _ in range(40):
                line = fh.readline()
                if not line:
                    break
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) >= 7:
                    return True
        return False
    except OSError:
        return False


def locate():
    seen = set()
    for candidate in CANDIDATES:
        if not candidate:
            continue
        try:
            path = candidate.expanduser().resolve()
        except OSError:
            continue
        if str(path) in seen:
            continue
        seen.add(str(path))
        if _valid(path):
            return path
    return None


def install():
    source = locate()
    if source is None:
        return None
    target = COOKIE_FILE.resolve()
    if source != target:
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(prefix="cookies-", suffix=".txt", dir=str(target.parent))
        os.close(fd)
        try:
            shutil.copyfile(source, tmp)
            os.replace(tmp, target)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
    try:
        os.chmod(target, 0o600)
    except OSError:
        pass
    return target


def get_cookie_file():
    installed = install()
    return str(installed) if installed else None


def status():
    path = get_cookie_file()
    return {
        "configured": bool(path),
        "path": path,
        "source": "file",
    }
