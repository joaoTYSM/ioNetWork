const views = ["home", "results", "watch", "shorts", "channel"];
function show(v) { views.forEach(x => $("#" + x).hidden = x !== v); document.body.className = document.body.className.replace(/\bv-\w+/g, "").trim() + " v-" + v + (document.body.classList.contains("popup") ? " popup" : ""); renderSide(v); }
let hint = null, trail = [];
function nav(url, item) { hint = item || null; history.pushState(null, "", url); route(); }
window.addEventListener("popstate", route);
function route() {
  stopWatch(); stopShorts(); stopChannel(); HF?.stop(); RF2?.stop(); closeSide();
  const p = new URLSearchParams(location.search), pn = location.pathname;
  const pop = p.get("popup") === "1";
  if (pn !== "/watch") trail = [];
  if (pn === "/watch" && p.get("v")) { document.body.classList.toggle("popup", pop); return openWatch(p.get("v"), hint); }
  document.body.classList.remove("popup");
  if (pn === "/shorts") return openShorts();
  if (pn === "/channel" && p.get("c")) return openChannel(p.get("c"));
  if (pn === "/results") return openResults(p.get("search_query") || "");
  show("home"); startHome(0);
}
