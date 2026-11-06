const CHIPS = ["all", "music", "gaming", "news", "sports", "movies", "comedy"];
let HF = null, RF2 = null, chip = 0;
const homeKey = () => "yn_home_" + L;
function startHome(c) {
  HF?.stop(); chip = c; $("#q").value = ""; $("#grid").innerHTML = "";
  $("#chips").innerHTML = CHIPS.map((k, i) => `<button class="chip ${i === c ? "on" : ""}" data-c="${i}">${t(k)}</button>`).join("");
  const params = page => ({q: chip ? t(CHIPS[chip]) : interests().join("|"), l: L, mix: chip ? 0 : mix(), x: chip ? 1 : 0, hs: searches().join("|"), page});
  HF = makeFeed($("#grid"), $("#more"), skCard, card, params);
  const cached = chip === 0 ? store(homeKey(), null) : null, keep = [];
  if (cached && cached.length) {
    HF.prefill(cached);
    const buf = []; feed(params(1), i => buf.push(i)).then(() => buf.length && save(homeKey(), buf.slice(0, 24))).catch(() => {});
  } else {
    HF.on = i => { if (chip === 0 && keep.length < 24) { keep.push(i); if (keep.length === 24 || keep.length % 6 === 0) save(homeKey(), keep); } };
    HF.load();
  }
}
function bindHome() {
  $("#chips").onclick = e => { const b = e.target.closest(".chip"); if (b) startHome(+b.dataset.c); };
}
