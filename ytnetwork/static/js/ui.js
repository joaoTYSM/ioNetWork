const avatar = (cid, name, cls = "") => {
  const n = esc((name || "?").trim()[0] || "?");
  return cid ? `<span class="av skel ${cls}" data-n="${n}" data-cid="${cid}"><img loading="lazy" src="/avatar/${cid}" onload="this.parentNode.classList.remove('skel')" onerror="this.parentNode.classList.remove('skel');this.remove()"></span>` : `<span class="av ${cls}" data-n="${n}"></span>`;
};
const thumbImg = (src, cls = "") => `<img class="${cls}" loading="lazy" src="${src}" style="opacity:0" onload="this.style.opacity=1">`;
const mk = (h, c) => { const d = document.createElement("div"); d.className = c; d.innerHTML = h; return d; };
const skCard = () => mk(`<div class="th skel"></div><div class="meta"><span class="av skel"></span><div class="mx"><i class="ln skel"></i><i class="ln s skel"></i></div></div>`, "card");
const skRow = () => mk(`<div class="th skel"></div><div class="mx"><i class="ln m skel"></i><i class="ln s skel"></i><i class="ln xs skel"></i></div>`, "rrow");
const skRc = () => mk(`<div class="th skel"></div><div class="mx"><i class="ln skel"></i><i class="ln s skel"></i></div>`, "rc");
const skCm = () => mk(`<span class="av l skel"></span><div class="cb"><i class="ln xs skel"></i><i class="ln skel"></i><i class="ln m skel"></i></div>`, "cm");
const link = (i, extra) => { prefetchHead(i.id); const a = document.createElement("a"); a.href = `/watch?v=${i.id}`; a.onclick = e => { if (e.ctrlKey || e.metaKey) return; e.preventDefault(); nav(a.getAttribute("href"), i); }; return a; };
function card(i) {
  const a = link(i); a.className = "card";
  a.innerHTML = `<div class="th skel">${thumbImg(i.thumb)}<span class="dur">${fmtT(i.dur)}</span></div><div class="meta">${avatar(i.cid, i.channel)}<div class="mx"><h3>${esc(i.title)}</h3><p>${esc(i.channel)}${i.views != null ? "<br>" + t("views", fmtN(i.views)) : ""}</p></div></div>`;
  $(".th img", a).addEventListener("load", e => e.target.parentNode.classList.remove("skel"));
  return a;
}
function row(i) {
  const a = link(i); a.className = "rrow";
  a.innerHTML = `<div class="th skel">${thumbImg(i.thumb)}<span class="dur">${fmtT(i.dur)}</span></div><div class="mx rb2"><h3>${esc(i.title)}</h3><p>${i.views != null ? t("views", fmtN(i.views)) : ""}</p><div class="rch">${avatar(i.cid, i.channel, "sm")}<span>${esc(i.channel)}</span></div></div>`;
  $(".th img", a).addEventListener("load", e => e.target.parentNode.classList.remove("skel"));
  return a;
}
function rc(i, cur) {
  const a = link(i); a.className = "rc" + (cur ? " cur" : "");
  a.innerHTML = `<div class="th skel">${thumbImg(i.thumb)}<span class="dur">${fmtT(i.dur)}</span></div><div class="mx"><h4>${esc(i.title)}</h4><p>${esc(i.channel)}<br>${i.views != null ? t("views", fmtN(i.views)) : ""}</p></div>`;
  $(".th img", a).addEventListener("load", e => e.target.parentNode.classList.remove("skel"));
  return a;
}
function makeFeed(list, more, sk, build, params, n0 = 8) {
  const S = {page: 1, busy: false, seen: new Set(), ac: null, dead: false};
  const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { io.unobserve(more); load(); } }, {rootMargin: "900px"});
  async function load() {
    if (S.busy || S.dead) return; S.busy = true; const ac = S.ac = new AbortController();
    const sks = Array.from({length: n0}, () => { const d = sk(); list.append(d); return d; }); let n = 0;
    try { await feed(params(S.page), i => { if (S.dead || S.seen.has(i.id)) return; S.seen.add(i.id); n++; const s = sks.shift(), c = build(i); s ? s.replaceWith(c) : list.append(c); S.on?.(i); }, ac.signal); } catch {}
    sks.forEach(s => s.remove());
    if (S.dead) return; S.page++; S.busy = false;
    if (!n && S.page < 5) load(); else io.observe(more);
  }
  S.load = load;
  S.stop = () => { S.dead = true; S.ac?.abort(); io.disconnect(); };
  S.prefill = items => { items.forEach(i => { S.seen.add(i.id); list.append(build(i)); }); S.page = 2; io.observe(more); };
  return S;
}
function md(s0) {
  let s = esc(s0);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="x" href="$2">$1</a>');
  s = s.replace(/(^|[\s>(])(https?:\/\/[^\s<)]+)/g, '$1<a class="x" href="$2">$2</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/(^|\s)#([\p{L}\d_]{2,})/gu, '$1<a data-q="#$2">#$2</a>');
  s = s.replace(/(^|[\s(])((?:\d{1,2}:)?\d{1,2}:\d{2})(?=[\s).,]|$)/g, (m, a, ts) => `${a}<a data-t="${ts.split(":").reduce((x, y) => x * 60 + +y, 0)}">${ts}</a>`);
  return s;
}
document.addEventListener("click", e => {
  const a = e.target.closest("a"); if (!a) return;
  if (a.classList.contains("x")) { e.preventDefault(); e.stopPropagation(); window.open(a.href, "_blank", "popup,width=1000,height=700,noopener"); }
  else if (a.dataset.q) { e.preventDefault(); e.stopPropagation(); nav(`/results?search_query=${encodeURIComponent(a.dataset.q)}`); }
  else if (a.dataset.t && W.v) { e.preventDefault(); e.stopPropagation(); W.v.currentTime = +a.dataset.t; W.v.play(); scrollTo({top: 0, behavior: "smooth"}); }
}, true);
document.addEventListener("click", e => { const x = e.target.closest("[data-cid]"); if (x && x.dataset.cid) { e.preventDefault(); e.stopPropagation(); nav(`/channel?c=${x.dataset.cid}`); } }, true);
