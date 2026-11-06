async function feed(p, cb, signal) {
  const r = await fetch("/api/feed?" + new URLSearchParams(p), {signal});
  const rd = r.body.getReader(), td = new TextDecoder(); let buf = "";
  for (;;) {
    const {done, value} = await rd.read(); if (done) break;
    buf += td.decode(value, {stream: true}); let k;
    while ((k = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, k); buf = buf.slice(k + 1); if (l.trim()) cb(JSON.parse(l)); }
  }
}
const warmed = new Set(); const warm = id => { if (id && !warmed.has(id)) { warmed.add(id); fetch("/api/warm/" + id).catch(() => {}); } };
["pointerdown", "touchstart", "mouseover"].forEach(ev => document.addEventListener(ev, e => { const a = e.target.closest?.("a[href^='/watch?v=']"); if (a) warm(new URL(a.href).searchParams.get("v")); }, {passive: true}));

const VIEWS = {};
async function loadViews() {
  await Promise.all(["home", "results", "shorts", "video-player", "channel"].map(async n => { VIEWS[n] = await (await fetch(`/static/views/${n}.html`)).text(); }));
  ["home", "results", "shorts"].forEach(n => { $("#" + n).innerHTML = VIEWS[n]; });
}
const pfQueued = new Set(); let pfBuf = [], pfTimer = 0;
function prefetchHead(id) {
  if (!id || pfQueued.has(id)) return;
  pfQueued.add(id); pfBuf.push(id); clearTimeout(pfTimer);
  pfTimer = setTimeout(() => { while (pfBuf.length) fetch(`/api/prefetch?ids=${pfBuf.splice(0, 12).join(",")}&h=${store("yn_q", 0)}`).catch(() => {}); }, 250);
}
