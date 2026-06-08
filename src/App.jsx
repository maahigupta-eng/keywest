import { useState, useEffect, useCallback } from "react";
import { pool_exterior } from "./photos.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const COLORS = [
  { id:"teal",    hex:"#2E9B7F", label:"Teal"       },
  { id:"sunset",  hex:"#E8894A", label:"Sunset"     },
  { id:"blue",    hex:"#5BA4CF", label:"Blue"       },
  { id:"terra",   hex:"#C17B5C", label:"Terracotta" },
  { id:"green",   hex:"#6BB89A", label:"Green"      },
  { id:"golden",  hex:"#D4A843", label:"Golden"     },
  { id:"orchid",  hex:"#9B7BA8", label:"Orchid"     },
  { id:"coral",   hex:"#E06B6B", label:"Coral"      },
  { id:"navy",    hex:"#4A6FA5", label:"Navy"       },
  { id:"sage",    hex:"#7A9E7E", label:"Sage"       },
  { id:"rose",    hex:"#C2788A", label:"Rose"       },
];

const DEFAULT_COLOR = "#2E9B7F";

// ── API ───────────────────────────────────────────────────────────────────────
const api = async (path, opts = {}) => {
  const res = await fetch(`/api/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── DATE HELPERS ──────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const ds = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseDate = (s) => new Date(s + "T12:00:00");
const fmt = (s) => parseDate(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtLong = (s) => parseDate(s).toLocaleDateString("en-US", { month: "long", day: "numeric" });
const today = () => { const n = new Date(); return ds(n.getFullYear(), n.getMonth(), n.getDate()); };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return ds(d.getFullYear(), d.getMonth(), d.getDate()); };

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');

  :root {
    --ink: #0E1A16;
    --teal: #1A6B5A;
    --teal-mid: #2E9B7F;
    --teal-light: #5BBFA3;
    --sand: #F5EFE3;
    --sand-mid: #E8DCC8;
    --sand-dark: #C8B898;
    --sunset: #E8894A;
    --white: #FDFAF6;
    --mid: #5A7068;
    --light: #96B0A8;
    --seafoam-pale: #EEF8F5;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Jost', sans-serif; background: var(--sand); color: var(--ink); min-height: 100vh; }

  /* ── PASSKEY SCREEN ── */
  .gate {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .gate-bg {
    position: absolute; inset: 0;
    background-size: cover;
    background-position: center;
    animation: gzoom 20s ease-in-out infinite alternate;
  }
  @keyframes gzoom { from { transform: scale(1); } to { transform: scale(1.06); } }
  .gate-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(170deg, rgba(14,26,22,0.3) 0%, rgba(14,26,22,0.6) 60%, rgba(14,26,22,0.85) 100%);
  }
  .gate-card {
    position: relative; z-index: 2;
    text-align: center;
    padding: 56px 52px 48px;
    max-width: 420px; width: 92%;
    background: rgba(14,26,22,0.45);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    backdrop-filter: blur(20px);
    animation: riseIn 1s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  @keyframes riseIn { from { opacity:0; transform: translateY(28px); } to { opacity:1; transform: translateY(0); } }
  .gate-palm { font-size: 40px; margin-bottom: 16px; animation: palmFloat 4s ease-in-out infinite; }
  @keyframes palmFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  .gate-title { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 300; color: var(--white); line-height: 0.95; letter-spacing: -1px; margin-bottom: 6px; }
  .gate-title em { font-style: italic; }
  .gate-sub { font-size: 13px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 36px; }
  .gate-label { font-size: 10px; font-weight: 300; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; display: block; text-align: left; }
  .gate-input {
    width: 100%; padding: 14px 20px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 12px; font-size: 20px;
    color: var(--white); letter-spacing: 5px;
    text-align: center; outline: none;
    transition: border-color 0.2s;
    font-family: 'Jost', sans-serif;
  }
  .gate-input::placeholder { letter-spacing: 2px; color: rgba(255,255,255,0.2); font-size: 13px; }
  .gate-input:focus { border-color: rgba(91,191,163,0.6); }
  .gate-btn {
    width: 100%; margin-top: 12px; padding: 14px;
    background: linear-gradient(135deg, var(--teal-mid), var(--teal-light));
    color: var(--white); border: none; border-radius: 12px;
    font-size: 11px; font-weight: 400; letter-spacing: 2.5px; text-transform: uppercase;
    cursor: pointer; font-family: 'Jost', sans-serif;
    transition: all 0.2s; box-shadow: 0 6px 24px rgba(46,155,127,0.35);
  }
  .gate-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(46,155,127,0.45); }
  .gate-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .gate-error { margin-top: 10px; font-size: 13px; color: #ffb3b3; font-weight: 300; }

  /* ── APP SHELL ── */
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .app-header {
    background: var(--ink); height: 58px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; position: sticky; top: 0; z-index: 100;
  }
  .app-brand { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: var(--white); display: flex; align-items: baseline; gap: 10px; }
  .app-badge { font-size: 9px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: var(--teal-light); padding: 3px 8px; border: 1px solid rgba(91,191,163,0.3); border-radius: 20px; }
  .app-header-right { display: flex; align-items: center; gap: 10px; }
  .btn-exit { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 8px; font-size: 11px; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s; letter-spacing: 1px; }
  .btn-exit:hover { background: rgba(255,255,255,0.14); color: white; }

  .app-nav { background: var(--ink); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 0 32px; display: flex; }
  .nav-tab { padding: 12px 18px; font-size: 11px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.4); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; border-bottom: 2px solid transparent; font-family: 'Jost', sans-serif; }
  .nav-tab.active { color: var(--teal-light); border-bottom-color: var(--teal-light); }
  .nav-tab:hover:not(.active) { color: rgba(255,255,255,0.7); }

  /* ── CALENDAR PAGE ── */
  .cal-page { display: grid; grid-template-columns: 1fr 300px; flex: 1; min-height: 0; }
  .cal-main { padding: 28px 32px; overflow-y: auto; }
  .cal-sidebar { background: var(--white); border-left: 1px solid var(--sand-mid); padding: 24px 20px; overflow-y: auto; }

  /* Calendar header */
  .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .cal-nav { display: flex; align-items: center; gap: 14px; }
  .cal-month-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 400; color: var(--teal); }
  .btn-nav { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--sand-dark); background: var(--white); color: var(--teal); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .btn-nav:hover { background: var(--teal); color: white; border-color: var(--teal); }
  .btn-add-stay { padding: 9px 20px; background: var(--sunset); color: white; border: none; border-radius: 10px; font-size: 11px; font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.2s; }
  .btn-add-stay:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(232,137,74,0.35); }

  /* Day labels */
  .cal-day-labels { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 3px; }
  .day-label { text-align: center; font-size: 10px; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; color: var(--light); padding: 6px 0; }

  /* Calendar grid */
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-cell {
    min-height: 100px;
    background: var(--white);
    border-radius: 8px;
    padding: 8px 6px 6px;
    display: flex;
    flex-direction: column;
    border: 1.5px solid transparent;
    position: relative;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .cal-cell.other-month { background: rgba(253,250,246,0.4); opacity: 0.45; }
  .cal-cell.is-today { border-color: var(--teal-mid); }
  .cal-cell.is-empty::after { content: '🌴'; position: absolute; bottom: 4px; right: 5px; font-size: 16px; opacity: 0.07; pointer-events: none; }
  .cell-date { font-size: 12px; font-weight: 400; color: var(--mid); margin-bottom: 4px; }
  .is-today .cell-date { color: white; background: var(--teal-mid); width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; }

  /* ── STAY BARS — continuous multi-day rendering ── */
  .stay-bars { display: flex; flex-direction: column; gap: 3px; margin-top: 2px; }
  .stay-bar {
    height: 22px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding: 0 7px;
    font-size: 11px;
    font-weight: 400;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.15s, transform 0.1s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    letter-spacing: 0.2px;
    position: relative;
  }
  .stay-bar:hover { opacity: 0.88; transform: translateY(-1px); }
  /* Start of a multi-day stay */
  .stay-bar.bar-start { border-radius: 20px 4px 4px 20px; padding-left: 10px; }
  /* Middle of a stay — no rounded left/right */
  .stay-bar.bar-mid { border-radius: 0; margin-left: -3px; margin-right: -3px; padding: 0 3px; }
  /* End of a stay */
  .stay-bar.bar-end { border-radius: 4px 20px 20px 4px; margin-left: -3px; padding-right: 10px; }
  /* Single day stay */
  .stay-bar.bar-single { border-radius: 20px; }
  /* Only show name on start */
  .stay-bar.bar-mid .bar-name,
  .stay-bar.bar-end .bar-name { display: none; }

  /* ── SIDEBAR ── */
  .sb-section { margin-bottom: 28px; }
  .sb-label { font-size: 10px; font-weight: 400; letter-spacing: 2.5px; text-transform: uppercase; color: var(--light); margin-bottom: 12px; }
  .sb-empty { font-size: 13px; color: var(--light); font-weight: 300; font-style: italic; }

  /* Weather */
  .weather-card { background: var(--seafoam-pale); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .weather-loc { font-size: 10px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: var(--light); margin-bottom: 8px; }
  .weather-main { display: flex; align-items: center; justify-content: space-between; }
  .weather-temp { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; color: var(--teal); line-height: 1; }
  .weather-icon { font-size: 30px; }
  .weather-desc { font-size: 13px; color: var(--mid); font-weight: 300; margin-top: 6px; }
  .weather-vibe { font-size: 12px; color: var(--teal); font-style: italic; font-family: 'Cormorant Garamond', serif; margin-top: 6px; font-size: 14px; }

  /* Who's home */
  .home-card {
    background: var(--seafoam-pale);
    border-radius: 10px; padding: 12px 14px;
    margin-bottom: 8px;
    display: flex; align-items: flex-start; gap: 10px;
    border-left: 3px solid var(--teal-mid);
  }
  .home-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .home-name { font-size: 14px; font-weight: 400; margin-bottom: 2px; }
  .home-dates { font-size: 12px; color: var(--light); font-weight: 300; }
  .home-here { font-size: 10px; background: rgba(46,155,127,0.12); color: var(--teal); padding: 2px 8px; border-radius: 20px; display: inline-block; margin-top: 4px; letter-spacing: 0.5px; }

  .coming-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--sand-mid); align-items: flex-start; }
  .coming-item:last-child { border-bottom: none; }
  .coming-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .coming-name { font-size: 13px; font-weight: 400; margin-bottom: 1px; }
  .coming-dates { font-size: 11px; color: var(--light); font-weight: 300; }
  .coming-note { font-size: 11px; color: var(--mid); font-style: italic; margin-top: 2px; font-weight: 300; }

  /* ── PEOPLE PAGE ── */
  .people-page { padding: 32px; max-width: 700px; margin: 0 auto; }
  .page-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 400; color: var(--teal); margin-bottom: 6px; }
  .page-sub { font-size: 14px; color: var(--light); font-weight: 300; margin-bottom: 28px; }
  .people-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  .person-card { background: var(--white); border-radius: 14px; padding: 20px; border: 1px solid var(--sand-mid); transition: box-shadow 0.2s; }
  .person-card:hover { box-shadow: 0 4px 20px rgba(14,26,22,0.08); }
  .person-av { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 500; color: white; margin-bottom: 12px; }
  .person-name { font-size: 16px; font-weight: 400; margin-bottom: 4px; }
  .person-upcoming { font-size: 12px; color: var(--light); font-weight: 300; }
  .person-stays { margin-top: 10px; }
  .person-stay-item { font-size: 12px; color: var(--mid); padding: 4px 0; border-bottom: 1px solid var(--sand-mid); font-weight: 300; }
  .person-stay-item:last-child { border-bottom: none; }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(14,26,22,0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal { background: var(--white); border-radius: 20px; padding: 36px; max-width: 460px; width: 94%; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: slideUp 0.25s ease; }
  @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; color: var(--teal); margin-bottom: 22px; }

  .field-group { margin-bottom: 16px; }
  .field-label { display: block; font-size: 10px; font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; color: var(--mid); margin-bottom: 8px; }
  .field-input { width: 100%; padding: 12px 15px; border: 1.5px solid var(--sand-mid); border-radius: 10px; font-size: 15px; color: var(--ink); background: var(--white); outline: none; transition: border-color 0.2s; font-family: 'Jost', sans-serif; font-weight: 300; }
  .field-input:focus { border-color: var(--teal-mid); }

  .color-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
  .color-dot { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: all 0.18s; }
  .color-dot.sel { border-color: var(--ink); transform: scale(1.2); }
  .color-dot:hover { transform: scale(1.1); }

  .name-suggestions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .name-chip { font-size: 12px; padding: 4px 12px; border-radius: 20px; background: var(--sand-mid); color: var(--mid); cursor: pointer; font-family: 'Jost', sans-serif; transition: all 0.15s; border: none; }
  .name-chip:hover { background: var(--teal-mid); color: white; }

  .modal-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }
  .btn-cancel { padding: 10px 18px; background: none; border: 1.5px solid var(--sand-dark); border-radius: 8px; font-size: 11px; cursor: pointer; color: var(--mid); font-family: 'Jost', sans-serif; letter-spacing: 1px; text-transform: uppercase; transition: all 0.2s; }
  .btn-cancel:hover { border-color: var(--teal-mid); color: var(--teal); }
  .btn-save { padding: 10px 22px; background: var(--teal); color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 400; cursor: pointer; font-family: 'Jost', sans-serif; letter-spacing: 1px; text-transform: uppercase; transition: background 0.2s; }
  .btn-save:hover { background: var(--teal-mid); }
  .btn-remove { padding: 10px 18px; background: none; border: 1.5px solid #ffb3b3; color: #c0392b; border-radius: 8px; font-size: 11px; cursor: pointer; font-family: 'Jost', sans-serif; margin-right: auto; transition: all 0.2s; letter-spacing: 1px; text-transform: uppercase; }
  .btn-remove:hover { background: #fff0f0; }

  /* Detail modal */
  .detail-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .detail-name { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 400; color: var(--teal); }
  .detail-dates { font-size: 14px; color: var(--mid); font-weight: 300; margin-top: 3px; }
  .detail-note { background: var(--seafoam-pale); padding: 12px 16px; border-radius: 10px; font-size: 14px; color: var(--mid); font-style: italic; font-weight: 300; margin-top: 14px; }

  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--teal); color: white; padding: 11px 26px; border-radius: 50px; font-size: 13px; z-index: 2000; transition: transform 0.3s; pointer-events: none; white-space: nowrap; font-family: 'Jost', sans-serif; }
  .toast.show { transform: translateX(-50%) translateY(0); }

  @media (max-width: 800px) {
    .cal-page { grid-template-columns: 1fr; }
    .cal-sidebar { display: none; }
    .cal-main { padding: 16px; }
    .app-header, .app-nav { padding: 0 16px; }
    .cal-cell { min-height: 72px; }
  }
`;

// ── WEATHER ───────────────────────────────────────────────────────────────────
const WX_CODES = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  71:"❄️",73:"❄️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",
  95:"⛈️",96:"⛈️",99:"⛈️",
};
const WX_VIBES = {
  0:"Perfect day for the pool.", 1:"Great beach weather.",
  2:"Nice island day.", 3:"Cloudy but warm.",
  51:"Light rain — porch weather.", 53:"Some showers today.",
  61:"Rain today.", 80:"Afternoon showers.", 95:"Storm rolling in.",
};

function WeatherCard() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&timezone=America/New_York")
      .then(r => r.json()).then(d => setWx(d.current)).catch(() => {});
  }, []);
  if (!wx) return null;
  const code = wx.weathercode;
  const icon = WX_CODES[code] || "🌤️";
  const vibe = WX_VIBES[code] || "Beautiful Key West day.";
  return (
    <div className="weather-card">
      <div className="weather-loc">Key West Today</div>
      <div className="weather-main">
        <div className="weather-temp">{Math.round(wx.temperature_2m)}°</div>
        <div className="weather-icon">{icon}</div>
      </div>
      <div className="weather-desc">Wind {Math.round(wx.windspeed_10m)} mph</div>
      <div className="weather-vibe">{vibe}</div>
    </div>
  );
}

// ── GATE SCREEN ───────────────────────────────────────────────────────────────
function GateScreen({ onEnter }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const enter = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr("");
    try {
      await api("passkey", { method: "POST", body: JSON.stringify({ passkey: code.trim() }) });
      onEnter();
    } catch {
      setErr("That's not it — try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="gate">
      <div className="gate-bg" style={{ backgroundImage: `url(${pool_exterior})` }} />
      <div className="gate-overlay" />
      <div className="gate-card">
        <div className="gate-palm">🌴</div>
        <div className="gate-title"><em>Casa</em><br />Kallman</div>
        <div className="gate-sub">Key West · Sunset Key</div>
        <label className="gate-label">Passkey</label>
        <input className="gate-input" type="password" placeholder="· · · · · · · ·"
          value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && enter()} autoFocus />
        {err && <div className="gate-error">{err}</div>}
        <button className="gate-btn" onClick={enter} disabled={loading}>
          {loading ? "..." : "Enter"}
        </button>
      </div>
    </div>
  );
}

// ── ADD/EDIT STAY MODAL ───────────────────────────────────────────────────────
function StayModal({ stay, knownPeople, onClose, onSave, onDelete }) {
  const isEdit = !!stay?.id;
  const td = today();
  const [name, setName] = useState(stay?.name || "");
  const [start, setStart] = useState(stay?.start || td);
  const [end, setEnd] = useState(stay?.end || td);
  const [note, setNote] = useState(stay?.note || "");
  const [color, setColor] = useState(stay?.color || DEFAULT_COLOR);
  const [loading, setLoading] = useState(false);

  // When name is typed and matches a known person, inherit their color
  const onNameChange = (val) => {
    setName(val);
    const known = knownPeople.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (known) setColor(known.color);
  };

  const save = async () => {
    if (!name.trim() || !start || !end) return;
    if (end < start) { alert("End date needs to be after start."); return; }
    setLoading(true);
    try {
      await onSave({ name: name.trim(), start, end, note, color, id: stay?.id });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? "Edit Stay" : "Add Stay"}</div>

        <div className="field-group">
          <label className="field-label">Whose stay?</label>
          <input className="field-input" value={name} onChange={e => onNameChange(e.target.value)}
            placeholder="Name" autoFocus />
          {knownPeople.length > 0 && !isEdit && (
            <div className="name-suggestions">
              {knownPeople.filter(p => !name || p.name.toLowerCase().startsWith(name.toLowerCase())).slice(0, 6).map(p => (
                <button key={p.name} className="name-chip" onClick={() => { setName(p.name); setColor(p.color); }}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field-group" style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Arriving</label>
            <input className="field-input" type="date" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label">Leaving</label>
            <input className="field-input" type="date" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Note (optional)</label>
          <input className="field-input" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Bringing friends, celebrating something..." />
        </div>

        <div className="field-group">
          <label className="field-label">Color</label>
          <div className="color-row">
            {COLORS.map(c => (
              <div key={c.id} className={`color-dot ${color === c.hex ? "sel" : ""}`}
                style={{ background: c.hex }} onClick={() => setColor(c.hex)} title={c.label} />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          {isEdit && <button className="btn-remove" onClick={async () => { if (window.confirm("Remove this stay?")) { await onDelete(stay.id); onClose(); } }}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── STAY DETAIL MODAL ─────────────────────────────────────────────────────────
function DetailModal({ stay, onClose, onEdit, onDelete }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="detail-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: stay.color || DEFAULT_COLOR, flexShrink: 0 }} />
              <div className="detail-name">{stay.name}</div>
            </div>
            <div className="detail-dates">{fmtLong(stay.start)} — {fmtLong(stay.end)}</div>
          </div>
        </div>
        {stay.note && <div className="detail-note">"{stay.note}"</div>}
        <div className="modal-actions">
          <button className="btn-remove" onClick={async () => { if (window.confirm("Remove?")) { await onDelete(stay.id); onClose(); } }}>Remove</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button className="btn-save" onClick={() => { onClose(); onEdit(stay); }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────────────────────
function CalendarPage({ stays, knownPeople, onSave, onDelete, showToast }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [addModal, setAddModal] = useState(false);
  const [editStay, setEditStay] = useState(null);
  const [detailStay, setDetailStay] = useState(null);
  const td = today();

  const firstDay = new Date(year, month, 1).getDay();
  const dim = daysInMonth(year, month);
  const prevDim = daysInMonth(year, month === 0 ? 11 : month - 1);

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDim - i, cur: false });
  for (let i = 1; i <= dim; i++) cells.push({ day: i, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - dim - firstDay + 1, cur: false });

  // Build stay segments per cell
  // For each stay, figure out which cells it occupies and mark bar position
  const cellStays = {}; // key: cellIndex → array of {stay, pos: 'start'|'mid'|'end'|'single'}
  stays.forEach(stay => {
    cells.forEach((cell, idx) => {
      if (!cell.cur) return;
      const cellDate = ds(year, month, cell.day);
      if (cellDate >= stay.start && cellDate <= stay.end) {
        const isStart = cellDate === stay.start;
        const isEnd = cellDate === stay.end;
        let pos = "mid";
        if (isStart && isEnd) pos = "single";
        else if (isStart) pos = "start";
        else if (isEnd) pos = "end";
        // Also treat Sunday (col 0) as visual start, Saturday (col 6) as visual end
        const col = idx % 7;
        if (pos === "mid" && col === 0) pos = "start";
        if (pos === "mid" && col === 6) pos = "end";
        if (pos === "start" && col === 6) pos = "single";
        if (!cellStays[idx]) cellStays[idx] = [];
        cellStays[idx].push({ stay, pos });
      }
    });
  });

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Sidebar data
  const atHouse = stays.filter(s => s.start <= td && s.end >= td);
  const upcoming = stays.filter(s => s.start > td).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 8);

  return (
    <div className="cal-page">
      <div className="cal-main">
        <div className="cal-header">
          <div className="cal-nav">
            <button className="btn-nav" onClick={prev}>‹</button>
            <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
            <button className="btn-nav" onClick={next}>›</button>
          </div>
          <button className="btn-add-stay" onClick={() => setAddModal(true)}>+ Add Stay</button>
        </div>

        <div className="cal-day-labels">
          {DAY_NAMES.map(d => <div key={d} className="day-label">{d}</div>)}
        </div>

        <div className="cal-grid">
          {cells.map((cell, i) => {
            const cellDate = cell.cur ? ds(year, month, cell.day) : null;
            const isToday = cellDate === td;
            const segs = cellStays[i] || [];
            const isEmpty = cell.cur && segs.length === 0;
            return (
              <div key={i} className={`cal-cell ${!cell.cur ? "other-month" : ""} ${isToday ? "is-today" : ""} ${isEmpty ? "is-empty" : ""}`}>
                <div className="cell-date">{cell.day}</div>
                <div className="stay-bars">
                  {segs.map(({ stay, pos }, si) => (
                    <div key={stay.id + si}
                      className={`stay-bar bar-${pos}`}
                      style={{ background: stay.color || DEFAULT_COLOR }}
                      onClick={() => setDetailStay(stay)}>
                      <span className="bar-name">{stay.name}{stay.note ? ` · ${stay.note}` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="cal-sidebar">
        <WeatherCard />

        <div className="sb-section">
          <div className="sb-label">At the house</div>
          {atHouse.length === 0 ? (
            <div className="sb-empty">Nobody home right now 🌴</div>
          ) : atHouse.map(s => (
            <div key={s.id} className="home-card">
              <div className="home-dot" style={{ background: s.color || DEFAULT_COLOR }} />
              <div>
                <div className="home-name">{s.name}</div>
                <div className="home-dates">{fmt(s.start)} — {fmt(s.end)}</div>
                {s.note && <div style={{ fontSize: 12, color: "var(--mid)", fontStyle: "italic", fontWeight: 300, marginTop: 2 }}>{s.note}</div>}
                <div className="home-here">Here now</div>
              </div>
            </div>
          ))}
        </div>

        <div className="sb-section">
          <div className="sb-label">Coming up</div>
          {upcoming.length === 0 ? (
            <div className="sb-empty">Nothing planned yet</div>
          ) : upcoming.map(s => (
            <div key={s.id} className="coming-item">
              <div className="coming-dot" style={{ background: s.color || DEFAULT_COLOR }} />
              <div>
                <div className="coming-name">{s.name}</div>
                <div className="coming-dates">{fmt(s.start)} — {fmt(s.end)}</div>
                {s.note && <div className="coming-note">{s.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {addModal && (
        <StayModal knownPeople={knownPeople} onClose={() => setAddModal(false)}
          onSave={async (s) => { await onSave(s); showToast("Stay added!"); }}
          onDelete={onDelete} />
      )}
      {editStay && (
        <StayModal stay={editStay} knownPeople={knownPeople} onClose={() => setEditStay(null)}
          onSave={async (s) => { await onSave(s); showToast("Updated!"); }}
          onDelete={async (id) => { await onDelete(id); showToast("Removed."); }} />
      )}
      {detailStay && (
        <DetailModal stay={detailStay} onClose={() => setDetailStay(null)}
          onEdit={(s) => { setDetailStay(null); setEditStay(s); }}
          onDelete={async (id) => { await onDelete(id); setDetailStay(null); showToast("Removed."); }} />
      )}
    </div>
  );
}

// ── PEOPLE PAGE ───────────────────────────────────────────────────────────────
function PeoplePage({ stays }) {
  const td = today();
  // Build people from stays — no accounts, just infer from booking names
  const peopleMap = {};
  stays.forEach(s => {
    if (!peopleMap[s.name]) peopleMap[s.name] = { name: s.name, color: s.color || DEFAULT_COLOR, stays: [] };
    peopleMap[s.name].stays.push(s);
    // Use most recent color for this person
    peopleMap[s.name].color = s.color || peopleMap[s.name].color;
  });
  const people = Object.values(peopleMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="people-page">
      <div className="page-title">Everyone</div>
      <div className="page-sub">Family and friends who've been to the house</div>
      {people.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--light)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌴</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: "var(--teal)", marginBottom: 6 }}>No stays yet</div>
          <div style={{ fontSize: 14, fontWeight: 300 }}>Add a stay from the calendar to get started.</div>
        </div>
      ) : (
        <div className="people-grid">
          {people.map(p => {
            const upcoming = p.stays.filter(s => s.end >= td).sort((a, b) => a.start.localeCompare(b.start));
            const past = p.stays.filter(s => s.end < td);
            return (
              <div key={p.name} className="person-card">
                <div className="person-av" style={{ background: p.color }}>{p.name[0]?.toUpperCase()}</div>
                <div className="person-name">{p.name}</div>
                <div className="person-upcoming">
                  {upcoming.length > 0 ? `${upcoming.length} upcoming stay${upcoming.length > 1 ? "s" : ""}` : past.length > 0 ? `${past.length} past stay${past.length > 1 ? "s" : ""}` : "No stays yet"}
                </div>
                {upcoming.length > 0 && (
                  <div className="person-stays">
                    {upcoming.slice(0, 3).map(s => (
                      <div key={s.id} className="person-stay-item">{fmt(s.start)} — {fmt(s.end)}{s.note ? ` · ${s.note}` : ""}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("gate"); // gate | app
  const [tab, setTab] = useState("calendar");
  const [stays, setStays] = useState([]);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchStays = useCallback(async () => {
    try {
      const d = await api("bookings");
      // Map from old field names (startDate/endDate) to new (start/end)
      setStays((d.bookings || []).map(b => ({
        ...b,
        start: b.start || b.startDate,
        end: b.end || b.endDate,
      })));
    } catch {}
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("casa_ok") === "true") {
      setScreen("app");
    }
  }, []);

  useEffect(() => {
    if (screen === "app") fetchStays();
  }, [screen, fetchStays]);

  const handleEnter = () => {
    sessionStorage.setItem("casa_ok", "true");
    setScreen("app");
  };

  const handleSave = async (stay) => {
    try {
      const body = { name: stay.name, startDate: stay.start, endDate: stay.end, note: stay.note || "", color: stay.color, visibility: "family" };
      if (stay.id) await api(`bookings/${stay.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("bookings", { method: "POST", body: JSON.stringify(body) });
      fetchStays();
    } catch { showToast("Something went wrong."); }
  };

  const handleDelete = async (id) => {
    try { await api(`bookings/${id}`, { method: "DELETE" }); fetchStays(); }
    catch { showToast("Could not remove."); }
  };

  // Infer known people from existing stays for autocomplete
  const knownPeople = Object.values(
    stays.reduce((acc, s) => {
      if (!acc[s.name]) acc[s.name] = { name: s.name, color: s.color || DEFAULT_COLOR };
      else acc[s.name].color = s.color || acc[s.name].color;
      return acc;
    }, {})
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (screen === "gate") {
    return (
      <>
        <style>{css}</style>
        <GateScreen onEnter={handleEnter} />
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="app-header">
          <div className="app-brand">
            Casa Kallman
            <span className="app-badge">Sunset Key</span>
          </div>
          <div className="app-header-right">
            <button className="btn-exit" onClick={() => { sessionStorage.removeItem("casa_ok"); setScreen("gate"); }}>Exit</button>
          </div>
        </div>
        <div className="app-nav">
          <button className={`nav-tab ${tab === "calendar" ? "active" : ""}`} onClick={() => setTab("calendar")}>Calendar</button>
          <button className={`nav-tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>People</button>
        </div>

        {tab === "calendar" && (
          <CalendarPage stays={stays} knownPeople={knownPeople}
            onSave={handleSave} onDelete={handleDelete} showToast={showToast} />
        )}
        {tab === "people" && <PeoplePage stays={stays} />}
      </div>
      <Toast msg={toast} />
    </>
  );
}

function Toast({ msg }) {
  return <div className={`toast ${msg ? "show" : ""}`}>{msg}</div>;
}
