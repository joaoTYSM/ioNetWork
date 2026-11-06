function descBox(i) {
  const d = i.date ? DF.format(new Date(+i.date.slice(0, 4), +i.date.slice(4, 6) - 1, +i.date.slice(6))) : "";
  const tags = [...new Set(i.desc.match(/#[\p{L}\d_]{2,}/gu) || [])].slice(0, 3).map(x => `<a data-q="${esc(x)}">${esc(x)}</a>`).join(" ");
  const ch = (i.chapters || []).length ? `<div class="chs tg"><h4>${t("chapters")}</h4>${i.chapters.map(c => `<button class="chp" data-t="${c.start | 0}"><b>${fmtT(c.start)}</b><span>${esc(c.title)}</span></button>`).join("")}</div>` : "";
  const box = $("#ds"); box.className = "desc"; box.classList.remove("skel");
  box.innerHTML = `<div class="dh"><span>${t("views", NA.format(i.views || 0))}</span><span>${d}</span>${tags}</div><div class="db">${md(i.desc || "")}</div><button class="dm">${t("more")}</button>${ch}`;
  const db = $(".db", box), dm = $(".dm", box);
  if ((i.desc || "").length < 90 && (i.desc || "").split("\n").length < 3 && !ch) dm.hidden = true;
  box.onclick = e => {
    if (e.target.closest("a") || e.target.closest(".chp")) { const c = e.target.closest(".chp"); if (c && W.v) { W.v.currentTime = +c.dataset.t; W.v.play(); scrollTo({top: 0, behavior: "smooth"}); } return; }
    const open = box.classList.toggle("open"); dm.textContent = open ? t("less") : t("more"); dm.hidden = false;
  };
}
function ownerHeart() {
  const cr = W.info?.creators || [];
  if (!cr.length) return `<span class="ht">${ic("heart")}</span>`;
  const imgs = cr.slice(0, 2).map((x, k) => `<img class="oh${cr.length > 1 ? " h" + k : ""}" src="${esc(x.src)}" alt="" onerror="this.remove()">`).join("");
  return `<span class="ob" title="${esc(cr.map(x => x.name).join(" & "))}">${imgs}<i>${ic("heart")}</i></span>`;
}
function setCmCount(n) { const b = $("#cmb"); if (b && n != null) b.textContent = `${t("comments")} · ${NA.format(n)}`; }
function closeCm() { $("#cmt")?.classList.remove("open"); document.body.classList.remove("cm-open"); }
function cmEl(c, reply) {
  const d = document.createElement("div"); d.className = "cm" + (reply ? " rp" : "");
  const reps = c.replies || [];
  d.innerHTML = `${avatar(null, c.author, reply ? "sm" : "l")}<div class="cb"><div class="ch">${c.pinned ? `<span class="pin">${ic("pin")} ${t("pinned")}</span>` : ""}<b class="${c.creator ? "cr" : ""}">${esc(c.author)}</b><small>${rel(c.ts)}</small></div><div class="ct">${md(c.text)}</div><button class="rm" hidden>${t("more")}</button><div class="ca"><button class="lk">${ic("like")}</button><span>${c.likes ? fmtN(c.likes) : ""}</span><button class="flip dl">${ic("like")}</button>${c.heart ? ownerHeart() : ""}<button class="cc">${ic("cp")}</button></div>${reps.length ? `<button class="rt">${ic("down")} ${t("replies", reps.length)}</button><div class="rpl" hidden></div>` : ""}</div>`;
  if (c.thumb) { const av = $(".av", d); av.classList.add("skel"); const im = new Image(); im.onload = () => { av.classList.remove("skel"); av.append(im); }; im.onerror = () => av.classList.remove("skel"); im.src = c.thumb; im.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover"; }
  const ct = $(".ct", d), rm = $(".rm", d);
  requestAnimationFrame(() => { if (ct.scrollHeight > ct.clientHeight + 2) rm.hidden = false; });
  rm.onclick = () => { const o = ct.classList.toggle("open"); rm.textContent = o ? t("less") : t("more"); };
  $(".lk", d).onclick = e => e.currentTarget.classList.toggle("act");
  $(".dl", d).onclick = e => e.currentTarget.classList.toggle("act");
  $(".cc", d).onclick = () => navigator.clipboard?.writeText(c.text);
  const rt = $(".rt", d);
  if (rt) rt.onclick = () => { const box = $(".rpl", d), o = rt.classList.toggle("open"); box.hidden = !o; if (o && !box.children.length) reps.forEach(r => box.append(cmEl(r, true))); };
  return d;
}
function setupComments(id) {
  const C = {sort: "top", n: 20, seen: new Set(), busy: false};
  const cm = $("#cmt");
  cm.innerHTML = `<button class="cmbtn" id="cmb">${t("comments")}</button><div class="cmpanel" id="cmp"><div class="cmsheet"><button class="cmclose" id="cmclose" aria-label="Close">×</button><div class="cmh"><h2 id="cmn"><i class="ln skel" style="width:120px;height:20px;display:inline-block;margin:0"></i></h2><button class="srt" id="srt">${ic("sort")} ${t("top")}</button><div class="srm" id="srm" hidden><button data-s="top">${t("top")}</button><button data-s="new">${t("newest")}</button></div></div><div id="cml"></div><div id="cmx"></div></div></div>`;
  const list = $("#cml"), ext = $("#cmx");
  async function load(reset) {
    if (C.busy || W.id !== id) return; C.busy = true; ext.innerHTML = "";
    if (reset) { list.innerHTML = ""; C.seen.clear(); }
    const sk = Array.from({length: reset ? 5 : 3}, skCm); sk.forEach(s => list.append(s));
    let data = {items: [], count: null};
    try { data = await (await fetch(`/api/comments/${id}?sort=${C.sort}&n=${C.n}`)).json(); } catch {}
    sk.forEach(s => s.remove()); C.busy = false; if (W.id !== id) return;
    const fresh = data.items.filter(c => !C.seen.has(c.id));
    fresh.forEach(c => { C.seen.add(c.id); list.append(cmEl(c)); });
    $("#cmn").textContent = `${t("comments")}${data.count != null ? " · " + NA.format(data.count) : ""}`;
    if (!C.seen.size) list.innerHTML = `<p style="color:var(--mu)">${t("noComments")}</p>`;
    else if (fresh.length && C.n < 100) { ext.innerHTML = `<button class="more">${t("showMoreComments")}</button>`; $(".more", ext).onclick = () => { C.n += 20; load(false); }; }
  }
  $("#srt").onclick = e => { e.stopPropagation(); $("#srm").hidden = !$("#srm").hidden; };
  $("#srm").onclick = e => { const b = e.target.closest("button"); if (!b) return; C.sort = b.dataset.s; C.n = 20; $("#srt").innerHTML = `${ic("sort")} ${t(C.sort)}`; $("#srm").hidden = true; load(true); };
  $("#cmb").onclick = () => { cm.classList.add("open"); document.body.classList.add("cm-open"); if (!C.started) { C.started = true; load(true); } };
  $("#cmclose").onclick = closeCm; $("#cmp").onclick = e => { if (e.target.id === "cmp") closeCm(); };
}
document.addEventListener("click", e => { const m = $("#srm"); if (m && !m.hidden && !e.target.closest("#srm")) m.hidden = true; });
