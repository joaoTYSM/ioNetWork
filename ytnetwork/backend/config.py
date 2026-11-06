import os, shutil
from backend.cookies import get_cookie_file
import requests
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC = os.path.join(HERE, "static")
S = requests.Session()
S.mount("https://", requests.adapters.HTTPAdapter(pool_connections=24, pool_maxsize=80))
pool = ThreadPoolExecutor(12)
ppool = ThreadPoolExecutor(16)
hpool = ThreadPoolExecutor(5)
JSR = {r: {} for r in ("deno", "node", "bun") if shutil.which(r)}
BASE = {"quiet": True, "no_warnings": True, "noplaylist": True, "socket_timeout": 15}
COOKIE_FILE = get_cookie_file()
if COOKIE_FILE:
    BASE["cookiefile"] = COOKIE_FILE
if JSR:
    BASE["js_runtimes"] = JSR
    BASE["remote_components"] = ["ejs:github"]
