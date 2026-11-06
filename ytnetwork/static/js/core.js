const $ = (s, e = document) => e.querySelector(s);
const detect = () => { for (const l of navigator.languages || [navigator.language]) { const c = String(l || "").slice(0, 2).toLowerCase(); if (STR[c]) return c; } return "en"; };
const L = detect();
const CUR = {...parse(STR.en), ...parse(STR[L])};
const t = (k, n) => (CUR[k] || k).replace("{n}", n == null ? "" : n);
document.documentElement.lang = L;
if (L === "ar") document.documentElement.dir = "rtl";
const NF = new Intl.NumberFormat(L, {notation: "compact"}), NA = new Intl.NumberFormat(L);
const DF = new Intl.DateTimeFormat(L, {dateStyle: "medium"}), RF = new Intl.RelativeTimeFormat(L, {numeric: "auto"});
const fmtN = n => n == null ? "" : NF.format(n);
const rel = ts => { if (!ts) return ""; const s = ts - Date.now() / 1000; for (const [n, v] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]) if (Math.abs(s) >= v) return RF.format(Math.round(s / v), n); return RF.format(0, "second"); };
const fmtT = s => { s = Math.max(0, s | 0); const h = s / 3600 | 0, m = (s % 3600) / 60 | 0, x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const store = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const I = {
  play: "M8 5v14l11-7z", pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z", prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
  vol: "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  mute: "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z",
  fs: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
  fsx: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z",
  set: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  pip: "M19 7h-8v6h8V7zm2-4H3a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H3V5h18v14z",
  pop: "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7z",
  hp: "M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h3v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h3a2 2 0 0 0 2-2v-7a9 9 0 0 0-9-9z",
  vid: "M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z",
  music: "M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z",
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  shorts: "M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm3 7v6l5-3-5-3z",
  dl: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  cp: "M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z",
  like: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z",
  down: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  right: "M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  check: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  sort: "M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  pin: "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z",
  ok: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"};
const ic = n => `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="${I[n]}"/></svg>`;
const hist = store("yn_hist", {langs: {}, ch: [], t: []});
let subs = store("yn_subs", {});
function remember(i) {
  if (i.lang) hist.langs[i.lang] = (hist.langs[i.lang] || 0) + 1;
  if (i.channel) hist.ch = [i.channel, ...hist.ch.filter(x => x !== i.channel)].slice(0, 6);
  if (i.title) hist.t = [i.title.split(/[|\-–(]/)[0].trim().slice(0, 40), ...hist.t].slice(0, 6);
  save("yn_hist", hist);
}
function mix() {
  const tot = Object.values(hist.langs).reduce((a, b) => a + b, 0);
  if (tot < 5) return 0;
  return Math.min(.4, (tot - (hist.langs[L] || 0)) / tot);
}
const interests = () => [...Object.keys(subs).slice(0, 2), ...hist.ch.slice(0, 1), ...hist.t.slice(0, 1)].filter(Boolean);
let W = {};
const COARSE = matchMedia("(pointer:coarse)").matches;
const T = (k, d) => CUR[k] && CUR[k] !== k ? CUR[k] : d;

const searches = () => store("yn_searches", []);
function bindDual(v, a, isDual) {
  const on = (ev, f) => v.addEventListener(ev, () => isDual() && f());
  on("play", () => a.play().catch(() => {}));
  on("pause", () => a.pause());
  on("waiting", () => a.pause());
  on("seeking", () => { a.currentTime = v.currentTime; });
  on("ratechange", () => { a.playbackRate = v.playbackRate; });
  on("playing", () => { if (Math.abs(a.currentTime - v.currentTime) > .2) a.currentTime = v.currentTime; a.play().catch(() => {}); });
  on("timeupdate", () => { if (Math.abs(a.currentTime - v.currentTime) > .35) a.currentTime = v.currentTime; else if (!v.paused && a.paused && a.readyState > 2) a.play().catch(() => {}); });
}
function hydrate(root) {
  root.querySelectorAll("[data-ic]").forEach(e => { e.innerHTML = ic(e.dataset.ic); });
  root.querySelectorAll("[data-t]").forEach(e => { e.textContent = t(e.dataset.t); });
  root.querySelectorAll("[data-title]").forEach(e => { e.title = t(e.dataset.title); });
}
