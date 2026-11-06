function closeSide() { $("#side").classList.remove("open"); $("#scrim").classList.remove("on"); }
const searchNav = q => { save("yn_searches", [q, ...searches().filter(x => x !== q)].slice(0, 12)); nav(`/results?search_query=${encodeURIComponent(q)}`); };
function renderSide(v) {
  const items = [["home", "home", () => nav("/")], ["shorts", "shorts", () => nav("/shorts")], ["music", "music", () => searchNav(t("music"))]];
  const on = v === "home" ? "home" : v === "shorts" ? "shorts" : "";
  const sb = Object.entries(subs);
  $("#side").innerHTML = items.map(([k, i]) => `<button class="si ${on === k ? "on" : ""}" data-k="${k}">${ic(i)}<span>${t(k)}</span></button>`).join("") + (sb.length ? `<div class="sh3">${t("subscriptions")}</div>` + sb.map(([n, cid]) => `<button class="si" data-ch="${esc(n)}">${avatar(cid === 1 ? null : cid, n, "sm")}<span>${esc(n)}</span></button>`).join("") : "");
  $("#bnav").innerHTML = items.map(([k, i]) => `<button class="${on === k ? "on" : ""}" data-k="${k}">${ic(i)}<span>${t(k)}</span></button>`).join("");
}
const sideClick = e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.k) items0[b.dataset.k](); else if (b.dataset.ch) { const c = subs[b.dataset.ch]; if (c && c !== 1) nav(`/channel?c=${c}`); else searchNav(b.dataset.ch); } closeSide(); };
const items0 = {home: () => nav("/"), shorts: () => nav("/shorts"), music: () => searchNav(t("music"))};
function bindChrome() {
  $("#side").onclick = sideClick; $("#bnav").onclick = sideClick;
  $("#scrim").onclick = closeSide;
  $("#menu").onclick = () => {
    const wide = innerWidth >= 1100 && /v-(home|results)/.test(document.body.className);
    if (wide) document.body.classList.toggle("side-off");
    else { const o = $("#side").classList.toggle("open"); $("#scrim").classList.toggle("on", o); }
  };
  $("#q").placeholder = t("search"); $("#sb").setAttribute("aria-label", t("search"));
  $("#sf").onsubmit = e => { e.preventDefault(); const q = $("#q").value.trim(); if (q) { $("#q").blur(); searchNav(q); } };
  $("#logo").onclick = e => { e.preventDefault(); nav("/"); };
}
