let CHN = null;
function stopChannel() { if (CHN) { CHN.dead = true; CHN.io?.disconnect(); CHN = null; } $("#channel").innerHTML = ""; }
function openChannel(cid) {
  show("channel"); scrollTo(0, 0); const S = CHN = {dead: false}, el = $("#channel");
  let tab = "videos", page = 1, busy = false, done = false, seen = new Set(), name = "";
  const tabs = [["videos", T("videos", "Videos")], ["shorts", t("shorts")], ["posts", T("posts", "Posts")]];
  el.innerHTML = VIEWS.channel.replace("{{avatar}}", avatar(cid, "", "xl")).replace("{{tabs}}", tabs.map(([k, n]) => `<button data-k="${k}" class="${k === tab ? "on" : ""}">${esc(n)}</button>`).join(""));
  const L2 = $("#chl"), more = $("#chm");
  const postEl = i => mk(`<p>${esc(i.text)}</p>${i.img ? `<img loading="lazy" src="${esc(i.img)}">` : ""}<small>${esc(i.time || "")}${i.likes ? " · " + esc(i.likes) : ""}</small>`, "post");
  async function load() {
    if (busy || done || S.dead) return; busy = true; const my = tab;
    const sks = my === "posts" ? Array.from({length: 3}, () => mk(`<i class="ln skel"></i><i class="ln m skel"></i><i class="ln s skel"></i>`, "post")) : Array.from({length: 8}, skCard);
    sks.forEach(x => L2.append(x)); let d = {items: []};
    try { d = await (await fetch(`/api/channel/${cid}?tab=${my}&page=${page}`)).json(); } catch {}
    if (S.dead || my !== tab) return; sks.forEach(x => x.remove());
    if (d.name && !name) { name = d.name; $("#chn1").textContent = name; const b = $("#chsub"); b.hidden = false; const sync = () => b.textContent = subs[name] ? t("subscribed") : t("subscribe"); sync(); b.onclick = () => { if (subs[name]) delete subs[name]; else subs[name] = cid; save("yn_subs", subs); sync(); renderSide("channel"); }; }
    if (d.subs != null) $("#chs").textContent = t("subscribers", fmtN(d.subs));
    else if (name) $("#chs").textContent = "";
    if (page === 1 && !d.items.length) L2.append(mk(esc(T("empty", "Nothing here yet")), "emp"));
    d.items.forEach(i => { const k = i.id || i.text; if (seen.has(k)) return; seen.add(k); L2.append(my === "posts" ? postEl(i) : card(i)); });
    page++; busy = false; if (my === "posts" || d.items.length < 12) done = true; else { S.io.unobserve(more); S.io.observe(more); }
  }
  S.io = new IntersectionObserver(e => { if (e[0].isIntersecting) load(); }, {rootMargin: "900px"}); S.io.observe(more);
  $("#chtabs").onclick = e => { const b = e.target.closest("button"); if (!b || b.dataset.k === tab) return; tab = b.dataset.k; page = 1; busy = false; done = false; seen = new Set(); L2.innerHTML = ""; L2.className = tab === "posts" ? "posts" : "grid"; [...$("#chtabs").children].forEach(x => x.classList.toggle("on", x === b)); load(); };
  load();
}
