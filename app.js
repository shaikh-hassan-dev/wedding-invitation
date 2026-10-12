
/* =========================================================
   SETTINGS — edit these values
   ========================================================= */
const CONFIG = {
  // Nikah start time. Set to 8:00 PM IST ("after Maghrib") — change as needed.
  eventStart: "2026-11-21T20:00:00+05:30",
  durationHours: 4,                       // used only for the calendar entry's end time
  calendarTitle: "Nikah — Yasmeen Shaikh & Mehmood Shaikh",
  calendarNote: "Insha Allah Nikah after Namaz Maghrib. Dinner and reception after the Nikah.",
  venue: "Aasha Samaj Kalyan Hall, near Baiganwadi Signal, Govandi (W), Mumbai 400043",
  genericGreeting: "Dear Family & Friends",            // when no ?guest= is in the link
  // Personal links: ?guest=Name  [&family=yes]  [&guests=N]   (use + for spaces, e.g. ?guest=Mohd+Rahil&family=yes&guests=4)
  guestGreeting: (name, withFamily) => withFamily ? `Dear ${name} and family` : `Dear ${name}`,
  guestCountText: n => `This invitation is for ${n} ${n === 1 ? "guest" : "guests"}`,
  afterEventMessage: "Alhamdulillah, the Nikah has been solemnised.",
  shareText: "You are invited to the Nikah of Yasmeen & Mehmood — Saturday, 21st November 2026."
};

document.documentElement.classList.replace("no-js", "js");
const $ = id => document.getElementById(id);
const eventDate = new Date(CONFIG.eventStart);

/* ---------- Personal greeting from ?guest=Name&family=yes&guests=N ---------- */
const params = new URLSearchParams(location.search);
const guest = (params.get("guest") || "").trim().slice(0, 60);
const withFamily = /^(1|yes|true)$/i.test(params.get("family") || "");
const guestCount = Number(params.get("guests"));
const greeting = guest ? CONFIG.guestGreeting(guest, withFamily) : CONFIG.genericGreeting;
document.querySelectorAll("[data-greeting]").forEach(el => el.textContent = greeting); // textContent = safe from HTML injection
if (Number.isInteger(guestCount) && guestCount >= 1 && guestCount <= 99) {
  document.querySelectorAll("[data-guest-count]").forEach(el => { el.textContent = CONFIG.guestCountText(guestCount); el.hidden = false; });
}

/* ---------- Music ---------- */
const audio = $("bgm"), musicBtn = $("musicBtn");
function setMusic(on){
  musicBtn.classList.toggle("on", on);
  musicBtn.setAttribute("aria-pressed", on);
  musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
}
function playMusic(){
  audio.play().then(() => setMusic(true)).catch(() => setMusic(false)); // blocked or missing: page carries on
}
audio.addEventListener("error", () => { musicBtn.hidden = true; });  // file missing → hide the button
musicBtn.onclick = () => audio.paused ? playMusic() : (audio.pause(), setMusic(false));

/* ---------- Opening overlay ---------- */
const scene = $("scene");
$("openBtn").onclick = () => {
  $("gate").classList.add("open");
  playMusic();
  setTimeout(() => scene.classList.add("play"), 1200); // start the couple scene as the curtains part
};

/* Replay: re-render the SVG so its animations start from the beginning */
$("replay").onclick = () => {
  const svg = scene.querySelector("svg");
  svg.replaceWith(svg.cloneNode(true));
  const couple = $("couple");
  couple.replaceWith(couple.cloneNode(true));
};

/* ---------- Falling petals ---------- */
const petals = $("petals");
for (let i = 0; i < 14; i++) {
  const p = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  p.setAttribute("cx", Math.random() * 380);
  p.setAttribute("cy", 0);
  p.setAttribute("rx", 3); p.setAttribute("ry", 5);
  p.setAttribute("class", "petal");
  p.setAttribute("opacity", .5 + Math.random() * .5);
  p.style.animationDuration = 7 + Math.random() * 6 + "s";
  p.style.animationDelay = 5 + Math.random() * 8 + "s"; // begin after the couple meets
  petals.appendChild(p);
}

/* ---------- Countdown ---------- */
const units = {}; document.querySelectorAll("[data-u]").forEach(el => units[el.dataset.u] = el);
const pad = n => String(n).padStart(2, "0");
function tick(){
  const ms = eventDate - Date.now();
  if (ms <= 0) {
    $("timer").hidden = true;
    const msg = $("afterMsg"); msg.textContent = CONFIG.afterEventMessage; msg.hidden = false;
    return clearInterval(timer);
  }
  const s = Math.floor(ms / 1000);
  units.d.textContent = Math.floor(s / 86400);
  units.h.textContent = pad(Math.floor(s / 3600) % 24);
  units.m.textContent = pad(Math.floor(s / 60) % 60);
  units.s.textContent = pad(s % 60);
}
const timer = setInterval(tick, 1000); tick();

/* ---------- Google Maps ---------- */
$("mapBtn").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.venue);

/* ---------- Add to calendar (.ics download) ---------- */
$("icsBtn").onclick = () => {
  const fmt = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // 20261121T123000Z
  const esc = t => t.replace(/[\\,;]/g, m => "\\" + m);
  const end = new Date(eventDate.getTime() + CONFIG.durationHours * 3600e3);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nikah Invitation//EN", "BEGIN:VEVENT",
    "UID:nikah-yasmeen-mehmood-20261121@invite",
    "DTSTAMP:" + fmt(new Date()),
    "DTSTART:" + fmt(eventDate),
    "DTEND:" + fmt(end),
    "SUMMARY:" + esc(CONFIG.calendarTitle),
    "LOCATION:" + esc(CONFIG.venue),
    "DESCRIPTION:" + esc(CONFIG.calendarNote),
    "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  a.download = "Nikah-Yasmeen-Mehmood.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* ---------- Share (Web Share API, copy-link fallback) ---------- */
function toast(msg){ const t = $("toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); }
$("shareBtn").onclick = async () => {
  const url = location.href;
  if (navigator.share) {
    try { return await navigator.share({ title: document.title, text: CONFIG.shareText, url }); }
    catch (e) { if (e.name === "AbortError") return; } // user cancelled
  }
  try { await navigator.clipboard.writeText(url); }
  catch { // older browsers / non-HTTPS
    const ta = Object.assign(document.createElement("textarea"), { value: url });
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast("Link copied");
};

/* ---------- Theme preview (remove once a theme is chosen) ----------
   Each theme maps the original maroon/rose-gold colours to new ones; greenery and lavender stay as they are. */
const THEMES = [
  ["Maroon & Rose Gold", {}],
  ["Emerald & Gold", {
    "#2b0610":"#021f1c","#3d0a17":"#04302b","#4a0d1c":"#0a3d36","#5a1226":"#0d4a42","#6b1428":"#0f5a4f","#7a2a3a":"#136b5e","#7a1a30":"#0c5446","rgba(43,6,16":"rgba(2,31,28",
    "#e7b7a3":"#e8c872","#c48a7a":"#b8913a","#f4cdb9":"#f3dc9a","#b9786a":"#9a7428","rgba(231,183,163":"rgba(232,200,114",
    "#f8e6dc":"#f3e9d2","#fff7f1":"#fffaf0","rgba(255,247,241":"rgba(255,250,240","#fff3ea":"#fff6dc",
    "#fff1e8":"#fff8e6","#f3cfc0":"#f0dfae","#d9a3a0":"#cdb072","#ffd9b8":"#ffe3a3","#ffcfa8":"#ffd97a"}],
  ["Royal Navy & Gold", {
    "#2b0610":"#0a1230","#3d0a17":"#101b45","#4a0d1c":"#16235a","#5a1226":"#1c2c6b","#6b1428":"#24387f","#7a2a3a":"#2e4590","#7a1a30":"#283e88","rgba(43,6,16":"rgba(10,18,48",
    "#e7b7a3":"#e6c77a","#c48a7a":"#b8954a","#f4cdb9":"#f2dca0","#b9786a":"#94743a","rgba(231,183,163":"rgba(230,199,122",
    "#f8e6dc":"#eef0f8","#fff7f1":"#fbfbff","rgba(255,247,241":"rgba(251,251,255","#fff3ea":"#fffbe8",
    "#fff1e8":"#fbf6e9","#f3cfc0":"#e9dcc0","#d9a3a0":"#c9b48a","#ffd9b8":"#ffe6a8","#ffcfa8":"#ffd884"}],
  ["Plum & Silver", {
    "#2b0610":"#1e0b26","#3d0a17":"#2c1238","#4a0d1c":"#3a1a4a","#5a1226":"#46205a","#6b1428":"#55286c","#7a2a3a":"#63327a","#7a1a30":"#5c2d73","rgba(43,6,16":"rgba(30,11,38",
    "#e7b7a3":"#d9cbe6","#c48a7a":"#a58fbf","#f4cdb9":"#e8dcf2","#b9786a":"#8a74a6","rgba(231,183,163":"rgba(217,203,230",
    "#f8e6dc":"#f1eaf6","#fff7f1":"#fdfaff","rgba(255,247,241":"rgba(253,250,255","#fff3ea":"#fff8ff",
    "#fff1e8":"#fbf5fd","#f3cfc0":"#e6d6ef","#d9a3a0":"#c4abd6","#ffd9b8":"#ffe9c4","#ffcfa8":"#ffdcae"}],
];
let themeIdx = 2; // the page ships in Royal Navy & Gold (colours baked into the file)
// Swap every colour from the current theme to the next: current → base → new.
const recolor = (str, from, to) => str.replace(/#[0-9a-f]{6}|rgba\(\d+,\d+,\d+/gi, c => {
  c = c.toLowerCase();
  const base = Object.keys(from).find(k => from[k] === c) || c;
  return to[base] || base;
});
$("themeBtn").onclick = () => {
  const from = THEMES[themeIdx][1];
  themeIdx = (themeIdx + 1) % THEMES.length;
  const [name, to] = THEMES[themeIdx];
  const style = document.querySelector("style");
  style.textContent = recolor(style.textContent, from, to);
  document.querySelectorAll("[fill],[stroke],[stop-color],[color],[style],meta[name=theme-color]").forEach(el => {
    for (const a of ["fill", "stroke", "stop-color", "color", "style", "content"]) {
      const v = el.getAttribute(a);
      if (v) el.setAttribute(a, recolor(v, from, to));
    }
  });
  $("themeName").textContent = name;
  toast(name);
};

/* ---------- Gentle reveal on scroll ---------- */
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
