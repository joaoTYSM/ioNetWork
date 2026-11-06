let SH = null, muted = false;
const SH_AHEAD = 15;
function stopShorts() { if (SH) { SH.io.disconnect(); SH.items.forEach(unmount); SH = null; } $("#sh").innerHTML = ""; document.body.style.overflow = ""; }
function openShorts() {
  show("shorts"); document.body.style.overflow = "hidden";
  SH = {items: [], page: 1, cur: -1, busy: false, seen: new Set(), pf: new Set(), tries: 0, io: new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { SH.cur = +e.target.dataset.i; sync(); } }), {root: $("#sh"), threshold: .6})};
  const sk = document.createElement("div"); sk.className = "short sks"; sk.id = "shsk";
  sk.innerHTML = `<div class="col skel"><div class="bz on"><i class="spin"></i></div><div class="ov"><i class="ln s skel"></i><i class="ln skel"></i></div></div>`;
  $("#sh").append(sk); loadShorts();
}
async function loadShorts() {
  const S = SH; if (!S || S.busy) return; S.busy = true; const n0 = S.items.length;
  try { await feed({short: 1, page: S.page, l: L, mix: mix(), q: interests().join("|")}, i => { if (SH !== S || S.seen.has(i.id)) return; S.seen.add(i.id); $("#shsk")?.remove(); addShort(i); if (S.cur < 1) { clearTimeout(S.pt); S.pt = setTimeout(prefetchAhead, 300); } }); } catch {}
  if (SH !== S) return; S.page++; S.busy = false; if (S.items.length === n0 && ++S.tries < 5) loadShorts(); else if (!S.items.length) $("#shsk")?.remove();
}
function addShort(i) {
  const d = document.createElement("div"); d.className = "short"; d.dataset.i = SH.items.length;
  const th = `https://i.ytimg.com/vi/${i.id}/hqdefault.jpg`;
  d.innerHTML = `<img class="bgimg" src="${th}"><div class="col"><img class="poster" src="${th}"><div class="bz on"><i class="spin"></i></div><div class="fl"></div><div class="ov"><span class="n">${avatar(i.cid, i.channel, "sm")}${esc(i.channel)}</span><span class="tt">${esc(i.title)}</span></div><div class="rail"><button class="rb lk">${ic("like")}</button><button class="rb mt">${ic(muted ? "mute" : "vol")}</button><button class="rb sh">${ic("share")}</button><button class="rb op">${ic("vid")}</button></div><div class="pb"><i></i></div></div>`;
  i.el = d;
  $(".mt", d).onclick = e => { e.stopPropagation(); muted = !muted; SH.items.forEach(x => x.v && applyShortVol(x)); document.querySelectorAll("#sh .mt").forEach(b => b.innerHTML = ic(muted ? "mute" : "vol")); };
  $(".lk", d).onclick = e => { e.stopPropagation(); e.currentTarget.classList.toggle("on"); };
  $(".sh", d).onclick = e => { e.stopPropagation(); const u = `${location.origin}/watch?v=${i.id}`; if (navigator.share) navigator.share({title: i.title, url: u}).catch(() => {}); else navigator.clipboard?.writeText(u); };
  $(".op", d).onclick = e => { e.stopPropagation(); nav(`/watch?v=${i.id}`, i); };
  $(".col", d).onclick = e => { if (e.target.closest(".rail")) return; const v = i.v; if (!v || !i.ready) return; const f = $(".fl", d); if (v.paused) { v.play(); f.innerHTML = ic("play"); } else { v.pause(); f.innerHTML = ic("pause"); } f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); };
  SH.items.push(i); SH.io.observe(d); $("#sh").append(d);
}
function applyShortVol(i) {
  if (i.dual) { i.v.muted = true; i.a.muted = muted; } else i.v.muted = muted;
}
function playShort(i) {
  i.v.play().catch(() => { muted = true; SH?.items.forEach(x => x.v && applyShortVol(x)); i.v.play().catch(() => {}); });
}
async function mount(i, cur, next) {
  i.want = cur;
  if (!i.v) {
    const v = i.v = document.createElement("video"), a = i.a = new Audio(), bz = $(".bz", i.el);
    i.dual = false; i.ready = false;
    v.disablePictureInPicture = true; v.disableRemotePlayback = true;
    v.setAttribute("controlsList", "nodownload noremoteplayback nofullscreen");
    v.loop = true; a.loop = true; a.preload = "auto"; v.playsInline = true; v.setAttribute("webkit-playsinline", "");
    bindDual(v, a, () => i.dual);
    v.ontimeupdate = () => v.duration && ($(".pb i", i.el).style.width = v.currentTime / v.duration * 100 + "%");
    v.onwaiting = v.onloadstart = v.onseeking = () => bz.classList.add("on");
    v.onplaying = () => { bz.classList.remove("on"); i.el.classList.add("ready"); };
    v.oncanplay = () => { if (!v.paused) bz.classList.remove("on"); };
    $(".col", i.el).prepend(v);
    const plan = await fetch(`/api/plan/${i.id}?h=1080`).then(r => r.json()).catch(() => ({}));
    if (i.v !== v) return;
    i.dual = !!plan.dual;
    if (i.dual) { v.src = `/stream/${i.id}?k=v&h=${plan.h}`; a.src = `/stream/${i.id}?a=1`; } else v.src = `/stream/${i.id}`;
    applyShortVol(i); i.ready = true;
  }
  if (!i.ready) return;
  i.v.preload = cur || next ? "auto" : "metadata";
  if (i.want) playShort(i); else i.v.pause();
}
function unmount(i) {
  if (!i.v) return;
  i.ready = false; i.want = false; i.v.pause(); i.v.removeAttribute("src"); i.v.load(); i.v.remove(); i.v = null;
  if (i.a) { i.a.pause(); i.a.removeAttribute("src"); i.a = null; }
  i.el?.classList.remove("ready"); $(".bz", i.el)?.classList.add("on");
}
function sync() {
  const c = SH.cur;
  SH.items.forEach((i, n) => {
    if (Math.abs(n - c) <= 1) mount(i, n === c, n === c + 1); else unmount(i);
    i.el.classList.toggle("off", n < c - 2);
  });
  prefetchAhead();
  if (SH.items.length - c <= SH_AHEAD) loadShorts();
}
function prefetchAhead() {
  if (!SH) return;
  const c = Math.max(0, SH.cur), ids = SH.items.slice(c, c + SH_AHEAD).map(i => i.id).filter(x => !SH.pf.has(x));
  if (!ids.length) return;
  ids.forEach(x => SH.pf.add(x));
  for (let k = 0; k < ids.length; k += 12) fetch(`/api/prefetch?ids=${ids.slice(k, k + 12).join(",")}&h=1080&s=1`).catch(() => {});
}
const shGo = d => SH?.items[SH.cur + d]?.el.scrollIntoView({behavior: "smooth"});
document.addEventListener("keydown", e => { if (!SH) return; const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0; if (d) { e.preventDefault(); shGo(d); } });
function bindShorts() {
  $("#su").onclick = () => shGo(-1); $("#sd").onclick = () => shGo(1);
  $("#sx").onclick = () => nav("/");
}
