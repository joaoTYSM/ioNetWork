import os, threading
from flask import Flask
from backend.config import JSR, STATIC
from backend.feed import ysearch
from backend.language import DEFAULTS
from backend import avatars, channel, comments, feed, pages, shorts, video

app = Flask(__name__, static_folder=STATIC, static_url_path="/static")
for m in (video, shorts, feed, comments, channel, avatars, pages):
    app.register_blueprint(m.bp)


def warm():
    langs = {"en"}
    sysl = os.environ.get("LANG", "en")[:2].lower()
    if sysl in DEFAULTS:
        langs.add(sysl)
    for l in langs:
        for q in DEFAULTS[l][:2]:
            try:
                ysearch(q, 12)
            except Exception:
                pass


if __name__ == "__main__":
    threading.Thread(target=warm, daemon=True).start()
    PORT = int(os.environ.get("PORT", 8765))
    print("JS runtime:", list(JSR) or "NONE (optional: install nodejs for fewer extraction errors)")
    print(f"ytnetwork at http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, threaded=True)
