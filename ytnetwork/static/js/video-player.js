function savePos(id, t, d) {
  if (!id || !d || !isFinite(d)) return; const m = store("yn_pos", {});
  if (t < 5 || t > d - 8) delete m[id]; else m[id] = {t: Math.floor(t), d: Math.floor(d), ts: Date.now()};
  const k = Object.keys(m); if (k.length > 300) k.sort((a, b) => m[a].ts - m[b].ts).slice(0, k.length - 300).forEach(x => delete m[x]);
  save("yn_pos", m);
}
addEventListener("pagehide", () => { if (W.v && W.id) savePos(W.id, W.v.currentTime, W.v.duration); });
function applyVol() { const v = W.v; if (!v) return; if (W.dual) { v.muted = true; W.a.muted = W.mut; W.a.volume = W.vol; } else { v.muted = W.mut; v.volume = W.vol; } }
function pickH() { const q = W.info?.q || []; if (!q.length || W.music) return 0; const h = q.filter(x => x <= (W.q || 1080)).pop() || q[0]; return h > (W.info.muxh || 0) ? h : 0; }
function loadSrc(t0, play) {
  const v = W.v, a = W.a, id = W.id; if (!v) return; const h = pickH();
  W.dual = !!h; W.curH = h || (W.info?.muxh || 0); a.pause(); a.removeAttribute("src"); $("#bz")?.classList.add("on");
  if (W.dual) { v.src = `/stream/${id}?k=v&h=${h}`; a.src = `/stream/${id}?a=1`; } else v.src = `/stream/${id}${W.music ? "?a=1" : ""}`;
  applyVol();
  v.addEventListener("loadedmetadata", () => { if (t0) { v.currentTime = t0; if (W.dual) a.currentTime = t0; } if (play) v.play().catch(() => {}); }, {once: true});
}
function stopWatch() {
  document.body.classList.remove("cm-open");
  if (W.v) { savePos(W.id, W.v.currentTime, W.v.duration); W.v.pause(); W.v.removeAttribute("src"); W.v.load(); }
  if (W.a) { W.a.pause(); W.a.removeAttribute("src"); }
  clearTimeout(W.idle); document.removeEventListener("fullscreenchange", W.fsh || (() => {})); W = {}; $("#watch").innerHTML = "";
  document.body.style.overflow = "";
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
}
const isFs = () => W.pl && (document.fullscreenElement === W.pl || document.webkitFullscreenElement === W.pl || W.pl.classList.contains("pfs"));
async function toggleFs() {
  const pl = W.pl; if (!pl) return;
  if (isFs()) {
    if (pl.classList.contains("pfs")) { pl.classList.remove("pfs"); document.body.style.overflow = ""; fsSync(); }
    else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    try { screen.orientation?.unlock?.(); } catch {}
    return;
  }
  const req = pl.requestFullscreen || pl.webkitRequestFullscreen;
  if (req) { try { await req.call(pl); try { await screen.orientation?.lock?.("landscape"); } catch {} } catch { pl.classList.add("pfs"); document.body.style.overflow = "hidden"; fsSync(); } }
  else { pl.classList.add("pfs"); document.body.style.overflow = "hidden"; fsSync(); }
}
function fsSync() { const b = $("#fs"); if (b) b.innerHTML = ic(isFs() ? "fsx" : "fs"); }
const SPEEDS = [.25, .5, .75, 1, 1.25, 1.5, 1.75, 2];
async function openWatch(id, item) {
  show("watch"); scrollTo(0, 0);
  W = {id, music: store("yn_music", false), rel: []};
  const w = $("#watch"), th = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  w.innerHTML = VIEWS["video-player"].replace(/{{poster}}/g, th).replace("{{music}}", W.music ? "music" : "").replace("{{ap}}", store("yn_ap", true) ? "on" : "").replace("{{mmic}}", W.music ? "vid" : "hp"); hydrate(w);
  const v = W.v = $("#vid"), pl = W.pl = $("#pl");
  W.vol = 1; W.mut = false; W.q = store("yn_q", 0); W.a = new Audio(); W.a.preload = "auto"; W.info = null;
  setupPlayer(v, pl); bindDual(v, W.a, () => W.dual);
  const saved = (store("yn_pos", {})[id] || {}).t || 0; let lastSave = 0;
  v.addEventListener("timeupdate", () => { const n = Date.now(); if (n - lastSave > 2000 && v.duration) { lastSave = n; savePos(id, v.currentTime, v.duration); } });
  v.addEventListener("pause", () => savePos(id, v.currentTime, v.duration));
  const skeletonInfo = () => { $("#tt").innerHTML = `<i class="ln big skel"></i>`; $("#ch").innerHTML = `<span class="av l skel"></span><div class="mx"><i class="ln xs skel"></i><i class="ln xs skel"></i></div>`; };
  skeletonInfo(); $("#ac").innerHTML = `<span class="btn skel" style="width:96px"></span><span class="btn skel" style="width:90px"></span><span class="btn skel" style="width:110px"></span>`;
  $("#rel").append(...Array.from({length: 8}, skRc));
  const fill = i => {
    W.item = {...(W.item || {}), ...i, id};
    if (i.title) { $("#tt").textContent = i.title; $("#m1").textContent = i.title; }
    if (!i.channel) return; $("#m2").textContent = i.channel;
    const ck = [i.cid, i.channel, i.subs, i.verified].join("|"); if (W.chKey === ck) return; W.chKey = ck;
    const subd = !!subs[i.channel];
    $("#ch").innerHTML = `<div class="chn" data-cid="${i.cid || ""}">${i.cid ? avatar(i.cid, i.channel, "l") : `<span class="av l skel"></span>`}<div><b>${esc(i.channel)}${i.verified ? ic("ok") : ""}</b><small>${i.subs != null ? t("subscribers", fmtN(i.subs)) : ""}</small></div></div><button class="btn pri" id="sub">${subd ? t("subscribed") : t("subscribe")}</button>`;
    $("#sub").onclick = e => { if (subs[i.channel]) delete subs[i.channel]; else subs[i.channel] = i.cid || 1; save("yn_subs", subs); e.currentTarget.textContent = subs[i.channel] ? t("subscribed") : t("subscribe"); renderSide("watch"); };
  };
  const startRel = (ch, tag, lang) => {
    if (W.relOn) return; W.relOn = true;
    const q = [ch, tag].filter(Boolean).join("|"); const relEl = $("#rel"), sks = [...relEl.children];
    feed({q, l: lang || L, page: 1}, x => { if (W.id !== id || x.id === id) return; W.rel.push(x); if (W.rel.length <= 2) warm(x.id); const s = sks.shift(), c = rc(x); s ? s.replaceWith(c) : relEl.append(c); }).then(() => sks.forEach(s => s.remove())).catch(() => sks.forEach(s => s.remove()));
  };
  const words = x => (x || "").split(" ").slice(0, 3).join(" ");
  if (item) { W.item = item; fill(item); startRel(item.channel, words(item.title), item.lang); }
  else fetch(`/api/quick/${id}`).then(r => r.json()).then(q => { if (W.id === id && q.title && !W.item?.title) { fill({...q, id}); document.title = q.title; startRel(q.channel, words(q.title), null); } }).catch(() => {});
  document.title = item?.title || "ytnetwork";
  let liked = false;
  fetch(`/api/info/${id}`).then(r => r.json()).then(i => {
    if (W.id !== id) return; W.info = i; setCmCount(i.comment_count); loadSrc(saved > 5 && saved < (i.dur || 1e9) - 10 ? saved : 0, true); fill(i); document.title = i.title; remember({...i, id}); W.chapters = i.chapters || [];
    $("#ac").innerHTML = `<div class="grp"><button class="btn" id="lk">${ic("like")} ${fmtN(i.likes)}</button><button class="btn flip" id="dk">${ic("like")}</button></div><button class="btn" id="sh2">${ic("share")} ${t("share")}</button><a class="btn" id="dl" href="/download/${id}?h=${W.q || 0}">${ic("dl")} ${t("download")}</a>`;
    $("#lk").onclick = e => { liked = !liked; e.currentTarget.classList.toggle("act", liked); e.currentTarget.innerHTML = `${ic("like")} ${fmtN((i.likes || 0) + (liked ? 1 : 0))}`; };
    $("#sh2").onclick = () => { const u = `${location.origin}/watch?v=${id}`; if (navigator.share) navigator.share({title: i.title, url: u}).catch(() => {}); else navigator.clipboard?.writeText(u); };
    descBox(i); setMS(W.item);
    const q = [i.channel, i.tags?.[0] || (i.title || "").split(" ").slice(0, 3).join(" ")].filter(Boolean).join("|");
    startRel(i.channel, i.tags?.[0] || words(i.title), i.lang);
  }).catch(() => { if (!W.info && W.id === id) loadSrc(0, true); $("#ds").className = "desc"; $("#ds").style.height = ""; $("#ds").textContent = t("error"); $("#rel").innerHTML = ""; });
  setupComments(id);
  if (W.music) $("#mm").classList.add("on");
}
function playNext() {
  const n = W.rel.find(x => x.id !== W.id && !trail.includes(x.id)) || W.rel.find(x => x.id !== W.id);
  if (n) { trail.push(W.id); nav(`/watch?v=${n.id}`, n); }
}
function playPrev() {
  const v = W.v; if (!v) return;
  if (v.currentTime > 3 || !trail.length) { v.currentTime = 0; return; }
  const id = trail.pop(); nav(`/watch?v=${id}`);
}
function setMusic(on) {
  const v = W.v, t0 = v.currentTime, was = !v.paused; W.music = on; save("yn_music", on);
  W.pl.classList.toggle("music", on); $("#mm").classList.toggle("on", on); $("#mm").innerHTML = ic(on ? "vid" : "hp");
  $("#bz").classList.add("on"); loadSrc(t0, was);
}
function setupPlayer(v, pl) {
  const pg = $("#pg"), bz = on => $("#bz").classList.toggle("on", on);
  let drag = false, ck = null;
  const dur = () => v.duration || 0;
  const chapterAt = s => { const c = (W.chapters || []).filter(x => x.start <= s).pop(); return c ? c.title : ""; };
  const upd = () => {
    const d = dur(); if (!d) return;
    $("#tm").textContent = `${fmtT(v.currentTime)} / ${fmtT(d)}`;
    if (!drag) pg.style.setProperty("--p", v.currentTime / d * 100 + "%");
    let b = 0; for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= v.currentTime + 1) b = v.buffered.end(i);
    pg.style.setProperty("--b", b / d * 100 + "%");
    if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) try { navigator.mediaSession.setPositionState({duration: d, position: Math.min(v.currentTime, d), playbackRate: v.playbackRate}); } catch {}
  };
  v.ontimeupdate = v.onprogress = v.onloadedmetadata = v.ondurationchange = upd;
  const frac = e => { const r = pg.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  const tip = e => { const p = frac(e), tp = $("#tip"), r = pg.getBoundingClientRect(), w = tp.offsetWidth / 2 || 20; tp.style.left = Math.min(r.width - w, Math.max(w, p * r.width)) + "px"; const c = chapterAt(p * dur()); tp.innerHTML = `${c ? `<small>${esc(c)}</small>` : ""}${fmtT(p * dur())}`; };
  pg.onpointerdown = e => { drag = true; pg.classList.add("drag"); pg.setPointerCapture(e.pointerId); pg.style.setProperty("--p", frac(e) * 100 + "%"); tip(e); };
  pg.onpointermove = e => { tip(e); if (drag) pg.style.setProperty("--p", frac(e) * 100 + "%"); };
  pg.onpointerup = e => { if (!drag) return; drag = false; pg.classList.remove("drag"); if (dur()) v.currentTime = frac(e) * dur(); };
  pg.onpointercancel = () => { drag = false; pg.classList.remove("drag"); };
  const flash = n => { const f = $("#fl"); f.innerHTML = ic(n); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); };
  const toggle = () => { if (v.paused) { v.play().catch(() => {}); flash("play"); } else { v.pause(); flash("pause"); } };
  const seekBy = d => { v.currentTime = Math.max(0, Math.min(dur() || 1e9, v.currentTime + d)); const el = $(d > 0 ? "#dtr" : "#dtl"); el.textContent = (d > 0 ? "+" : "−") + Math.abs(d); el.classList.remove("go"); void el.offsetWidth; el.classList.add("go"); };
  W.toggle = toggle; W.seekBy = seekBy;
  v.onplay = v.onpause = () => { pl.classList.toggle("paused", v.paused); $("#pp").innerHTML = ic(v.paused ? "play" : "pause"); if ("mediaSession" in navigator) navigator.mediaSession.playbackState = v.paused ? "paused" : "playing"; };
  v.onwaiting = v.onloadstart = v.onseeking = () => bz(true);
  v.onplaying = v.oncanplay = v.onseeked = () => bz(false);
  v.onended = () => { if (store("yn_ap", true)) playNext(); };
  $("#pp").onclick = toggle; $("#nx").onclick = playNext;
  $("#mu").onclick = () => { W.mut = !W.mut; applyVol(); $("#mu").innerHTML = ic(W.mut ? "mute" : "vol"); };
  $("#vol").oninput = e => { W.vol = +e.target.value; W.mut = false; applyVol(); $("#mu").innerHTML = ic(W.vol ? "vol" : "mute"); };
  $("#ap").onclick = e => { const on = !store("yn_ap", true); save("yn_ap", on); e.currentTarget.classList.toggle("on", on); };
  $("#mm").onclick = () => setMusic(!W.music);
  $("#fs").onclick = toggleFs;
  W.fsh = fsSync; document.addEventListener("fullscreenchange", W.fsh);
  const mn = $("#mn");
  const root = () => { mn.innerHTML = `<button class="mi" data-a="qual">${ic("set")}<span>${T("quality", "Quality")}</span><em>${W.q ? W.q + "p" : "Auto"}${W.curH ? " · " + W.curH + "p" : ""}</em></button><button class="mi" data-a="speed">${ic("play")}<span>${t("speed")}</span><em>${v.playbackRate === 1 ? t("normal") : v.playbackRate + "x"}</em></button><button class="mi" data-a="pip">${ic("pip")}<span>${t("pip")}</span></button>${COARSE ? "" : `<button class="mi" data-a="pop">${ic("pop")}<span>${t("popup")}</span></button>`}`; };
  const qlist = () => { const qs = [...(W.info?.q || [])].reverse(); mn.innerHTML = `<button class="mi back" data-a="root">${ic("back")}<span>${T("quality", "Quality")}</span></button>` + [0, ...qs].map(h => `<button class="mi" data-h="${h}">${(W.q || 0) === h ? ic("check") : "<i></i>"}<span>${h ? h + "p" : "Auto"}</span></button>`).join(""); };
  const spd = () => { mn.innerHTML = `<button class="mi back" data-a="root">${ic("back")}<span>${t("speed")}</span></button>` + SPEEDS.map(s => `<button class="mi" data-s="${s}">${v.playbackRate === s ? ic("check") : "<i></i>"}<span>${s === 1 ? t("normal") : s}</span></button>`).join(""); };
  $("#st").onclick = e => { e.stopPropagation(); if (mn.hidden) { root(); mn.hidden = false; } else mn.hidden = true; };
  mn.onclick = e => {
    e.stopPropagation(); const b = e.target.closest(".mi"); if (!b) return;
    if (b.dataset.h !== undefined) { W.q = +b.dataset.h; save("yn_q", W.q); mn.hidden = true; loadSrc(v.currentTime, !v.paused); return; }
    if (b.dataset.s) { v.playbackRate = +b.dataset.s; mn.hidden = true; return; }
    const a = b.dataset.a;
    if (a === "speed") spd(); else if (a === "qual") qlist(); else if (a === "root") root();
    else if (a === "pip") { mn.hidden = true; document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture?.(); }
    else if (a === "pop") { mn.hidden = true; v.pause(); window.open(`/watch?v=${W.id}&popup=1`, "ytp", "popup,width=640,height=380"); }
  };
  pl.addEventListener("click", e => {
    if (e.target.closest(".ctl,.mn")) return;
    if (!mn.hidden) { mn.hidden = true; return; }
    if (e.pointerType === "touch" && pl.classList.contains("idle")) { wake(); return; }
    if (ck) { clearTimeout(ck); ck = null; const r = pl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width; if (x < .33) seekBy(-10); else if (x > .67) seekBy(10); else toggleFs(); return; }
    ck = setTimeout(() => { ck = null; toggle(); }, 260);
  });
  const wake = () => { pl.classList.remove("idle"); clearTimeout(W.idle); W.idle = setTimeout(() => !v.paused && mn.hidden && pl.classList.add("idle"), 2800); };
  pl.onmousemove = pl.ontouchstart = pl.onpointerdown = wake; wake();
  v.onerror = () => { if (v.src && !W.retried) { W.retried = 1; const t0 = v.currentTime; v.src = v.src; v.currentTime = t0; } };
  if ($("#vid").autoplay) v.play().catch(() => { bz(false); });
}
document.addEventListener("keydown", e => {
  if (!W.v || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== "range") return;
  const v = W.v, k = e.key.toLowerCase();
  if (k === " " || k === "k") { e.preventDefault(); W.toggle(); }
  else if (k === "arrowright") { e.preventDefault(); W.seekBy(5); } else if (k === "arrowleft") { e.preventDefault(); W.seekBy(-5); }
  else if (k === "l") W.seekBy(10); else if (k === "j") W.seekBy(-10);
  else if (k === "arrowup") { e.preventDefault(); W.vol = Math.min(1, W.vol + .05); applyVol(); $("#vol").value = W.vol; }
  else if (k === "arrowdown") { e.preventDefault(); W.vol = Math.max(0, W.vol - .05); applyVol(); $("#vol").value = W.vol; }
  else if (k === "f") toggleFs(); else if (k === "m") $("#mu").click();
  else if (k === "n" && e.shiftKey) playNext(); else if (k === "p" && e.shiftKey) playPrev();
  else if (/^[0-9]$/.test(k) && v.duration) v.currentTime = v.duration * +k / 10;
  else if (k === "," && v.paused) v.currentTime -= 1 / 30; else if (k === "." && v.paused) v.currentTime += 1 / 30;
  else if (k === "<") v.playbackRate = Math.max(.25, v.playbackRate - .25); else if (k === ">") v.playbackRate = Math.min(2, v.playbackRate + .25);
  else if (k === "escape" && W.pl.classList.contains("pfs")) toggleFs();
});
function setMS(i) {
  if (!("mediaSession" in navigator) || !W.v) return; const ms = navigator.mediaSession, v = W.v;
  ms.metadata = new MediaMetadata({title: i.title || "", artist: i.channel || "", album: "ytnetwork", artwork: [{src: `https://i.ytimg.com/vi/${i.id}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg"}]});
  const h = (a, f) => { try { ms.setActionHandler(a, f); } catch {} };
  h("play", () => v.play()); h("pause", () => v.pause());
  h("seekbackward", d => v.currentTime -= d?.seekOffset || 10); h("seekforward", d => v.currentTime += d?.seekOffset || 10);
  h("seekto", d => v.currentTime = d.seekTime); h("nexttrack", playNext); h("previoustrack", playPrev);
}
