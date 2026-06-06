import { useState, useEffect, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  :root {
    --seafoam: #8DCFCA;
    --seafoam-light: #B8E4E2;
    --seafoam-pale: #E8F7F6;
    --teal-deep: #1A6B6B;
    --teal-mid: #2E9B8F;
    --sand: #F2E4C8;
    --sand-dark: #D4C4A0;
    --sunset: #E8894A;
    --sunset-light: #F2A96E;
    --white: #FAFDF8;
    --text-dark: #1C2B2B;
    --text-mid: #4A6363;
    --text-light: #8AACAC;
    --family-purple: #7B68EE;
    --open-green: #2E9B8F;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--white);
    color: var(--text-dark);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── LANDING ── */
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: linear-gradient(160deg, #0d3b3b 0%, #1A6B6B 40%, #2E9B8F 70%, #8DCFCA 100%);
  }

  .landing-waves {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 200px;
    opacity: 0.15;
    pointer-events: none;
  }

  .landing-palms {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .palm-left, .palm-right {
    position: absolute;
    bottom: 0;
    opacity: 0.12;
  }
  .palm-left { left: -40px; }
  .palm-right { right: -40px; transform: scaleX(-1); }

  .landing-card {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 60px 50px 50px;
    max-width: 480px;
    width: 90%;
    background: rgba(250, 253, 248, 0.08);
    border: 1px solid rgba(250, 253, 248, 0.2);
    border-radius: 24px;
    backdrop-filter: blur(20px);
    animation: fadeUp 0.8s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .house-icon {
    font-size: 48px;
    margin-bottom: 8px;
    display: block;
    animation: float 3s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .landing-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px;
    font-weight: 300;
    color: var(--white);
    line-height: 1.1;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .landing-subtitle {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-style: italic;
    color: var(--seafoam-light);
    margin-bottom: 36px;
    font-weight: 300;
    letter-spacing: 1px;
  }

  .passkey-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--seafoam-light);
    margin-bottom: 10px;
    display: block;
    text-align: left;
  }

  .passkey-input {
    width: 100%;
    padding: 14px 18px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 12px;
    font-size: 16px;
    color: var(--white);
    letter-spacing: 3px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .passkey-input::placeholder { letter-spacing: 1px; color: rgba(255,255,255,0.4); font-size: 13px; }
  .passkey-input:focus { border-color: var(--seafoam-light); background: rgba(255,255,255,0.15); }

  .btn-enter {
    width: 100%;
    margin-top: 14px;
    padding: 14px;
    background: var(--seafoam-light);
    color: var(--teal-deep);
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-enter:hover { background: var(--white); transform: translateY(-1px); }
  .btn-enter:active { transform: translateY(0); }

  .family-link {
    margin-top: 20px;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: color 0.2s;
    text-decoration: underline;
    text-underline-offset: 3px;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }
  .family-link:hover { color: var(--seafoam-light); }

  .error-msg {
    margin-top: 10px;
    font-size: 13px;
    color: #ffb3b3;
    text-align: center;
  }

  /* ── FAMILY LOGIN ── */
  .login-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--seafoam-pale);
    position: relative;
  }

  .login-card {
    background: var(--white);
    border-radius: 24px;
    padding: 50px 44px;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(26,107,107,0.12);
    animation: fadeUp 0.5s ease forwards;
  }

  .login-back {
    font-size: 13px;
    color: var(--text-light);
    cursor: pointer;
    margin-bottom: 28px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.2s;
  }
  .login-back:hover { color: var(--teal-deep); }

  .login-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 400;
    color: var(--teal-deep);
    margin-bottom: 6px;
  }
  .login-sub {
    font-size: 14px;
    color: var(--text-light);
    margin-bottom: 32px;
  }

  .field-group {
    margin-bottom: 18px;
  }
  .field-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-mid);
    margin-bottom: 8px;
  }
  .field-input {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid var(--sand-dark);
    border-radius: 10px;
    font-size: 15px;
    color: var(--text-dark);
    background: var(--white);
    outline: none;
    transition: border-color 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .field-input:focus { border-color: var(--teal-mid); }

  .btn-primary {
    width: 100%;
    padding: 14px;
    background: var(--teal-deep);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-primary:hover { background: var(--teal-mid); transform: translateY(-1px); }

  .toggle-mode {
    text-align: center;
    margin-top: 18px;
    font-size: 13px;
    color: var(--text-light);
  }
  .toggle-mode button {
    background: none;
    border: none;
    color: var(--teal-mid);
    cursor: pointer;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── APP SHELL ── */
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--seafoam-pale);
  }

  .app-header {
    background: var(--teal-deep);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 20px rgba(26,107,107,0.3);
  }

  .header-brand {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .header-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px;
    font-weight: 400;
    color: var(--white);
    letter-spacing: 0.3px;
  }
  .header-badge {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--seafoam-light);
    padding: 3px 8px;
    border: 1px solid rgba(141,207,202,0.4);
    border-radius: 20px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-user {
    font-size: 13px;
    color: var(--seafoam-light);
    font-weight: 300;
  }

  .btn-logout {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: var(--white);
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s;
  }
  .btn-logout:hover { background: rgba(255,255,255,0.2); }

  /* ── CALENDAR ── */
  .calendar-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px;
    width: 100%;
  }

  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .cal-nav {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .cal-month-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 400;
    color: var(--teal-deep);
    min-width: 240px;
    text-align: center;
  }

  .btn-nav {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid var(--sand-dark);
    background: var(--white);
    color: var(--teal-deep);
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .btn-nav:hover { background: var(--teal-deep); color: var(--white); border-color: var(--teal-deep); }

  .btn-add-booking {
    padding: 10px 22px;
    background: var(--sunset);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s, transform 0.1s;
  }
  .btn-add-booking:hover { background: var(--sunset-light); transform: translateY(-1px); }

  /* ── GRID ── */
  .cal-grid-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 4px;
  }
  .cal-day-name {
    text-align: center;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-light);
    padding: 8px 0;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .cal-cell {
    min-height: 110px;
    background: var(--white);
    border-radius: 10px;
    padding: 10px 8px 8px;
    position: relative;
    border: 1.5px solid transparent;
    transition: border-color 0.15s, box-shadow 0.15s;
    cursor: default;
    display: flex;
    flex-direction: column;
  }
  .cal-cell.other-month { background: rgba(250,253,248,0.5); opacity: 0.5; }
  .cal-cell.today { border-color: var(--teal-mid); }
  .cal-cell.has-booking { box-shadow: 0 2px 12px rgba(26,107,107,0.1); }

  .cal-date-num {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-mid);
    margin-bottom: 6px;
    line-height: 1;
  }
  .cal-cell.today .cal-date-num {
    color: var(--white);
    background: var(--teal-mid);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .booking-chip {
    font-size: 11px;
    font-weight: 400;
    padding: 3px 7px;
    border-radius: 5px;
    margin-bottom: 3px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.15s;
    line-height: 1.4;
  }
  .booking-chip:hover { opacity: 0.8; }

  .chip-family {
    background: rgba(123,104,238,0.15);
    color: #5a46d4;
    border-left: 3px solid #7B68EE;
  }
  .chip-open {
    background: rgba(46,155,143,0.15);
    color: var(--teal-deep);
    border-left: 3px solid var(--teal-mid);
  }
  .chip-more {
    font-size: 10px;
    color: var(--text-light);
    padding: 2px 4px;
  }

  /* ── LEGEND ── */
  .legend {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    color: var(--text-mid);
  }
  .legend-dot {
    width: 10px; height: 10px;
    border-radius: 3px;
  }

  /* ── GUEST BANNER ── */
  .guest-banner {
    background: linear-gradient(135deg, var(--teal-deep), var(--teal-mid));
    color: var(--white);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .guest-banner-text {
    font-size: 14px;
    font-weight: 300;
  }
  .guest-banner-text strong { font-weight: 500; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26,43,43,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--white);
    border-radius: 20px;
    padding: 40px;
    max-width: 480px;
    width: 92%;
    box-shadow: 0 30px 80px rgba(0,0,0,0.2);
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--teal-deep);
    margin-bottom: 24px;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 24px;
    justify-content: flex-end;
  }

  .btn-cancel {
    padding: 10px 20px;
    background: none;
    border: 1.5px solid var(--sand-dark);
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    color: var(--text-mid);
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .btn-cancel:hover { border-color: var(--teal-mid); color: var(--teal-deep); }

  .btn-save {
    padding: 10px 24px;
    background: var(--teal-deep);
    color: var(--white);
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s;
  }
  .btn-save:hover { background: var(--teal-mid); }

  .btn-delete {
    padding: 10px 20px;
    background: none;
    border: 1.5px solid #ffb3b3;
    color: #c0392b;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    margin-right: auto;
    transition: all 0.2s;
  }
  .btn-delete:hover { background: #fff0f0; }

  .visibility-toggle {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
  .vis-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: 1.5px solid var(--sand-dark);
    background: var(--white);
    font-size: 12px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    text-align: center;
    transition: all 0.2s;
    color: var(--text-mid);
  }
  .vis-btn.active-family {
    border-color: #7B68EE;
    background: rgba(123,104,238,0.08);
    color: #5a46d4;
    font-weight: 500;
  }
  .vis-btn.active-open {
    border-color: var(--teal-mid);
    background: rgba(46,155,143,0.08);
    color: var(--teal-deep);
    font-weight: 500;
  }

  /* ── BOOKING DETAIL ── */
  .booking-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .booking-detail-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--teal-deep);
  }
  .booking-detail-dates {
    font-size: 14px;
    color: var(--text-mid);
    margin-top: 4px;
  }
  .booking-detail-note {
    background: var(--seafoam-pale);
    padding: 14px 16px;
    border-radius: 10px;
    font-size: 14px;
    color: var(--text-mid);
    margin-top: 14px;
    font-style: italic;
  }
  .booking-vis-badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .badge-family { background: rgba(123,104,238,0.15); color: #5a46d4; }
  .badge-open { background: rgba(46,155,143,0.15); color: var(--teal-deep); }

  /* ── WHO'S THERE SIDEBAR HINT ── */
  .whos-there {
    background: var(--white);
    border-radius: 14px;
    padding: 20px;
    margin-top: 20px;
    border: 1.5px solid var(--sand);
  }
  .whos-there-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-light);
    margin-bottom: 14px;
  }
  .whos-there-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--seafoam-pale);
    font-size: 14px;
    color: var(--text-dark);
  }
  .whos-there-item:last-child { border-bottom: none; }
  .whos-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }
  .whos-dates {
    font-size: 12px;
    color: var(--text-light);
    margin-left: auto;
  }

  /* ── TOAST ── */
  .toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: var(--teal-deep);
    color: var(--white);
    padding: 12px 24px;
    border-radius: 50px;
    font-size: 14px;
    z-index: 2000;
    transition: transform 0.3s ease;
    pointer-events: none;
    white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* ── RESPONSIVE ── */
  @media (max-width: 700px) {
    .cal-cell { min-height: 72px; }
    .cal-month-title { font-size: 26px; min-width: 180px; }
    .booking-chip { font-size: 10px; padding: 2px 5px; }
    .app-header { padding: 0 16px; }
    .header-user { display: none; }
  }
`;

// ─── HELPERS ────────────────────────────────────────────────────────────────
const api = async (path, opts = {}) => {
  const token = localStorage.getItem("bh_token");
  const res = await fetch(`/api/${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const formatDate = (d) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const dateStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const isInRange = (dateS, startS, endS) => dateS >= startS && dateS <= endS;

const avatarColor = (name) => {
  const colors = ["#2E9B8F","#E8894A","#7B68EE","#E86B6B","#4AA8E8","#8BC34A","#FF7043","#AB47BC"];
  let hash = 0;
  for (let c of (name || "?")) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return <div className={`toast ${msg ? "show" : ""}`}>{msg}</div>;
}

// ─── LANDING ────────────────────────────────────────────────────────────────
function Landing({ onEnter, onFamilyClick }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      await api("passkey", {
        method: "POST",
        body: JSON.stringify({ passkey: code.trim().toLowerCase() }),
      });
      onEnter("guest");
    } catch (e) {
      setError("That passkey doesn't match — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-palms">
        <svg className="palm-left" width="220" height="400" viewBox="0 0 220 400" fill="white">
          <path d="M60,400 Q65,300 80,250 Q40,220 10,180 Q50,200 85,230 Q75,180 60,120 Q90,160 95,220 Q110,160 120,100 Q115,170 100,230 Q130,180 160,160 Q130,200 105,245 Q120,290 120,400Z"/>
        </svg>
        <svg className="palm-right" width="220" height="400" viewBox="0 0 220 400" fill="white">
          <path d="M60,400 Q65,300 80,250 Q40,220 10,180 Q50,200 85,230 Q75,180 60,120 Q90,160 95,220 Q110,160 120,100 Q115,170 100,230 Q130,180 160,160 Q130,200 105,245 Q120,290 120,400Z"/>
        </svg>
      </div>

      <div className="landing-card">
        <span className="house-icon">🌴</span>
        <div className="landing-title">Casa Kallman</div>
        <div className="landing-subtitle">Key West, Florida</div>

        <label className="passkey-label">Enter your passkey</label>
        <input
          className="passkey-input"
          type="password"
          placeholder="· · · · · · · ·"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEnter()}
          autoComplete="off"
        />
        {error && <div className="error-msg">{error}</div>}
        <button className="btn-enter" onClick={handleEnter} disabled={loading}>
          {loading ? "Checking..." : "Enter the House"}
        </button>
        <button className="family-link" onClick={onFamilyClick}>
          I'm a family member →
        </button>
      </div>

      <svg className="landing-waves" viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path d="M0,100 C360,180 720,20 1080,100 C1260,140 1380,80 1440,100 L1440,200 L0,200Z" fill="white"/>
        <path d="M0,140 C300,80 600,160 900,120 C1100,95 1300,130 1440,140 L1440,200 L0,200Z" fill="white" opacity="0.5"/>
      </svg>
    </div>
  );
}

// ─── FAMILY LOGIN ────────────────────────────────────────────────────────────
function FamilyLogin({ onBack, onSuccess }) {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [familyPasskey, setFamilyPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name || !password) { setError("Please fill in all fields."); return; }
    if (mode === "register" && !familyPasskey) { setError("Family passkey required to register."); return; }
    setLoading(true); setError("");
    try {
      const data = await api(mode, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), password, familyPasskey }),
      });
      localStorage.setItem("bh_token", data.token);
      localStorage.setItem("bh_user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <button className="login-back" onClick={onBack}>← Back</button>
        <div className="login-title">
          {mode === "login" ? "Welcome back" : "Join the family"}
        </div>
        <div className="login-sub">
          {mode === "login" ? "Log in to manage bookings." : "Create your family account."}
        </div>

        <div className="field-group">
          <label className="field-label">Your name</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Jake" onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <div className="field-group">
          <label className="field-label">Password</label>
          <input className="field-input" type="password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        {mode === "register" && (
          <div className="field-group">
            <label className="field-label">Family passkey (to verify you're family)</label>
            <input className="field-input" type="password" value={familyPasskey}
              onChange={e => setFamilyPasskey(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
        )}
        {error && <div className="error-msg" style={{color:"#c0392b",marginBottom:8}}>{error}</div>}
        <button className="btn-primary" onClick={handle} disabled={loading}>
          {loading ? "..." : mode === "login" ? "Log In" : "Create Account"}
        </button>
        <div className="toggle-mode">
          {mode === "login" ? (
            <>New to the app?{" "}<button onClick={() => { setMode("register"); setError(""); }}>Create account</button></>
          ) : (
            <>Already have an account?{" "}<button onClick={() => { setMode("login"); setError(""); }}>Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD/EDIT MODAL ──────────────────────────────────────────────────────────
function BookingModal({ booking, user, onClose, onSave, onDelete }) {
  const isEdit = !!booking?.id;
  const today = new Date().toISOString().split("T")[0];

  const [name, setName] = useState(booking?.name || user?.name || "");
  const [startDate, setStartDate] = useState(booking?.startDate || today);
  const [endDate, setEndDate] = useState(booking?.endDate || today);
  const [note, setNote] = useState(booking?.note || "");
  const [visibility, setVisibility] = useState(booking?.visibility || "family");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !startDate || !endDate) return;
    if (endDate < startDate) { alert("End date must be after start date."); return; }
    setLoading(true);
    try {
      await onSave({ name, startDate, endDate, note, visibility, id: booking?.id });
      onClose();
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this booking?")) return;
    setLoading(true);
    try { await onDelete(booking.id); onClose(); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit ? "Edit Booking" : "Add Booking"}</div>

        <div className="field-group">
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="Who's coming?" />
        </div>
        <div className="field-group" style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <label className="field-label">Check in</label>
            <input className="field-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={{flex:1}}>
            <label className="field-label">Check out</label>
            <input className="field-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Note (optional)</label>
          <input className="field-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Anything to add?" />
        </div>
        <div className="field-group">
          <label className="field-label">Visibility</label>
          <div className="visibility-toggle">
            <button className={`vis-btn ${visibility === "family" ? "active-family" : ""}`}
              onClick={() => setVisibility("family")}>🔒 Family only</button>
            <button className={`vis-btn ${visibility === "open" ? "active-open" : ""}`}
              onClick={() => setVisibility("open")}>🌊 Open for guests</button>
          </div>
        </div>

        <div className="modal-actions">
          {isEdit && <button className="btn-delete" onClick={handleDelete} disabled={loading}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BOOKING DETAIL MODAL ────────────────────────────────────────────────────
function BookingDetailModal({ booking, user, onClose, onEdit, onDelete }) {
  const canEdit = user && (user.name === booking.name || user.isAdmin);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="booking-detail-header">
          <div>
            <div className="booking-detail-name">{booking.name}</div>
            <div className="booking-detail-dates">
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
            </div>
          </div>
          <span className={`booking-vis-badge ${booking.visibility === "open" ? "badge-open" : "badge-family"}`}>
            {booking.visibility === "open" ? "Open" : "Family"}
          </span>
        </div>
        {booking.note && <div className="booking-detail-note">"{booking.note}"</div>}
        <div className="modal-actions">
          {canEdit && <button className="btn-delete" onClick={() => { onDelete(booking.id); onClose(); }}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Close</button>
          {canEdit && <button className="btn-save" onClick={() => { onClose(); onEdit(booking); }}>Edit</button>}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────
function Calendar({ user, bookings, onAdd, onEdit, onDelete, isGuest }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [detailBooking, setDetailBooking] = useState(null);

  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const visibleBookings = isGuest
    ? bookings.filter(b => b.visibility === "open")
    : bookings;

  // Build grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, current: false });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ day: i, current: true });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, current: false });

  const bookingsForCell = (day, current) => {
    if (!current) return [];
    const ds = dateStr(year, month, day);
    return visibleBookings.filter(b => isInRange(ds, b.startDate, b.endDate));
  };

  // Who's there this month
  const monthStart = dateStr(year, month, 1);
  const monthEnd = dateStr(year, month, daysInMonth);
  const thisMonthBookings = visibleBookings.filter(b =>
    b.startDate <= monthEnd && b.endDate >= monthStart
  );

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="app-shell">
      {isGuest && (
        <div className="guest-banner">
          <div className="guest-banner-text">
            <strong>Guest view</strong> — showing dates the house is open for friends
          </div>
        </div>
      )}
      <div style={{background:"var(--teal-deep)",padding:"0 32px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(26,107,107,0.3)"}}>
        <div className="header-brand">
          <span className="header-name">Casa Kallman</span>
          <span className="header-badge">{isGuest ? "Guest" : "Family"}</span>
        </div>
        <div className="header-right">
          {user && <span className="header-user">Hi, {user.name}</span>}
          {user && (
            <button className="btn-logout" onClick={() => {
              localStorage.removeItem("bh_token");
              localStorage.removeItem("bh_user");
              window.location.reload();
            }}>Sign out</button>
          )}
          {isGuest && (
            <button className="btn-logout" onClick={() => {
              sessionStorage.removeItem("bh_passkey_ok");
              window.location.reload();
            }}>Exit</button>
          )}
        </div>
      </div>

      <div className="calendar-wrap">
        <div className="calendar-header">
          <div className="cal-nav">
            <button className="btn-nav" onClick={prevMonth}>‹</button>
            <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
            <button className="btn-nav" onClick={nextMonth}>›</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div className="legend">
              {!isGuest && (
                <div className="legend-item">
                  <div className="legend-dot" style={{background:"rgba(123,104,238,0.5)",border:"2px solid #7B68EE"}} />
                  Family only
                </div>
              )}
              <div className="legend-item">
                <div className="legend-dot" style={{background:"rgba(46,155,143,0.5)",border:"2px solid #2E9B8F"}} />
                Open for guests
              </div>
            </div>
            {!isGuest && user && (
              <button className="btn-add-booking" onClick={() => onAdd()}>
                + Add Stay
              </button>
            )}
          </div>
        </div>

        <div className="cal-grid-header">
          {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        </div>

        <div className="cal-grid">
          {cells.map((cell, i) => {
            const chips = bookingsForCell(cell.day, cell.current);
            const ds = cell.current ? dateStr(year, month, cell.day) : null;
            const isToday = ds === todayStr;
            return (
              <div key={i} className={`cal-cell ${!cell.current ? "other-month" : ""} ${isToday ? "today" : ""} ${chips.length > 0 ? "has-booking" : ""}`}>
                <div className="cal-date-num">{cell.day}</div>
                {chips.slice(0, 2).map(b => (
                  <div key={b.id}
                    className={`booking-chip ${b.visibility === "open" ? "chip-open" : "chip-family"}`}
                    onClick={() => setDetailBooking(b)}
                    title={b.name}>
                    {b.name}
                  </div>
                ))}
                {chips.length > 2 && (
                  <div className="chip-more">+{chips.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>

        {thisMonthBookings.length > 0 && (
          <div className="whos-there">
            <div className="whos-there-title">At the house this month</div>
            {thisMonthBookings.map(b => (
              <div key={b.id} className="whos-there-item">
                <div className="whos-avatar" style={{background: avatarColor(b.name)}}>
                  {b.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:500}}>{b.name}</div>
                  {b.note && <div style={{fontSize:12,color:"var(--text-light)"}}>{b.note}</div>}
                </div>
                <div className="whos-dates">{formatDate(b.startDate)} – {formatDate(b.endDate)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          user={user}
          onClose={() => setDetailBooking(null)}
          onEdit={(b) => { setDetailBooking(null); onEdit(b); }}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | familyLogin | app
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchBookings = useCallback(async () => {
    try {
      const data = await api("bookings");
      setBookings(data.bookings || []);
    } catch {}
  }, []);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("bh_token");
    const savedUser = localStorage.getItem("bh_user");
    const guestOk = sessionStorage.getItem("bh_passkey_ok");

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsGuest(false);
      setScreen("app");
    } else if (guestOk === "true") {
      setIsGuest(true);
      setScreen("app");
    }
  }, []);

  useEffect(() => {
    if (screen === "app") fetchBookings();
  }, [screen, fetchBookings]);

  const handleGuestEnter = () => {
    sessionStorage.setItem("bh_passkey_ok", "true");
    setIsGuest(true);
    setScreen("app");
  };

  const handleFamilyLogin = (u) => {
    setUser(u);
    setIsGuest(false);
    setScreen("app");
  };

  const handleSave = async (booking) => {
    try {
      if (booking.id) {
        await api(`bookings/${booking.id}`, {
          method: "PUT",
          body: JSON.stringify(booking),
        });
        showToast("Booking updated!");
      } else {
        await api("bookings", {
          method: "POST",
          body: JSON.stringify(booking),
        });
        showToast("Booking added!");
      }
      fetchBookings();
    } catch (e) {
      showToast("Something went wrong.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api(`bookings/${id}`, { method: "DELETE" });
      showToast("Booking removed.");
      fetchBookings();
    } catch {
      showToast("Could not delete.");
    }
  };

  return (
    <>
      <style>{css}</style>
      {screen === "landing" && (
        <Landing
          onEnter={handleGuestEnter}
          onFamilyClick={() => setScreen("familyLogin")}
        />
      )}
      {screen === "familyLogin" && (
        <FamilyLogin
          onBack={() => setScreen("landing")}
          onSuccess={handleFamilyLogin}
        />
      )}
      {screen === "app" && (
        <Calendar
          user={user}
          bookings={bookings}
          isGuest={isGuest}
          onAdd={() => setAddModal(true)}
          onEdit={(b) => setEditBooking(b)}
          onDelete={handleDelete}
        />
      )}
      {(addModal || editBooking) && (
        <BookingModal
          booking={editBooking}
          user={user}
          onClose={() => { setAddModal(false); setEditBooking(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
      <Toast msg={toast} />
    </>
  );
}
