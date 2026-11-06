const introStart = performance.now();
let introDone = false;
function endIntro() {
  const el = $("#intro");
  if (!el || introDone) return;
  introDone = true;
  const wait = Math.max(0, 2300 - (performance.now() - introStart));
  const out = () => { el.classList.add("out"); setTimeout(() => el.remove(), 700); };
  const timer = setTimeout(out, wait);
  el.addEventListener("click", () => { clearTimeout(timer); out(); });
}
