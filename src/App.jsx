import { useState, useEffect, useCallback, useRef } from "react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WEEK_COUNT = 53;

// Real house photo (Zillow og:image — publicly accessible)
const HERO_PHOTO = "https://photos.zillowstatic.com/fp/778e79f94a6dac02ad684702e2e0d7fc-cc_ft_1536.jpg";

const PALETTE = ["#2E9B8F","#E8894A","#7B68EE","#E86B6B","#4AA8E8","#8BC34A","#FF7043","#AB47BC","#26C6DA","#EC407A"];
const avatarColor = (name) => {
  let h = 0;
  for (let c of (name||"?")) h = c.charCodeAt(0) + ((h<<5)-h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};

const api = async (path, opts={}) => {
  const token = localStorage.getItem("bh_token");
  const res = await fetch(`/api/${path}`, {
    headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const fmt = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const dateStr = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const isInRange = (ds,s,e) => ds>=s && ds<=e;

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --teal: #1A6B6B; --teal-mid: #2E9B8F; --seafoam: #8DCFCA;
    --seafoam-pale: #E8F7F6; --sand: #F2E4C8; --sand-dark: #D4C4A0;
    --sunset: #E8894A; --sunset-light: #F2A96E;
    --white: #FAFDF8; --off: #F5F0E8;
    --dark: #0F1F1F; --text: #1C2B2B; --mid: #4A6363; --light: #8AACAC;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html { scroll-behavior: smooth; }
  body { font-family:'DM Sans',sans-serif; background:var(--white); color:var(--text); min-height:100vh; overflow-x:hidden; }

  /* ── PUBLIC ESTATE PAGE ── */
  .estate { min-height:100vh; }

  .estate-hero {
    height:100vh; position:relative; overflow:hidden;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
  }
  .estate-hero-bg {
    position:absolute; inset:0;
    background: url('${HERO_PHOTO}') center/cover no-repeat;
    animation: heroZoom 20s ease-in-out infinite alternate;
  }
  @keyframes heroZoom { from{transform:scale(1)} to{transform:scale(1.05)} }
  .estate-hero-overlay {
    position:absolute; inset:0;
    background:linear-gradient(180deg, rgba(15,31,31,0.3) 0%, rgba(15,31,31,0.5) 60%, rgba(15,31,31,0.85) 100%);
  }
  .estate-hero-content {
    position:relative; z-index:2; text-align:center; padding:0 24px;
    animation: fadeUp 1.2s ease forwards;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

  .estate-eyebrow {
    font-size:11px; letter-spacing:4px; text-transform:uppercase;
    color:rgba(184,228,226,0.8); margin-bottom:20px; font-weight:400;
  }
  .estate-title {
    font-family:'Cormorant Garamond',serif; font-size:clamp(56px,10vw,96px);
    font-weight:300; color:var(--white); line-height:1; letter-spacing:-2px;
    margin-bottom:12px;
  }
  .estate-subtitle {
    font-family:'Cormorant Garamond',serif; font-style:italic;
    font-size:22px; color:rgba(255,255,255,0.6); margin-bottom:48px; font-weight:300;
  }
  .estate-stats {
    display:flex; gap:32px; justify-content:center; margin-bottom:52px; flex-wrap:wrap;
  }
  .estate-stat {
    text-align:center;
    border:1px solid rgba(255,255,255,0.15);
    border-radius:8px; padding:12px 20px;
    backdrop-filter:blur(8px);
    background:rgba(255,255,255,0.06);
  }
  .estate-stat-num {
    font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:400;
    color:var(--white); line-height:1;
  }
  .estate-stat-label {
    font-size:10px; letter-spacing:2px; text-transform:uppercase;
    color:rgba(255,255,255,0.5); margin-top:4px;
  }

  .btn-request {
    display:inline-block; padding:16px 40px;
    background:linear-gradient(135deg,var(--teal-mid),var(--seafoam));
    color:var(--teal); border:none; border-radius:50px;
    font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
    cursor:pointer; font-family:'DM Sans',sans-serif;
    box-shadow:0 8px 32px rgba(46,155,143,0.4);
    transition:all 0.3s; text-decoration:none;
  }
  .btn-request:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(46,155,143,0.5); }

  .scroll-hint {
    position:absolute; bottom:32px; left:50%; transform:translateX(-50%);
    z-index:2; display:flex; flex-direction:column; align-items:center; gap:8px;
    color:rgba(255,255,255,0.4); font-size:11px; letter-spacing:2px; text-transform:uppercase;
    animation:bounce 2s ease-in-out infinite;
  }
  @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }

  /* Estate sections */
  .estate-section {
    padding:100px 24px;
    max-width:1000px; margin:0 auto;
  }
  .estate-section-label {
    font-size:10px; letter-spacing:3px; text-transform:uppercase;
    color:var(--seafoam); margin-bottom:16px;
  }
  .estate-section-title {
    font-family:'Cormorant Garamond',serif; font-size:clamp(32px,5vw,52px);
    font-weight:300; color:var(--teal); line-height:1.1; margin-bottom:24px;
  }
  .estate-section-body {
    font-size:17px; line-height:1.8; color:var(--mid); max-width:600px;
  }

  .estate-photo-grid {
    display:grid; grid-template-columns:2fr 1fr; gap:8px;
    margin:60px 0; max-width:1000px; margin-left:auto; margin-right:auto;
    padding:0 24px;
  }
  .estate-photo-main {
    height:480px; border-radius:12px; overflow:hidden;
    background:linear-gradient(135deg,#1A6B6B,#2E9B8F);
    position:relative;
  }
  .estate-photo-stack { display:flex; flex-direction:column; gap:8px; }
  .estate-photo-sm {
    flex:1; border-radius:12px; overflow:hidden;
  }
  .estate-photo-sm:nth-child(1) { background:linear-gradient(135deg,#E8894A,#F2A96E); }
  .estate-photo-sm:nth-child(2) { background:linear-gradient(135deg,#5BA4CF,#8DCFCA); }
  .estate-photo-sm:nth-child(3) { background:linear-gradient(135deg,#2E9B8F,#8DCFCA); }

  .estate-photo-inner {
    width:100%; height:100%;
    background:center/cover no-repeat;
    transition:transform 0.6s ease;
  }
  .estate-photo-main:hover .estate-photo-inner,
  .estate-photo-sm:hover .estate-photo-inner { transform:scale(1.04); }

  /* Features grid */
  .features-grid {
    display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:24px; margin-top:48px;
  }
  .feature-card {
    padding:28px 24px;
    border:1px solid var(--sand-dark); border-radius:12px;
    background:var(--white);
  }
  .feature-icon { font-size:28px; margin-bottom:12px; }
  .feature-title { font-family:'Cormorant Garamond',serif; font-size:20px; color:var(--teal); margin-bottom:6px; }
  .feature-desc { font-size:13px; color:var(--mid); line-height:1.6; }

  /* Request section */
  .request-section {
    background:var(--dark);
    padding:100px 24px;
  }
  .request-inner { max-width:600px; margin:0 auto; }
  .request-title {
    font-family:'Cormorant Garamond',serif; font-size:clamp(36px,5vw,56px);
    font-weight:300; color:var(--white); margin-bottom:12px; line-height:1.1;
  }
  .request-sub { font-size:15px; color:rgba(255,255,255,0.5); margin-bottom:48px; line-height:1.6; }

  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .form-group { margin-bottom:16px; }
  .form-label {
    display:block; font-size:10px; letter-spacing:2px; text-transform:uppercase;
    color:rgba(255,255,255,0.4); margin-bottom:8px;
  }
  .form-input {
    width:100%; padding:14px 16px;
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
    border-radius:10px; font-size:15px; color:var(--white);
    outline:none; transition:border-color 0.2s; font-family:'DM Sans',sans-serif;
  }
  .form-input:focus { border-color:rgba(141,207,202,0.5); }
  .form-input::placeholder { color:rgba(255,255,255,0.2); }
  textarea.form-input { resize:vertical; min-height:100px; }

  .btn-submit {
    width:100%; padding:16px; margin-top:8px;
    background:linear-gradient(135deg,var(--teal-mid),var(--seafoam));
    color:var(--teal); border:none; border-radius:10px;
    font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .btn-submit:hover { transform:translateY(-2px); }
  .btn-submit:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

  .success-msg {
    text-align:center; padding:48px 24px;
    color:var(--white);
  }
  .success-icon { font-size:48px; margin-bottom:16px; }
  .success-title { font-family:'Cormorant Garamond',serif; font-size:32px; margin-bottom:8px; }
  .success-sub { color:rgba(255,255,255,0.5); font-size:15px; }

  /* Estate footer */
  .estate-footer {
    background:var(--dark); border-top:1px solid rgba(255,255,255,0.06);
    padding:32px 24px; display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:16px;
  }
  .estate-footer-brand {
    font-family:'Cormorant Garamond',serif; font-size:20px; color:rgba(255,255,255,0.4);
  }
  .family-access-link {
    font-size:12px; color:rgba(255,255,255,0.25); cursor:pointer;
    background:none; border:none; font-family:'DM Sans',sans-serif;
    letter-spacing:1px; transition:color 0.2s; text-decoration:none;
  }
  .family-access-link:hover { color:rgba(141,207,202,0.6); }

  /* ── AUTH ── */
  .auth-screen {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:var(--seafoam-pale); position:relative;
  }
  .auth-card {
    background:var(--white); border-radius:24px; padding:50px 44px;
    max-width:420px; width:90%;
    box-shadow:0 20px 60px rgba(26,107,107,0.12);
    animation:fadeUp 0.5s ease forwards;
  }
  .auth-back {
    font-size:13px; color:var(--light); cursor:pointer; margin-bottom:28px;
    display:inline-flex; align-items:center; gap:6px;
    background:none; border:none; font-family:'DM Sans',sans-serif; transition:color 0.2s;
  }
  .auth-back:hover { color:var(--teal); }
  .auth-title {
    font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:400;
    color:var(--teal); margin-bottom:6px;
  }
  .auth-sub { font-size:14px; color:var(--light); margin-bottom:32px; }

  .field-group { margin-bottom:18px; }
  .field-label {
    display:block; font-size:11px; font-weight:500; letter-spacing:1.5px;
    text-transform:uppercase; color:var(--mid); margin-bottom:8px;
  }
  .field-input {
    width:100%; padding:12px 16px; border:1.5px solid var(--sand-dark);
    border-radius:10px; font-size:15px; color:var(--text); background:var(--white);
    outline:none; transition:border-color 0.2s; font-family:'DM Sans',sans-serif;
  }
  .field-input:focus { border-color:var(--teal-mid); }
  .btn-primary {
    width:100%; padding:14px; background:var(--teal); color:var(--white);
    border:none; border-radius:10px; font-size:13px; font-weight:500;
    letter-spacing:1px; text-transform:uppercase; cursor:pointer;
    transition:background 0.2s,transform 0.1s; margin-top:8px; font-family:'DM Sans',sans-serif;
  }
  .btn-primary:hover { background:var(--teal-mid); transform:translateY(-1px); }
  .toggle-mode { text-align:center; margin-top:18px; font-size:13px; color:var(--light); }
  .toggle-mode button {
    background:none; border:none; color:var(--teal-mid); cursor:pointer;
    font-size:13px; font-family:'DM Sans',sans-serif;
    text-decoration:underline; text-underline-offset:2px;
  }
  .error-msg { color:#c0392b; font-size:13px; margin-bottom:10px; }

  /* ── APP SHELL ── */
  .app-shell { min-height:100vh; display:flex; flex-direction:column; background:var(--off); }
  .app-header {
    background:var(--teal); padding:0 32px; height:64px;
    display:flex; align-items:center; justify-content:space-between;
    position:sticky; top:0; z-index:100;
    box-shadow:0 2px 20px rgba(26,107,107,0.3);
  }
  .header-brand { display:flex; align-items:baseline; gap:10px; }
  .header-name { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:400; color:var(--white); }
  .header-badge {
    font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase;
    color:var(--seafoam); padding:3px 8px; border:1px solid rgba(141,207,202,0.4); border-radius:20px;
  }
  .header-right { display:flex; align-items:center; gap:16px; }
  .header-user { font-size:13px; color:var(--seafoam); font-weight:300; }
  .btn-sm {
    background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
    color:var(--white); padding:6px 14px; border-radius:8px; font-size:12px;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s;
  }
  .btn-sm:hover { background:rgba(255,255,255,0.2); }

  /* ── TABS ── */
  .app-tabs {
    display:flex; gap:0; background:var(--teal); padding:0 32px;
    border-bottom:1px solid rgba(255,255,255,0.1);
  }
  .app-tab {
    padding:12px 20px; font-size:12px; font-weight:500; letter-spacing:1px;
    text-transform:uppercase; color:rgba(255,255,255,0.5); cursor:pointer;
    border-bottom:2px solid transparent; transition:all 0.2s;
    background:none; border-top:none; border-left:none; border-right:none;
    font-family:'DM Sans',sans-serif;
  }
  .app-tab.active { color:var(--white); border-bottom-color:var(--seafoam); }
  .app-tab:hover:not(.active) { color:rgba(255,255,255,0.8); }

  /* ── YEAR VIEW ── */
  .year-wrap { padding:32px; max-width:1200px; margin:0 auto; width:100%; }
  .year-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; flex-wrap:wrap; gap:16px; }
  .year-title { font-family:'Cormorant Garamond',serif; font-size:40px; color:var(--teal); font-weight:400; }

  .btn-add {
    padding:10px 22px; background:var(--sunset); color:var(--white); border:none;
    border-radius:10px; font-size:13px; font-weight:500; cursor:pointer;
    font-family:'DM Sans',sans-serif; transition:all 0.2s; display:flex; align-items:center; gap:8px;
  }
  .btn-add:hover { background:var(--sunset-light); transform:translateY(-1px); }

  /* Year grid */
  .year-grid { display:flex; flex-direction:column; gap:2px; }
  .year-month-row { display:grid; grid-template-columns:60px repeat(31,1fr); gap:2px; align-items:center; }
  .year-month-label {
    font-size:11px; font-weight:500; letter-spacing:1px; text-transform:uppercase;
    color:var(--light); text-align:right; padding-right:12px;
  }
  .year-day-cell {
    height:32px; border-radius:4px; background:var(--white);
    cursor:pointer; position:relative; transition:transform 0.1s;
    border:1px solid transparent;
  }
  .year-day-cell:hover { transform:scale(1.15); z-index:2; }
  .year-day-cell.empty { background:transparent; cursor:default; pointer-events:none; }
  .year-day-cell.today { border-color:var(--teal-mid); }
  .year-day-cell.booked-family { background:rgba(123,104,238,0.3); }
  .year-day-cell.booked-open { background:rgba(46,155,143,0.35); }
  .year-day-cell.booked-multi {
    background:linear-gradient(135deg,rgba(123,104,238,0.35),rgba(46,155,143,0.35));
  }

  .year-legend { display:flex; gap:20px; align-items:center; flex-wrap:wrap; }
  .legend-item { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--mid); }
  .legend-dot { width:12px; height:12px; border-radius:3px; }

  /* Year tooltip */
  .cell-tooltip {
    position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%);
    background:var(--dark); color:var(--white); padding:6px 10px; border-radius:6px;
    font-size:11px; white-space:nowrap; pointer-events:none; z-index:100;
    opacity:0; transition:opacity 0.15s;
  }
  .year-day-cell:hover .cell-tooltip { opacity:1; }

  /* ── MONTH CALENDAR ── */
  .cal-wrap { padding:32px; max-width:1100px; margin:0 auto; width:100%; }
  .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px; }
  .cal-nav { display:flex; align-items:center; gap:16px; }
  .cal-month-title { font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:400; color:var(--teal); min-width:240px; text-align:center; }
  .btn-nav {
    width:36px; height:36px; border-radius:50%; border:1.5px solid var(--sand-dark);
    background:var(--white); color:var(--teal); cursor:pointer; font-size:16px;
    display:flex; align-items:center; justify-content:center; transition:all 0.2s;
  }
  .btn-nav:hover { background:var(--teal); color:var(--white); border-color:var(--teal); }

  .cal-grid-header { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:4px; }
  .cal-day-name { text-align:center; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:var(--light); padding:8px 0; }
  .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .cal-cell {
    min-height:110px; background:var(--white); border-radius:10px;
    padding:10px 8px 8px; border:1.5px solid transparent;
    transition:border-color 0.15s,box-shadow 0.15s; display:flex; flex-direction:column;
  }
  .cal-cell.other-month { background:rgba(250,253,248,0.5); opacity:0.5; }
  .cal-cell.today { border-color:var(--teal-mid); }
  .cal-cell.has-booking { box-shadow:0 2px 12px rgba(26,107,107,0.1); }
  .cal-date-num { font-size:13px; font-weight:500; color:var(--mid); margin-bottom:6px; }
  .cal-cell.today .cal-date-num {
    color:var(--white); background:var(--teal-mid); width:24px; height:24px;
    border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px;
  }
  .booking-chip {
    font-size:11px; padding:3px 7px; border-radius:5px; margin-bottom:3px;
    cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    transition:opacity 0.15s; line-height:1.4;
  }
  .booking-chip:hover { opacity:0.8; }
  .chip-family { background:rgba(123,104,238,0.15); color:#5a46d4; border-left:3px solid #7B68EE; }
  .chip-open { background:rgba(46,155,143,0.15); color:var(--teal); border-left:3px solid var(--teal-mid); }

  /* ── WHO'S THERE ── */
  .whos-wrap { padding:32px; max-width:800px; margin:0 auto; width:100%; }
  .whos-title { font-family:'Cormorant Garamond',serif; font-size:36px; color:var(--teal); margin-bottom:8px; }
  .whos-sub { font-size:14px; color:var(--light); margin-bottom:32px; }
  .whos-list { display:flex; flex-direction:column; gap:12px; }
  .whos-card {
    background:var(--white); border-radius:14px; padding:20px 24px;
    display:flex; align-items:center; gap:16px;
    box-shadow:0 2px 12px rgba(26,107,107,0.06);
    border:1px solid var(--sand);
  }
  .whos-avatar {
    width:44px; height:44px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:18px; font-weight:600; color:white; flex-shrink:0;
  }
  .whos-info { flex:1; }
  .whos-name { font-weight:500; font-size:16px; margin-bottom:2px; }
  .whos-dates { font-size:13px; color:var(--light); }
  .whos-note { font-size:13px; color:var(--mid); font-style:italic; margin-top:2px; }
  .whos-badge {
    font-size:10px; padding:4px 10px; border-radius:20px; font-weight:500; letter-spacing:0.5px;
  }
  .badge-family { background:rgba(123,104,238,0.12); color:#5a46d4; }
  .badge-open { background:rgba(46,155,143,0.12); color:var(--teal); }
  .empty-state { text-align:center; padding:60px 24px; color:var(--light); }
  .empty-state-icon { font-size:48px; margin-bottom:16px; }
  .empty-state-title { font-family:'Cormorant Garamond',serif; font-size:28px; color:var(--teal); margin-bottom:8px; }

  /* ── REQUESTS (admin) ── */
  .requests-wrap { padding:32px; max-width:800px; margin:0 auto; width:100%; }
  .req-card {
    background:var(--white); border-radius:14px; padding:24px;
    margin-bottom:12px; border:1px solid var(--sand);
    box-shadow:0 2px 8px rgba(0,0,0,0.04);
  }
  .req-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
  .req-name { font-family:'Cormorant Garamond',serif; font-size:22px; color:var(--teal); }
  .req-email { font-size:13px; color:var(--light); }
  .req-dates { font-size:14px; color:var(--mid); margin-bottom:8px; }
  .req-message { font-size:14px; color:var(--mid); font-style:italic; background:var(--seafoam-pale); padding:12px; border-radius:8px; margin-bottom:16px; }
  .req-actions { display:flex; gap:10px; }
  .btn-approve { padding:8px 20px; background:var(--teal); color:var(--white); border:none; border-radius:8px; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .btn-approve:hover { background:var(--teal-mid); }
  .btn-deny { padding:8px 20px; background:none; border:1.5px solid #ffb3b3; color:#c0392b; border-radius:8px; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .btn-deny:hover { background:#fff0f0; }
  .req-status { font-size:11px; padding:4px 10px; border-radius:20px; font-weight:500; letter-spacing:0.5px; }
  .status-pending { background:rgba(232,137,74,0.12); color:#c06020; }
  .status-approved { background:rgba(46,155,143,0.12); color:var(--teal); }
  .status-denied { background:rgba(192,57,43,0.08); color:#c0392b; }

  /* ── MODAL ── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(15,31,31,0.7);
    backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center;
    z-index:1000; animation:fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background:var(--white); border-radius:20px; padding:40px;
    max-width:480px; width:92%;
    box-shadow:0 30px 80px rgba(0,0,0,0.2); animation:slideUp 0.25s ease;
  }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-title { font-family:'Cormorant Garamond',serif; font-size:28px; color:var(--teal); margin-bottom:24px; }
  .modal-actions { display:flex; gap:10px; margin-top:24px; justify-content:flex-end; }
  .btn-cancel { padding:10px 20px; background:none; border:1.5px solid var(--sand-dark); border-radius:8px; font-size:13px; cursor:pointer; color:var(--mid); font-family:'DM Sans',sans-serif; transition:all 0.2s; }
  .btn-cancel:hover { border-color:var(--teal-mid); color:var(--teal); }
  .btn-save { padding:10px 24px; background:var(--teal); color:var(--white); border:none; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.2s; }
  .btn-save:hover { background:var(--teal-mid); }
  .btn-delete-sm { padding:10px 20px; background:none; border:1.5px solid #ffb3b3; color:#c0392b; border-radius:8px; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; margin-right:auto; transition:all 0.2s; }
  .btn-delete-sm:hover { background:#fff0f0; }
  .vis-toggle { display:flex; gap:10px; margin-top:8px; }
  .vis-btn { flex:1; padding:10px; border-radius:8px; border:1.5px solid var(--sand-dark); background:var(--white); font-size:12px; cursor:pointer; font-family:'DM Sans',sans-serif; text-align:center; transition:all 0.2s; color:var(--mid); }
  .vis-btn.active-family { border-color:#7B68EE; background:rgba(123,104,238,0.08); color:#5a46d4; font-weight:500; }
  .vis-btn.active-open { border-color:var(--teal-mid); background:rgba(46,155,143,0.08); color:var(--teal); font-weight:500; }

  /* ── TOAST ── */
  .toast { position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(80px); background:var(--teal); color:var(--white); padding:12px 24px; border-radius:50px; font-size:14px; z-index:2000; transition:transform 0.3s ease; pointer-events:none; white-space:nowrap; }
  .toast.show { transform:translateX(-50%) translateY(0); }

  /* Guest banner */
  .guest-banner { background:linear-gradient(135deg,var(--teal),var(--teal-mid)); color:var(--white); padding:12px 24px; font-size:14px; font-weight:300; }

  @media(max-width:700px) {
    .year-month-row { grid-template-columns:40px repeat(31,1fr); }
    .year-month-label { font-size:9px; }
    .year-day-cell { height:22px; }
    .estate-photo-grid { grid-template-columns:1fr; }
    .estate-photo-stack { flex-direction:row; height:200px; }
    .form-row { grid-template-columns:1fr; }
    .app-header { padding:0 16px; }
    .header-user { display:none; }
    .year-wrap,.cal-wrap,.whos-wrap,.requests-wrap { padding:16px; }
  }
`;

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  return <div className={`toast ${msg?"show":""}`}>{msg}</div>;
}

// ── PUBLIC ESTATE PAGE ────────────────────────────────────────────────────────
function EstatePage({ onFamilyAccess }) {
  const [formData, setFormData] = useState({ name:"", email:"", checkin:"", checkout:"", message:"" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.checkin || !formData.checkout) {
      setFormError("Please fill in all required fields."); return;
    }
    setSubmitting(true); setFormError("");
    try {
      await api("request", { method:"POST", body:JSON.stringify(formData) });
      setSubmitted(true);
    } catch(e) {
      setFormError("Something went wrong. Please try again.");
    } finally { setSubmitting(false); }
  };

  const update = (k,v) => setFormData(p=>({...p,[k]:v}));

  return (
    <div className="estate">
      {/* Hero */}
      <section className="estate-hero">
        <div className="estate-hero-bg" />
        <div className="estate-hero-overlay" />
        <div className="estate-hero-content">
          <div className="estate-eyebrow">Private Residence · Sunset Key</div>
          <h1 className="estate-title">Casa Kallman</h1>
          <p className="estate-subtitle">Key West, Florida</p>
          <div className="estate-stats">
            <div className="estate-stat">
              <div className="estate-stat-num">4</div>
              <div className="estate-stat-label">Bedrooms</div>
            </div>
            <div className="estate-stat">
              <div className="estate-stat-num">4</div>
              <div className="estate-stat-label">Bathrooms</div>
            </div>
            <div className="estate-stat">
              <div className="estate-stat-num">2,650</div>
              <div className="estate-stat-label">Sq Feet</div>
            </div>
            <div className="estate-stat">
              <div className="estate-stat-num">1999</div>
              <div className="estate-stat-label">Built</div>
            </div>
          </div>
          <a href="#request" className="btn-request">Request a Stay</a>
        </div>
        <div className="scroll-hint">
          <span>Discover</span>
          <span>↓</span>
        </div>
      </section>

      {/* About */}
      <section className="estate-section">
        <div className="estate-section-label">The Property</div>
        <h2 className="estate-section-title">A private sanctuary at the edge of the Atlantic</h2>
        <p className="estate-section-body">
          Nestled on Sunset Key, a private island accessible only by ferry from the heart of Old Town Key West,
          Casa Kallman is a four-bedroom estate with a resort-style pool, lush tropical gardens, and sweeping
          ocean views. The kind of place where mornings begin with coffee on the veranda and evenings end with
          the sound of the sea.
        </p>
        <div className="features-grid">
          {[
            {icon:"🏊", title:"Resort Pool", desc:"Lagoon-style pool with sundeck and outdoor lounge area"},
            {icon:"🌴", title:"Private Island", desc:"Sunset Key — ferry access, no cars, total seclusion"},
            {icon:"🌊", title:"Ocean Views", desc:"Direct Atlantic views from multiple rooms and terraces"},
            {icon:"🍽️", title:"Full Kitchen", desc:"Chef's kitchen with glass bar counter and dining room"},
          ].map(f=>(
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Photo grid */}
      <div className="estate-photo-grid">
        <div className="estate-photo-main">
          <div className="estate-photo-inner" style={{background:`url('${HERO_PHOTO}') center/cover`}} />
        </div>
        <div className="estate-photo-stack">
          {[
            "linear-gradient(160deg,#2E9B8F,#1A6B6B)",
            "linear-gradient(160deg,#E8894A,#F2A96E)",
            "linear-gradient(160deg,#5BA4CF,#8DCFCA)"
          ].map((bg,i)=>(
            <div key={i} className="estate-photo-sm">
              <div className="estate-photo-inner" style={{background:bg}} />
            </div>
          ))}
        </div>
      </div>

      {/* Request form */}
      <section className="request-section" id="request">
        <div className="request-inner">
          {submitted ? (
            <div className="success-msg">
              <div className="success-icon">🌴</div>
              <div className="success-title">Request Sent</div>
              <p className="success-sub">The Kallman family will be in touch shortly. We look forward to hosting you.</p>
            </div>
          ) : (
            <>
              <div className="estate-section-label" style={{color:"rgba(141,207,202,0.7)"}}>Plan Your Visit</div>
              <h2 className="request-title">Request a Stay</h2>
              <p className="request-sub">Casa Kallman is a private residence. Submit a request and the family will be in touch to confirm availability.</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-input" value={formData.name} onChange={e=>update("name",e.target.value)} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={formData.email} onChange={e=>update("email",e.target.value)} placeholder="your@email.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Check In *</label>
                  <input className="form-input" type="date" value={formData.checkin} onChange={e=>update("checkin",e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Out *</label>
                  <input className="form-input" type="date" value={formData.checkout} onChange={e=>update("checkout",e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" value={formData.message} onChange={e=>update("message",e.target.value)} placeholder="Tell us a bit about your visit, group size, any questions..." />
              </div>
              {formError && <div className="error-msg">{formError}</div>}
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="estate-footer">
        <div className="estate-footer-brand">Casa Kallman · Key West</div>
        <button className="family-access-link" onClick={onFamilyAccess}>Family access →</button>
      </footer>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onBack, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [familyPasskey, setFamilyPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name || !password) { setError("Please fill in all fields."); return; }
    if (mode==="register" && !familyPasskey) { setError("Family passkey required."); return; }
    setLoading(true); setError("");
    try {
      const data = await api(mode, { method:"POST", body:JSON.stringify({name:name.trim(),password,familyPasskey}) });
      localStorage.setItem("bh_token", data.token);
      localStorage.setItem("bh_user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <button className="auth-back" onClick={onBack}>← Back to site</button>
        <div className="auth-title">{mode==="login"?"Welcome back":"Create account"}</div>
        <div className="auth-sub">{mode==="login"?"Log in to manage bookings.":"Family members only. You'll need the family passkey."}</div>
        <div className="field-group">
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" onKeyDown={e=>e.key==="Enter"&&handle()} />
        </div>
        <div className="field-group">
          <label className="field-label">Password</label>
          <input className="field-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
        </div>
        {mode==="register" && (
          <div className="field-group">
            <label className="field-label">Family Passkey</label>
            <input className="field-input" type="password" value={familyPasskey} onChange={e=>setFamilyPasskey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
        <button className="btn-primary" onClick={handle} disabled={loading}>{loading?"...":mode==="login"?"Log In":"Create Account"}</button>
        <div className="toggle-mode">
          {mode==="login"
            ?<><span>New? </span><button onClick={()=>{setMode("register");setError("");}}>Create account</button></>
            :<><span>Have an account? </span><button onClick={()=>{setMode("login");setError("");}}>Log in</button></>}
        </div>
      </div>
    </div>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────
function BookingModal({ booking, user, onClose, onSave, onDelete }) {
  const isEdit = !!booking?.id;
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState(booking?.name||user?.name||"");
  const [startDate, setStartDate] = useState(booking?.startDate||today);
  const [endDate, setEndDate] = useState(booking?.endDate||today);
  const [note, setNote] = useState(booking?.note||"");
  const [visibility, setVisibility] = useState(booking?.visibility||"family");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name||!startDate||!endDate) return;
    if (endDate<startDate) { alert("End date must be after start."); return; }
    setLoading(true);
    try { await onSave({name,startDate,endDate,note,visibility,id:booking?.id}); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit?"Edit Stay":"Add Stay"}</div>
        <div className="field-group">
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="field-group" style={{display:"flex",gap:12}}>
          <div style={{flex:1}}><label className="field-label">Check in</label><input className="field-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div>
          <div style={{flex:1}}><label className="field-label">Check out</label><input className="field-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div>
        </div>
        <div className="field-group">
          <label className="field-label">Note</label>
          <input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional" />
        </div>
        <div className="field-group">
          <label className="field-label">Who can see this?</label>
          <div className="vis-toggle">
            <button className={`vis-btn ${visibility==="family"?"active-family":""}`} onClick={()=>setVisibility("family")}>🔒 Family only</button>
            <button className={`vis-btn ${visibility==="open"?"active-open":""}`} onClick={()=>setVisibility("open")}>🌊 Open for friends</button>
          </div>
        </div>
        <div className="modal-actions">
          {isEdit&&<button className="btn-delete-sm" onClick={async()=>{if(window.confirm("Remove?")){{await onDelete(booking.id);onClose();}}}}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={loading}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── YEAR VIEW ─────────────────────────────────────────────────────────────────
function YearView({ bookings, user, isGuest, onAdd, onEdit, onDelete }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [editBooking, setEditBooking] = useState(null);
  const [addModal, setAddModal] = useState(false);

  const visibleBookings = isGuest ? bookings.filter(b=>b.visibility==="open") : bookings;
  const todayStr = dateStr(now.getFullYear(), now.getMonth(), now.getDate());

  const getBookingsForDay = (y,m,d) => {
    const ds = dateStr(y,m,d);
    return visibleBookings.filter(b=>isInRange(ds,b.startDate,b.endDate));
  };

  const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();

  return (
    <div className="year-wrap">
      <div className="year-header">
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button className="btn-nav" onClick={()=>setYear(y=>y-1)}>‹</button>
          <div className="year-title">{year}</div>
          <button className="btn-nav" onClick={()=>setYear(y=>y+1)}>›</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div className="year-legend">
            {!isGuest&&<div className="legend-item"><div className="legend-dot" style={{background:"rgba(123,104,238,0.4)",border:"2px solid #7B68EE"}}/>Family only</div>}
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(46,155,143,0.4)",border:"2px solid #2E9B8F"}}/>Open for friends</div>
          </div>
          {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
        </div>
      </div>

      <div className="year-grid">
        {Array.from({length:12},(_,mi)=>{
          const dim = daysInMonth(year,mi);
          return (
            <div key={mi} className="year-month-row">
              <div className="year-month-label">{MONTHS[mi]}</div>
              {Array.from({length:31},(_,di)=>{
                if (di>=dim) return <div key={di} className="year-day-cell empty"/>;
                const d = di+1;
                const ds = dateStr(year,mi,d);
                const dayBookings = getBookingsForDay(year,mi,d);
                const hasFamily = dayBookings.some(b=>b.visibility==="family");
                const hasOpen = dayBookings.some(b=>b.visibility==="open");
                let cls = "year-day-cell";
                if (ds===todayStr) cls+=" today";
                if (hasFamily&&hasOpen) cls+=" booked-multi";
                else if (hasFamily) cls+=" booked-family";
                else if (hasOpen) cls+=" booked-open";
                const names = [...new Set(dayBookings.map(b=>b.name))].join(", ");
                return (
                  <div key={di} className={cls}
                    onClick={()=>{ if(dayBookings.length===1) setEditBooking(dayBookings[0]); else if(dayBookings.length>1) setEditBooking(dayBookings[0]); }}
                    title={names}>
                    {names&&<div className="cell-tooltip">{names}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {(addModal||editBooking)&&(
        <BookingModal booking={editBooking} user={user}
          onClose={()=>{setAddModal(false);setEditBooking(null);}}
          onSave={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}

// ── MONTH VIEW ────────────────────────────────────────────────────────────────
function MonthView({ bookings, user, isGuest, onAdd, onEdit, onDelete }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [detailBooking, setDetailBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const todayStr = dateStr(now.getFullYear(),now.getMonth(),now.getDate());
  const visibleBookings = isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const firstDay = new Date(year,month,1).getDay();
  const dim = new Date(year,month+1,0).getDate();
  const prevDim = new Date(year,month,0).getDate();
  const cells=[];
  for(let i=firstDay-1;i>=0;i--) cells.push({day:prevDim-i,current:false});
  for(let i=1;i<=dim;i++) cells.push({day:i,current:true});
  while(cells.length%7!==0) cells.push({day:cells.length-dim-firstDay+1,current:false});
  const bookingsForCell=(d,c)=>{if(!c)return[];const ds=dateStr(year,month,d);return visibleBookings.filter(b=>isInRange(ds,b.startDate,b.endDate));};
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};

  return (
    <div className="cal-wrap">
      <div className="cal-header">
        <div className="cal-nav">
          <button className="btn-nav" onClick={prev}>‹</button>
          <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
          <button className="btn-nav" onClick={next}>›</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div className="year-legend">
            {!isGuest&&<div className="legend-item"><div className="legend-dot" style={{background:"rgba(123,104,238,0.4)",border:"2px solid #7B68EE"}}/>Family</div>}
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(46,155,143,0.4)",border:"2px solid #2E9B8F"}}/>Open</div>
          </div>
          {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
        </div>
      </div>
      <div className="cal-grid-header">{DAY_NAMES.map(d=><div key={d} className="cal-day-name">{d}</div>)}</div>
      <div className="cal-grid">
        {cells.map((cell,i)=>{
          const chips=bookingsForCell(cell.day,cell.current);
          const isToday=cell.current&&dateStr(year,month,cell.day)===todayStr;
          return(
            <div key={i} className={`cal-cell ${!cell.current?"other-month":""} ${isToday?"today":""} ${chips.length?"has-booking":""}`}>
              <div className="cal-date-num">{cell.day}</div>
              {chips.slice(0,2).map(b=>(
                <div key={b.id} className={`booking-chip ${b.visibility==="open"?"chip-open":"chip-family"}`}
                  onClick={()=>setDetailBooking(b)}>{b.name}</div>
              ))}
              {chips.length>2&&<div style={{fontSize:10,color:"var(--light)",padding:"2px 4px"}}>+{chips.length-2} more</div>}
            </div>
          );
        })}
      </div>
      {detailBooking&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetailBooking(null)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div className="modal-title" style={{marginBottom:4}}>{detailBooking.name}</div>
                <div style={{fontSize:14,color:"var(--mid)"}}>{fmt(detailBooking.startDate)} → {fmt(detailBooking.endDate)}</div>
              </div>
              <span className={`req-status ${detailBooking.visibility==="open"?"status-approved":"status-pending"}`}>
                {detailBooking.visibility==="open"?"Open":"Family"}
              </span>
            </div>
            {detailBooking.note&&<div style={{background:"var(--seafoam-pale)",padding:"12px 16px",borderRadius:10,fontSize:14,color:"var(--mid)",fontStyle:"italic",marginTop:14}}>"{detailBooking.note}"</div>}
            <div className="modal-actions">
              {user&&(user.name===detailBooking.name||user.isAdmin)&&<button className="btn-delete-sm" onClick={async()=>{if(window.confirm("Remove?")){{await onDelete(detailBooking.id);setDetailBooking(null);}}}}>Remove</button>}
              <button className="btn-cancel" onClick={()=>setDetailBooking(null)}>Close</button>
              {user&&(user.name===detailBooking.name||user.isAdmin)&&<button className="btn-save" onClick={()=>{setEditBooking(detailBooking);setDetailBooking(null);}}>Edit</button>}
            </div>
          </div>
        </div>
      )}
      {(addModal||editBooking)&&(
        <BookingModal booking={editBooking} user={user}
          onClose={()=>{setAddModal(false);setEditBooking(null);}}
          onSave={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}

// ── WHO'S THERE ───────────────────────────────────────────────────────────────
function WhosThereView({ bookings, isGuest }) {
  const now = new Date();
  const todayStr = dateStr(now.getFullYear(),now.getMonth(),now.getDate());
  const visible = isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const upcoming = visible
    .filter(b=>b.endDate>=todayStr)
    .sort((a,b)=>a.startDate.localeCompare(b.startDate));

  return (
    <div className="whos-wrap">
      <div className="whos-title">Who's at the House</div>
      <div className="whos-sub">Upcoming stays at Casa Kallman</div>
      {upcoming.length===0?(
        <div className="empty-state">
          <div className="empty-state-icon">🌴</div>
          <div className="empty-state-title">All clear</div>
          <div style={{fontSize:14,color:"var(--light)"}}>No upcoming stays scheduled.</div>
        </div>
      ):(
        <div className="whos-list">
          {upcoming.map(b=>{
            const isNow = b.startDate<=todayStr&&b.endDate>=todayStr;
            return(
              <div key={b.id} className="whos-card" style={isNow?{borderColor:"var(--teal-mid)",boxShadow:"0 4px 20px rgba(46,155,143,0.15)"}:{}}>
                <div className="whos-avatar" style={{background:avatarColor(b.name)}}>{b.name?.[0]?.toUpperCase()}</div>
                <div className="whos-info">
                  <div className="whos-name">{b.name} {isNow&&<span style={{fontSize:11,background:"rgba(46,155,143,0.15)",color:"var(--teal)",padding:"2px 8px",borderRadius:20,marginLeft:8}}>There now</span>}</div>
                  <div className="whos-dates">{fmt(b.startDate)} — {fmt(b.endDate)}</div>
                  {b.note&&<div className="whos-note">{b.note}</div>}
                </div>
                <span className={`whos-badge ${b.visibility==="open"?"badge-open":"badge-family"}`}>
                  {b.visibility==="open"?"Open":"Family"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── REQUESTS VIEW (admin) ─────────────────────────────────────────────────────
function RequestsView({ showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const d=await api("requests"); setRequests(d.requests||[]); }
    catch{}finally{setLoading(false);}
  };

  useEffect(()=>{load();},[]);

  const updateStatus = async (id, status) => {
    try {
      await api(`requests/${id}`,{method:"PUT",body:JSON.stringify({status})});
      showToast(status==="approved"?"Request approved!":"Request denied.");
      load();
    } catch { showToast("Something went wrong."); }
  };

  if(loading) return <div className="requests-wrap"><div style={{color:"var(--light)",padding:40}}>Loading...</div></div>;

  return (
    <div className="requests-wrap">
      <div className="whos-title">Stay Requests</div>
      <div className="whos-sub" style={{marginBottom:32}}>Guest requests submitted from the website</div>
      {requests.length===0?(
        <div className="empty-state">
          <div className="empty-state-icon">📬</div>
          <div className="empty-state-title">No requests yet</div>
          <div style={{fontSize:14,color:"var(--light)"}}>Guest stay requests will appear here.</div>
        </div>
      ):(
        requests.map(r=>(
          <div key={r.id} className="req-card">
            <div className="req-header">
              <div>
                <div className="req-name">{r.name}</div>
                <div className="req-email">{r.email}</div>
              </div>
              <span className={`req-status status-${r.status||"pending"}`}>{r.status||"pending"}</span>
            </div>
            <div className="req-dates">📅 {fmt(r.checkin)} → {fmt(r.checkout)}</div>
            {r.message&&<div className="req-message">"{r.message}"</div>}
            <div className="req-actions">
              {(!r.status||r.status==="pending")&&<>
                <button className="btn-approve" onClick={()=>updateStatus(r.id,"approved")}>Approve</button>
                <button className="btn-deny" onClick={()=>updateStatus(r.id,"denied")}>Deny</button>
              </>}
              {r.status==="approved"&&<span style={{fontSize:13,color:"var(--teal)"}}>✓ Approved</span>}
              {r.status==="denied"&&<span style={{fontSize:13,color:"#c0392b"}}>✗ Denied</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── FAMILY APP ────────────────────────────────────────────────────────────────
function FamilyApp({ user, bookings, fetchBookings, onSave, onDelete, showToast, isGuest }) {
  const tabs = isGuest
    ? [{id:"year",label:"Year View"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"}]
    : user?.isAdmin
      ? [{id:"year",label:"Year View"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"},{id:"requests",label:"Requests"}]
      : [{id:"year",label:"Year View"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"}];

  const [tab, setTab] = useState("year");

  return (
    <div className="app-shell">
      {isGuest&&<div className="guest-banner">Guest view — showing open dates only</div>}
      <div className="app-header">
        <div className="header-brand">
          <span className="header-name">Casa Kallman</span>
          <span className="header-badge">{isGuest?"Guest":"Family"}</span>
        </div>
        <div className="header-right">
          {user&&<span className="header-user">Hi, {user.name}</span>}
          <button className="btn-sm" onClick={()=>{localStorage.removeItem("bh_token");localStorage.removeItem("bh_user");sessionStorage.removeItem("bh_passkey_ok");window.location.reload();}}>
            {isGuest?"Exit":"Sign out"}
          </button>
        </div>
      </div>
      <div className="app-tabs">
        {tabs.map(t=><button key={t.id} className={`app-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>
      {tab==="year"&&<YearView bookings={bookings} user={user} isGuest={isGuest} onEdit={onSave} onDelete={onDelete}/>}
      {tab==="month"&&<MonthView bookings={bookings} user={user} isGuest={isGuest} onEdit={onSave} onDelete={onDelete}/>}
      {tab==="whos"&&<WhosThereView bookings={bookings} isGuest={isGuest}/>}
      {tab==="requests"&&user?.isAdmin&&<RequestsView showToast={showToast}/>}
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("estate");
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const fetchBookings = useCallback(async()=>{
    try { const d=await api("bookings"); setBookings(d.bookings||[]); } catch{}
  },[]);

  useEffect(()=>{
    const token=localStorage.getItem("bh_token");
    const savedUser=localStorage.getItem("bh_user");
    const guestOk=sessionStorage.getItem("bh_passkey_ok");
    if(token&&savedUser){setUser(JSON.parse(savedUser));setScreen("app");}
    else if(guestOk==="true"){setIsGuest(true);setScreen("app");}
  },[]);

  useEffect(()=>{ if(screen==="app") fetchBookings(); },[screen,fetchBookings]);

  const handleSave = async (booking) => {
    try {
      if(booking.id){await api(`bookings/${booking.id}`,{method:"PUT",body:JSON.stringify(booking)});showToast("Updated!");}
      else{await api("bookings",{method:"POST",body:JSON.stringify(booking)});showToast("Stay added!");}
      fetchBookings();
    } catch { showToast("Something went wrong."); }
  };

  const handleDelete = async (id) => {
    try { await api(`bookings/${id}`,{method:"DELETE"}); showToast("Removed."); fetchBookings(); }
    catch { showToast("Could not delete."); }
  };

  return (
    <>
      <style>{css}</style>
      {screen==="estate"&&<EstatePage onFamilyAccess={()=>setScreen("auth")}/>}
      {screen==="auth"&&<AuthScreen onBack={()=>setScreen("estate")} onSuccess={(u)=>{setUser(u);setScreen("app");}}/>}
      {screen==="app"&&<FamilyApp user={user} bookings={bookings} fetchBookings={fetchBookings} onSave={handleSave} onDelete={handleDelete} showToast={showToast} isGuest={isGuest}/>}
      <Toast msg={toast}/>
    </>
  );
}
