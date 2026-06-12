import { useState, useEffect, useCallback, useRef } from "react";
import { pool_exterior, veranda, kitchen, living, living2, sunset_pool, underwater } from "./photos.js";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COLORS = [
  {id:"teal",hex:"#2E9B7F"},{id:"sunset",hex:"#E8894A"},{id:"blue",hex:"#5BA4CF"},
  {id:"terra",hex:"#C17B5C"},{id:"green",hex:"#6BB89A"},{id:"golden",hex:"#D4A843"},
  {id:"orchid",hex:"#9B7BA8"},{id:"coral",hex:"#E06B6B"},{id:"navy",hex:"#4A6FA5"},
  {id:"sage",hex:"#7A9E7E"},{id:"rose",hex:"#C2788A"},
];
const DEFAULT_COLOR = "#2E9B7F";
const HOUSE_PHOTOS = [
  {src:pool_exterior,label:"The Pool"},{src:underwater,label:"Pool View"},
  {src:veranda,label:"The Veranda"},{src:sunset_pool,label:"Sunset"},
  {src:kitchen,label:"Kitchen"},{src:living,label:"Living Room"},{src:living2,label:"Great Room"},
];
const WX={0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",51:"🌦️",61:"🌧️",80:"🌦️",95:"⛈️"};
const VIBES={0:"Perfect day for the pool.",1:"Great beach weather.",2:"Nice island day.",3:"Cloudy but warm.",51:"Light rain — porch weather.",61:"Rain today.",80:"Afternoon showers.",95:"Storm rolling in."};
const FAV_CATEGORIES = ["Restaurant","Bar","Beach / Spot","Activity","Shop","Other"];
const FAV_ICONS = {"Restaurant":"🍽️","Bar":"🍹","Beach / Spot":"🏖️","Activity":"🤿","Shop":"🛍️","Other":"📍"};
const ACCENT_CLASS = {"Restaurant":"","Bar":"bar","Beach / Spot":"beach","Activity":"activity","Shop":"shop","Other":"other"};

// Seed placeholders shown when a category is empty — gives the page life
const FAV_PLACEHOLDERS = {
  "Restaurant": [{name:"Blue Heaven",note:"Brunch in the garden. Get there early.",link:"https://www.blueheavenkw.com"},
                 {name:"Louie's Backyard",note:"Sunset over the water. Perfect for dinner.",link:""}],
  "Bar":        [{name:"Green Parrot",note:"Cash only, great live music.",link:""},
                 {name:"Sloppy Joe's",note:"Classic Duval stop.",link:""}],
  "Beach / Spot":[{name:"Fort Zachary Taylor",note:"Best beach on the island. Bring snorkel gear.",link:""},
                  {name:"Sunset Pier",note:"The spot for golden hour.",link:""}],
  "Activity":   [{name:"Dry Tortugas Day Trip",note:"Book the ferry early — sells out fast.",link:""},
                 {name:"Kayak the Mangroves",note:"Half-day tour, morning is best.",link:""}],
  "Shop":       [{name:"Kermit's Key West Key Lime Shoppe",note:"Pick up pies for the flight home.",link:""}],
  "Other":      [],
};

const api = async (path,opts={}) => {
  const res = await fetch(`/api/${path}`,{headers:{"Content-Type":"application/json"},...opts});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||"Request failed");
  return data;
};

const pad = n => String(n).padStart(2,"0");
const ds = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;
const parseDate = s => new Date(s+"T12:00:00");
const fmt = s => parseDate(s).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtLong = s => parseDate(s).toLocaleDateString("en-US",{month:"long",day:"numeric"});
const today = () => { const n=new Date(); return ds(n.getFullYear(),n.getMonth(),n.getDate()); };
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
  :root{--ink:#0E1A16;--teal:#1A6B5A;--teal-mid:#2E9B7F;--teal-light:#5BBFA3;--sand:#F5EFE3;--sand-mid:#E8DCC8;--sand-dark:#C8B898;--sunset:#E8894A;--white:#FDFAF6;--mid:#5A7068;--light:#96B0A8;--seafoam:#EEF8F5;}
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Jost',sans-serif;background:var(--sand);color:var(--ink);min-height:100vh;}

  /* ── GATE ── */
  .gate{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .gate-bg{position:absolute;inset:0;background-size:cover;background-position:center;animation:gzoom 20s ease-in-out infinite alternate;}
  @keyframes gzoom{from{transform:scale(1)}to{transform:scale(1.06)}}
  .gate-overlay{position:absolute;inset:0;background:linear-gradient(170deg,rgba(14,26,22,0.25) 0%,rgba(14,26,22,0.55) 55%,rgba(14,26,22,0.88) 100%);}
  .gate-card{position:relative;z-index:2;text-align:center;padding:48px 40px 40px;max-width:400px;width:92%;background:rgba(14,26,22,0.42);border:1px solid rgba(255,255,255,0.12);border-radius:24px;backdrop-filter:blur(20px);animation:riseIn 1s cubic-bezier(0.16,1,0.3,1);}
  @keyframes riseIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  .gate-palm{font-size:36px;margin-bottom:14px;animation:palmFloat 4s ease-in-out infinite;}
  @keyframes palmFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .gate-title{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;color:var(--white);line-height:0.93;letter-spacing:-1px;margin-bottom:6px;}
  .gate-title em{font-style:italic;}
  .gate-sub{font-size:11px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:32px;}
  .gate-label{font-size:10px;font-weight:300;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:10px;display:block;text-align:left;}
  .gate-input{width:100%;padding:13px 18px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:12px;font-size:18px;color:var(--white);letter-spacing:5px;text-align:center;outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;}
  .gate-input::placeholder{letter-spacing:2px;color:rgba(255,255,255,0.18);font-size:12px;}
  .gate-input:focus{border-color:rgba(91,191,163,0.6);}
  .gate-btn{width:100%;margin-top:12px;padding:13px;background:linear-gradient(135deg,var(--teal-mid),var(--teal-light));color:var(--white);border:none;border-radius:12px;font-size:11px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;box-shadow:0 6px 24px rgba(46,155,127,0.32);position:relative;overflow:hidden;}
  .gate-btn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(46,155,127,0.44);}
  .gate-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
  .gate-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15),transparent 60%);background-size:200%;animation:shimmer 2.5s infinite;border-radius:12px;}
  @keyframes shimmer{0%{background-position:200%}100%{background-position:-200%}}
  .gate-error{margin-top:10px;font-size:13px;color:#ffb3b3;font-weight:300;}

  /* ── APP SHELL ── */
  .app{min-height:100vh;display:flex;flex-direction:column;}
  .app-header{background:var(--ink);height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:200;}
  .app-brand{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:400;color:var(--white);display:flex;align-items:baseline;gap:8px;white-space:nowrap;}
  .app-badge{font-size:8px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);padding:2px 7px;border:1px solid rgba(91,191,163,0.3);border-radius:20px;}
  .header-btns{display:flex;align-items:center;gap:6px;flex-shrink:0;}
  .btn-alerts{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);padding:5px 11px;border-radius:8px;font-size:10px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;white-space:nowrap;}
  .btn-alerts:hover{background:rgba(91,191,163,0.18);color:var(--teal-light);border-color:rgba(91,191,163,0.3);}
  .btn-exit{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);padding:5px 11px;border-radius:8px;font-size:10px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;white-space:nowrap;}
  .btn-exit:hover{background:rgba(255,255,255,0.14);color:white;}
  .app-nav{background:var(--ink);border-bottom:1px solid rgba(255,255,255,0.07);padding:0 4px;display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .app-nav::-webkit-scrollbar{display:none;}
  .nav-tab{padding:10px 14px;font-size:10px;font-weight:300;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;background:none;border-top:none;border-left:none;border-right:none;border-bottom:2px solid transparent;font-family:'Jost',sans-serif;white-space:nowrap;flex-shrink:0;}
  .nav-tab.active{color:var(--teal-light);border-bottom-color:var(--teal-light);}
  .nav-tab:hover:not(.active){color:rgba(255,255,255,0.7);}

  /* ── PAGE HERO ── */
  .page-hero{background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 60%,#3aab90 100%);padding:32px 20px 28px;}
  .page-hero-title{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;color:var(--white);margin-bottom:4px;}
  .page-hero-sub{font-size:12px;color:rgba(255,255,255,0.45);font-weight:300;}
  .page-body{padding:24px 16px 60px;max-width:960px;margin:0 auto;width:100%;}
  .whos-body{padding:24px 16px 60px;max-width:700px;margin:0 auto;width:100%;}
  .photos-body{padding:24px 16px 60px;max-width:1100px;margin:0 auto;width:100%;}

  /* ── CALENDAR ── */
  .cal-page{display:grid;grid-template-columns:1fr 280px;flex:1;}
  .cal-main{padding:16px;background:radial-gradient(ellipse at 20% 0%,rgba(141,207,202,0.35) 0%,transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(232,137,74,0.12) 0%,transparent 50%),linear-gradient(160deg,#d4ede9 0%,#e8f7f5 30%,#f2ead8 70%,#ede4ce 100%);min-height:calc(100vh - 100px);position:relative;}
  .cal-watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond',serif;font-size:clamp(60px,12vw,160px);font-weight:300;font-style:italic;color:rgba(26,107,90,0.06);white-space:nowrap;pointer-events:none;letter-spacing:-4px;user-select:none;z-index:0;}
  .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;position:relative;z-index:1;flex-wrap:wrap;gap:8px;}
  .cal-nav{display:flex;align-items:center;gap:10px;}
  .cal-month-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:var(--teal);}
  .btn-nav{width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(26,107,90,0.2);background:rgba(255,255,255,0.6);color:var(--teal);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
  .btn-nav:hover{background:var(--teal);color:white;border-color:var(--teal);}
  .btn-add-stay{padding:8px 18px;background:var(--sunset);color:white;border:none;border-radius:50px;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;box-shadow:0 4px 16px rgba(232,137,74,0.3);}
  .btn-add-stay:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,137,74,0.4);}
  .cal-day-labels{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px;position:relative;z-index:1;}
  .day-label{text-align:center;font-size:9px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);padding:4px 0;}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;position:relative;z-index:1;}
  .cal-cell{min-height:72px;background:rgba(253,250,246,0.96);border-radius:8px;padding:6px 4px 4px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.6);position:relative;overflow:hidden;transition:border-color 0.15s,box-shadow 0.2s;box-shadow:0 1px 6px rgba(0,0,0,0.12),0 1px 0 rgba(255,255,255,0.8) inset;}
  .cal-cell.other-month{background:rgba(253,250,246,0.15);opacity:0.35;box-shadow:none;}
  .cal-cell.is-today{border-color:var(--teal-light);box-shadow:0 0 0 2px rgba(91,191,163,0.4);}
  .cal-cell.is-empty::after{content:'🌴';position:absolute;bottom:3px;right:4px;font-size:12px;opacity:0.06;pointer-events:none;}
  .cell-date{font-size:11px;font-weight:400;color:var(--mid);margin-bottom:3px;line-height:1;}
  .is-today .cell-date{color:white;background:var(--teal-mid);width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;}
  .stay-bars{display:flex;flex-direction:column;gap:2px;margin-top:2px;}
  .stay-bar{height:18px;display:flex;align-items:center;padding:0 5px;font-size:9px;font-weight:400;color:white;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity 0.15s;box-shadow:0 1px 4px rgba(0,0,0,0.2);border-radius:3px;}
  .stay-bar.bar-start{border-radius:10px 3px 3px 10px;padding-left:7px;}
  .stay-bar.bar-mid{border-radius:0;margin-left:-2px;margin-right:-2px;padding:0 2px;}
  .stay-bar.bar-end{border-radius:3px 10px 10px 3px;margin-left:-2px;padding-right:7px;}
  .stay-bar.bar-single{border-radius:10px;}
  .stay-bar.bar-mid .bar-name,.stay-bar.bar-end .bar-name{display:none;}

  /* Sidebar */
  .cal-sidebar{background:var(--white);border-left:1px solid var(--sand-mid);overflow-y:auto;display:flex;flex-direction:column;}
  .sb-photo{height:140px;overflow:hidden;position:relative;flex-shrink:0;cursor:pointer;}
  .sb-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s ease;}
  .sb-photo:hover img{transform:scale(1.04);}
  .sb-photo-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(14,26,22,0.6) 0%,transparent 60%);}
  .sb-photo-label{position:absolute;bottom:12px;left:14px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px;font-weight:300;color:rgba(255,255,255,0.9);}
  .sb-photo-nav{position:absolute;bottom:12px;right:12px;display:flex;gap:4px;}
  .sb-photo-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.4);cursor:pointer;transition:background 0.2s;}
  .sb-photo-dot.active{background:white;}
  .sb-content{padding:16px 14px;flex:1;}
  .sb-section{margin-bottom:20px;}
  .sb-label{font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);margin-bottom:10px;}
  .sb-empty{font-size:12px;color:var(--light);font-weight:300;font-style:italic;}
  .weather-card{background:var(--seafoam);border-radius:10px;padding:12px;margin-bottom:18px;}
  .weather-loc{font-size:9px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:var(--light);margin-bottom:6px;}
  .weather-main{display:flex;align-items:center;justify-content:space-between;}
  .weather-temp{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;color:var(--teal);line-height:1;}
  .weather-icon{font-size:26px;}
  .weather-desc{font-size:11px;color:var(--mid);font-weight:300;margin-top:4px;}
  .weather-vibe{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:var(--teal);margin-top:4px;}
  .home-card{background:linear-gradient(135deg,rgba(168,221,208,0.2),rgba(245,239,227,0.4));border-radius:8px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;border-left:3px solid var(--teal-mid);}
  .home-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px;}
  .home-name{font-size:13px;font-weight:400;margin-bottom:1px;}
  .home-dates{font-size:11px;color:var(--light);font-weight:300;}
  .home-here{font-size:9px;background:rgba(46,155,127,0.12);color:var(--teal);padding:2px 7px;border-radius:20px;display:inline-block;margin-top:3px;}
  .coming-item{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--sand-mid);align-items:flex-start;}
  .coming-item:last-child{border-bottom:none;}
  .coming-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .coming-name{font-size:12px;font-weight:400;margin-bottom:1px;}
  .coming-dates{font-size:10px;color:var(--light);font-weight:300;}
  .coming-note{font-size:10px;color:var(--mid);font-style:italic;margin-top:1px;font-weight:300;}

  /* People */
  .people-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;}
  .person-card{background:var(--white);border-radius:14px;overflow:hidden;border:1px solid var(--sand-mid);transition:box-shadow 0.2s,transform 0.2s;}
  .person-card:hover{box-shadow:0 6px 24px rgba(14,26,22,0.1);transform:translateY(-2px);}
  .person-card-top{height:70px;display:flex;align-items:center;justify-content:center;}
  .person-card-body{padding:12px;}
  .person-name{font-size:16px;font-weight:400;margin-bottom:2px;text-align:center;}
  .person-meta{font-size:11px;color:var(--light);font-weight:300;text-align:center;margin-bottom:10px;}
  .person-note{font-size:14px;color:var(--mid);font-style:italic;background:var(--sand);border-radius:8px;padding:8px 10px;margin-bottom:10px;font-weight:300;font-family:'Cormorant Garamond',serif;line-height:1.5;cursor:pointer;transition:background 0.2s;}
  .person-note:hover{background:var(--sand-mid);}
  .person-note-input{width:100%;font-size:13px;font-style:italic;color:var(--mid);background:var(--sand);border:none;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-weight:300;font-family:'Cormorant Garamond',serif;outline:1.5px solid var(--teal-mid);resize:none;}
  .person-stays{border-top:1px solid var(--sand-mid);padding-top:8px;}
  .person-stay-row{font-size:11px;color:var(--mid);padding:3px 0;border-bottom:1px solid rgba(232,220,200,0.5);font-weight:300;display:flex;align-items:center;gap:5px;}
  .person-stay-row:last-child{border-bottom:none;}
  .psr-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
  .person-av-wrap{position:relative;width:48px;height:48px;margin:0 auto 10px;cursor:pointer;}
  .person-av-wrap input[type=file]{display:none;}
  .person-av-img{width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;border:2px solid rgba(255,255,255,0.5);}
  .person-av-overlay{position:absolute;inset:0;border-radius:50%;background:rgba(14,26,22,0.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;font-size:16px;}
  .person-av-wrap:hover .person-av-overlay{opacity:1;}

  /* Photos */
  .photos-house-grid{display:grid;grid-template-columns:1.6fr 1fr;grid-template-rows:240px 160px;gap:5px;border-radius:12px;overflow:hidden;margin-bottom:32px;}
  .ph-main{grid-row:1/3;position:relative;overflow:hidden;}
  .ph-cell{position:relative;overflow:hidden;}
  .ph-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.7s ease;}
  .ph-cell:hover .ph-img,.ph-main:hover .ph-img{transform:scale(1.04);}
  .ph-label{position:absolute;bottom:10px;left:12px;font-size:9px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.8);background:rgba(14,26,22,0.5);padding:3px 8px;border-radius:50px;backdrop-filter:blur(8px);}
  .photos-section-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;color:var(--teal);margin-bottom:4px;}
  .photos-section-sub{font-size:12px;color:var(--light);font-weight:300;margin-bottom:16px;}
  .upload-zone{border:2px dashed var(--sand-dark);border-radius:12px;padding:28px;text-align:center;background:rgba(253,250,246,0.6);cursor:pointer;transition:all 0.2s;margin-bottom:20px;}
  .upload-zone:hover,.upload-zone.drag-over{border-color:var(--teal-mid);background:var(--seafoam);}
  .upload-icon{font-size:28px;margin-bottom:8px;}
  .upload-text{font-size:13px;color:var(--mid);font-weight:300;}
  .upload-sub{font-size:11px;color:var(--light);font-weight:300;margin-top:3px;}
  .upload-input{display:none;}
  .memory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;}
  .memory-card{border-radius:10px;overflow:hidden;aspect-ratio:4/3;position:relative;background:var(--sand-mid);}
  .memory-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.5s;}
  .memory-card:hover img{transform:scale(1.06);}
  .memory-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(14,26,22,0.5),transparent);opacity:0;transition:opacity 0.2s;}
  .memory-card:hover .memory-overlay{opacity:1;}
  .memory-label{position:absolute;bottom:8px;left:10px;font-size:11px;color:white;font-weight:300;}
  .memory-delete{position:absolute;top:6px;right:6px;background:rgba(14,26,22,0.6);border:none;color:white;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;}
  .memory-card:hover .memory-delete{opacity:1;}

  /* Modals */
  .modal-overlay{position:fixed;inset:0;background:rgba(14,26,22,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn 0.2s;padding:16px;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--white);border-radius:18px;padding:24px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400;color:var(--teal);margin-bottom:18px;}
  .field-group{margin-bottom:14px;}
  .field-label{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid);margin-bottom:6px;}
  .field-input{width:100%;padding:10px 13px;border:1.5px solid var(--sand-mid);border-radius:10px;font-size:14px;color:var(--ink);background:var(--white);outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;font-weight:300;}
  .field-input:focus{border-color:var(--teal-mid);}
  .color-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:6px;}
  .color-dot{width:26px;height:26px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all 0.18s;}
  .color-dot.sel{border-color:var(--ink);transform:scale(1.2);}
  .name-suggestions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;}
  .name-chip{font-size:11px;padding:3px 10px;border-radius:20px;background:var(--sand-mid);color:var(--mid);cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.15s;border:none;}
  .name-chip:hover{background:var(--teal-mid);color:white;}
  .modal-actions{display:flex;gap:8px;margin-top:18px;justify-content:flex-end;flex-wrap:wrap;}
  .btn-cancel{padding:9px 16px;background:none;border:1.5px solid var(--sand-dark);border-radius:8px;font-size:10px;cursor:pointer;color:var(--mid);font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;}
  .btn-cancel:hover{border-color:var(--teal-mid);color:var(--teal);}
  .btn-save{padding:9px 20px;background:var(--teal);color:white;border:none;border-radius:8px;font-size:10px;font-weight:400;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-save:hover{background:var(--teal-mid);}
  .btn-remove{padding:9px 16px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:10px;cursor:pointer;font-family:'Jost',sans-serif;margin-right:auto;transition:all 0.2s;letter-spacing:1px;text-transform:uppercase;}
  .btn-remove:hover{background:#fff0f0;}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--teal);color:white;padding:10px 22px;border-radius:50px;font-size:12px;z-index:2000;transition:transform 0.3s;pointer-events:none;white-space:nowrap;font-family:'Jost',sans-serif;}
  .toast.show{transform:translateX(-50%) translateY(0);}

  /* Flight / alert fields in StayModal */
  .toggle-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--seafoam);cursor:pointer;margin-bottom:0;}
  .toggle-check{width:18px;height:18px;border-radius:4px;border:1.5px solid var(--sand-dark);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;transition:all 0.15s;background:white;}
  .toggle-check.on{background:var(--teal-mid);border-color:var(--teal-mid);color:white;}
  .toggle-label{font-size:13px;font-weight:300;color:var(--ink);}
  .toggle-desc{font-size:11px;color:var(--light);font-weight:300;margin-top:1px;}
  .section-divider{height:1px;background:var(--sand-mid);margin:14px 0;}

  /* Favorites */
  .fav-body{padding:0 0 60px;}
  .fav-cat-strip{display:flex;border-bottom:1px solid var(--sand-mid);overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:0 16px;}
  .fav-cat-strip::-webkit-scrollbar{display:none;}
  .fav-strip-inner{display:flex;flex:1;min-width:0;}
  .fav-cat-tab{padding:12px 14px;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;color:var(--light);border-bottom:2px solid transparent;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none;border-bottom:2px solid transparent;font-family:'Jost',sans-serif;transition:all 0.18s;display:flex;align-items:center;gap:6px;flex-shrink:0;}
  .fav-cat-tab.active{color:var(--teal);border-bottom-color:var(--teal);}
  .fav-cat-count{font-size:9px;background:var(--sand-mid);color:var(--mid);padding:2px 6px;border-radius:10px;font-weight:400;}
  .fav-cat-tab.active .fav-cat-count{background:rgba(26,107,90,0.12);color:var(--teal);}
  .fav-add-btn{flex-shrink:0;align-self:center;margin:0 0 0 8px;padding:7px 16px;background:var(--sunset);color:white;border:none;border-radius:50px;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(232,137,74,0.28);}
  .fav-content{padding:20px 16px 0;max-width:960px;margin:0 auto;}
  .fav-section-label{font-size:9px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
  .fav-section-label::after{content:'';flex:1;height:1px;background:var(--sand-mid);}
  .fav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;}
  .fav-card{background:var(--white);border-radius:14px;overflow:hidden;border:1px solid var(--sand-mid);transition:box-shadow 0.2s,transform 0.2s;}
  .fav-card.placeholder{opacity:0.6;cursor:pointer;}
  .fav-card.placeholder:hover{opacity:0.85;box-shadow:0 4px 16px rgba(14,26,22,0.08);transform:translateY(-1px);}
  .fav-card:hover:not(.placeholder){box-shadow:0 6px 22px rgba(14,26,22,0.1);transform:translateY(-2px);}
  .fav-card-accent{height:3px;background:linear-gradient(90deg,var(--teal),var(--teal-light));}
  .fav-card-accent.bar{background:linear-gradient(90deg,#E8894A,#D4A843);}
  .fav-card-accent.beach{background:linear-gradient(90deg,#5BA4CF,#6BB89A);}
  .fav-card-accent.activity{background:linear-gradient(90deg,#C17B5C,#E8894A);}
  .fav-card-accent.shop{background:linear-gradient(90deg,#9B7BA8,#C2788A);}
  .fav-card-accent.other{background:linear-gradient(90deg,var(--sand-dark),var(--mid));}
  .fav-card-body{padding:14px 16px 12px;}
  .fav-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;}
  .fav-icon{font-size:20px;flex-shrink:0;}
  .fav-cat-badge{font-size:9px;font-weight:300;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);background:var(--sand);padding:2px 7px;border-radius:20px;white-space:nowrap;}
  .fav-name{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:400;color:var(--ink);line-height:1.2;margin-bottom:5px;}
  .fav-note{font-size:12px;color:var(--mid);font-weight:300;line-height:1.5;}
  .fav-placeholder-tag{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);margin-top:6px;}
  .fav-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--sand-mid);}
  .fav-link{font-size:10px;font-weight:400;letter-spacing:1px;text-transform:uppercase;color:var(--teal-mid);text-decoration:none;}
  .fav-card-actions{display:flex;gap:5px;}
  .fav-action-btn{padding:4px 9px;font-size:9px;letter-spacing:1px;text-transform:uppercase;border-radius:6px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.15s;border:1.5px solid var(--sand-dark);background:transparent;color:var(--mid);}
  .fav-action-btn:hover{border-color:var(--teal-mid);color:var(--teal);}
  .fav-action-btn.del:hover{border-color:#ffb3b3;color:#c0392b;}
  .fav-empty{text-align:center;padding:50px 0;color:var(--light);}

  /* Cat selector */
  .cat-selector{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
  .cat-opt{padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;border:1.5px solid var(--sand-dark);background:transparent;color:var(--mid);font-family:'Jost',sans-serif;transition:all 0.15s;}
  .cat-opt.sel{background:var(--teal);border-color:var(--teal);color:white;}

  /* Notification modal */
  .notif-modal{background:var(--white);border-radius:20px;padding:28px 24px 24px;max-width:440px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,0.22);animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1);position:relative;max-height:90vh;overflow-y:auto;}
  .notif-dismiss{position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;font-size:18px;color:var(--light);line-height:1;padding:4px;}
  .notif-icon{font-size:32px;margin-bottom:10px;}
  .notif-title{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:400;color:var(--teal);margin-bottom:5px;line-height:1.15;}
  .notif-sub{font-size:12px;color:var(--mid);font-weight:300;margin-bottom:20px;line-height:1.6;}
  .notif-options{display:flex;flex-direction:column;gap:10px;margin-bottom:18px;}
  .notif-option{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:10px;border:1.5px solid var(--sand-mid);cursor:pointer;transition:all 0.18s;}
  .notif-option.selected{border-color:var(--teal-mid);background:var(--seafoam);}
  .notif-option-check{width:17px;height:17px;border-radius:4px;border:1.5px solid var(--sand-dark);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:10px;transition:all 0.15s;}
  .notif-option.selected .notif-option-check{background:var(--teal-mid);border-color:var(--teal-mid);color:white;}
  .notif-option-text{font-size:13px;font-weight:400;color:var(--ink);margin-bottom:1px;}
  .notif-option-desc{font-size:11px;color:var(--light);font-weight:300;}
  .notif-contact-row{display:flex;gap:8px;margin-bottom:8px;}
  .notif-contact-type{padding:7px 12px;border-radius:8px;font-size:10px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;border:1.5px solid var(--sand-dark);background:transparent;color:var(--mid);transition:all 0.15s;}
  .notif-contact-type.active{background:var(--teal);border-color:var(--teal);color:white;}
  .notif-actions{display:flex;gap:8px;align-items:center;}
  .notif-skip{background:none;border:none;font-size:11px;color:var(--light);cursor:pointer;font-family:'Jost',sans-serif;text-decoration:underline;text-underline-offset:3px;}
  .btn-notif-save{flex:1;padding:11px;background:var(--teal);color:white;border:none;border-radius:10px;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;}
  .btn-notif-save:disabled{opacity:0.5;cursor:not-allowed;}

  @media(min-width:801px){
    .app-header{padding:0 32px;}
    .app-nav{padding:0 32px;}
    .page-hero{padding:48px 40px 40px;}
    .page-hero-title{font-size:48px;}
    .page-body{padding:36px 40px 60px;}
    .whos-body{padding:32px 40px 60px;}
    .photos-body{padding:36px 40px 60px;}
    .cal-main{padding:28px 28px;}
    .cal-cell{min-height:100px;}
    .stay-bar{height:20px;font-size:10px;}
    .cell-date{font-size:12px;}
    .fav-cat-strip{padding:0 40px;}
    .fav-content{padding:28px 40px 0;}
    .people-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));}
    .photos-house-grid{grid-template-rows:300px 200px;}
  }
  @media(max-width:800px){
    .cal-page{grid-template-columns:1fr;}
    .cal-sidebar{display:none;}
    .photos-house-grid{grid-template-columns:1fr;grid-template-rows:auto;}
    .ph-main{grid-row:auto;}
    .fav-grid{grid-template-columns:1fr;}
    .modal{padding:20px;}
    .notif-modal{padding:24px 18px 20px;}
  }
`;

function Toast({msg}){return <div className={`toast ${msg?"show":""}`}>{msg}</div>;}

function WeatherCard(){
  const [wx,setWx]=useState(null);
  useEffect(()=>{
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&timezone=America/New_York")
      .then(r=>r.json()).then(d=>setWx(d.current)).catch(()=>{});
  },[]);
  if(!wx)return null;
  return(
    <div className="weather-card">
      <div className="weather-loc">Key West Today</div>
      <div className="weather-main">
        <div className="weather-temp">{Math.round(wx.temperature_2m)}°</div>
        <div className="weather-icon">{WX[wx.weathercode]||"🌤️"}</div>
      </div>
      <div className="weather-desc">Wind {Math.round(wx.windspeed_10m)} mph</div>
      <div className="weather-vibe">{VIBES[wx.weathercode]||"Beautiful Key West day."}</div>
    </div>
  );
}

function SidebarPhoto(){
  const [idx,setIdx]=useState(0);
  const p=HOUSE_PHOTOS[idx];
  return(
    <div className="sb-photo" onClick={()=>setIdx(i=>(i+1)%HOUSE_PHOTOS.length)}>
      <img src={p.src} alt={p.label}/>
      <div className="sb-photo-overlay"/>
      <div className="sb-photo-label">{p.label}</div>
      <div className="sb-photo-nav">
        {HOUSE_PHOTOS.map((_,i)=>(
          <div key={i} className={`sb-photo-dot ${i===idx?"active":""}`} onClick={e=>{e.stopPropagation();setIdx(i);}}/>
        ))}
      </div>
    </div>
  );
}

function GateScreen({onEnter}){
  const [code,setCode]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const enter=async()=>{
    if(!code.trim())return;
    setLoading(true);setErr("");
    try{await api("passkey",{method:"POST",body:JSON.stringify({passkey:code.trim()})});onEnter();}
    catch{setErr("That's not it — try again.");}
    finally{setLoading(false);}
  };
  return(
    <div className="gate">
      <div className="gate-bg" style={{backgroundImage:`url(${pool_exterior})`}}/>
      <div className="gate-overlay"/>
      <div className="gate-card">
        <div className="gate-palm">🌴</div>
        <div className="gate-title"><em>Casa</em><br/>Kallman</div>
        <div className="gate-sub">Key West · Sunset Key</div>
        <label className="gate-label">Passkey</label>
        <input className="gate-input" type="password" placeholder="· · · · · · · ·" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&enter()} autoFocus/>
        {err&&<div className="gate-error">{err}</div>}
        <button className="gate-btn" onClick={enter} disabled={loading}>{loading?"...":"Enter"}</button>
      </div>
    </div>
  );
}

// ── NOTIFICATION MODAL ────────────────────────────────────────────────────────
function NotificationModal({onDismiss}){
  const [stayAlerts,setStayAlerts]=useState(true);
  const [flightReminders,setFlightReminders]=useState(false);
  const [contact,setContact]=useState("");
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const save=async()=>{
    if(!contact.trim())return;
    setSaving(true);
    try{
      await api("subscribe",{method:"POST",body:JSON.stringify({contact:contact.trim(),contactType:"email",stayAlerts,flightReminders})});
      setDone(true);
      setTimeout(onDismiss,2000);
    }catch{onDismiss();}
    finally{setSaving(false);}
  };
  if(done)return(
    <div className="modal-overlay">
      <div className="notif-modal" style={{textAlign:"center"}}>
        <div style={{fontSize:38,marginBottom:12}}>🌴</div>
        <div className="notif-title">You're in.</div>
        <div className="notif-sub">Check your inbox for a welcome note.</div>
      </div>
    </div>
  );
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onDismiss()}>
      <div className="notif-modal">
        <button className="notif-dismiss" onClick={onDismiss}>×</button>
        <div className="notif-icon">🔔</div>
        <div className="notif-title">Stay in the loop</div>
        <div className="notif-sub">Get a nudge when someone plans a visit or your trip is coming up.</div>
        <div className="notif-options">
          <div className={`notif-option ${stayAlerts?"selected":""}`} onClick={()=>setStayAlerts(v=>!v)}>
            <div className="notif-option-check">{stayAlerts?"✓":""}</div>
            <div><div className="notif-option-text">Stay alerts</div><div className="notif-option-desc">When someone adds or changes a visit</div></div>
          </div>
          <div className={`notif-option ${flightReminders?"selected":""}`} onClick={()=>setFlightReminders(v=>!v)}>
            <div className="notif-option-check">{flightReminders?"✓":""}</div>
            <div><div className="notif-option-text">Trip reminders</div><div className="notif-option-desc">A nudge a few days before your stay</div></div>
          </div>
        </div>
        <div className="field-group" style={{marginBottom:14}}>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="your@email.com"
            value={contact} onChange={e=>setContact(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()}/>
        </div>
        <div className="notif-actions">
          <button className="notif-skip" onClick={onDismiss}>Maybe later</button>
          <button className="btn-notif-save" onClick={save} disabled={saving||!contact.trim()}>{saving?"Saving...":"Sign me up"}</button>
        </div>
      </div>
    </div>
  );
}

// ── STAY MODAL ────────────────────────────────────────────────────────────────
function StayModal({stay,knownPeople,onClose,onSave,onDelete}){
  const isEdit=!!stay?.id;
  const td=today();
  const [name,setName]=useState(stay?.name||"");
  const [start,setStart]=useState(stay?.start||td);
  const [end,setEnd]=useState(stay?.end||td);
  const [note,setNote]=useState(stay?.note||"");
  const [color,setColor]=useState(stay?.color||DEFAULT_COLOR);
  const [sendAlerts,setSendAlerts]=useState(stay?.sendAlerts!==false);
  const [isSurprise,setIsSurprise]=useState(stay?.isSurprise||false);
  const [flightNum,setFlightNum]=useState(stay?.flightNum||"");
  const [flightArr,setFlightArr]=useState(stay?.flightArr||"");
  const [showFlight,setShowFlight]=useState(!!(stay?.flightNum||stay?.flightArr));
  const [loading,setLoading]=useState(false);
  const onNameChange=val=>{
    setName(val);
    const k=knownPeople.find(p=>p.name.toLowerCase()===val.toLowerCase());
    if(k)setColor(k.color);
  };
  const save=async()=>{
    if(!name.trim()||!start||!end)return;
    if(end<start){alert("End date needs to be after start.");return;}
    setLoading(true);
    try{await onSave({name:name.trim(),start,end,note,color,id:stay?.id,sendAlerts,isSurprise,flightNum:flightNum.trim(),flightArr:flightArr.trim()});onClose();}
    finally{setLoading(false);}
  };
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit?"Edit Stay":"Add Stay"}</div>
        <div className="field-group">
          <label className="field-label">Whose stay?</label>
          <input className="field-input" value={name} onChange={e=>onNameChange(e.target.value)} placeholder="Name" autoFocus/>
          {knownPeople.length>0&&!isEdit&&(
            <div className="name-suggestions">
              {knownPeople.filter(p=>!name||p.name.toLowerCase().startsWith(name.toLowerCase())).slice(0,8).map(p=>(
                <button key={p.name} className="name-chip" onClick={()=>{setName(p.name);setColor(p.color);}}>{p.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="field-group" style={{display:"flex",gap:10}}>
          <div style={{flex:1}}><label className="field-label">Arriving</label><input className="field-input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></div>
          <div style={{flex:1}}><label className="field-label">Leaving</label><input className="field-input" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div>
        </div>
        <div className="field-group">
          <label className="field-label">Note (optional)</label>
          <input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Bringing friends, celebrating something..."/>
        </div>
        <div className="field-group">
          <label className="field-label">Color</label>
          <div className="color-row">{COLORS.map(c=><div key={c.id} className={`color-dot ${color===c.hex?"sel":""}`} style={{background:c.hex}} onClick={()=>setColor(c.hex)}/>)}</div>
        </div>

        <div className="section-divider"/>

        {/* Flight details */}
        <div className="field-group">
          <div className="toggle-row" onClick={()=>setShowFlight(v=>!v)} style={{marginBottom:showFlight?10:0}}>
            <div className={`toggle-check ${showFlight?"on":""}`}>{showFlight?"✓":""}</div>
            <div><div className="toggle-label">✈️ Add flight details</div><div className="toggle-desc">Optional — helps with trip reminders</div></div>
          </div>
          {showFlight&&(
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <div style={{flex:1}}><label className="field-label">Flight number</label><input className="field-input" value={flightNum} onChange={e=>setFlightNum(e.target.value)} placeholder="AA 1234"/></div>
              <div style={{flex:1}}><label className="field-label">Arrival time</label><input className="field-input" type="time" value={flightArr} onChange={e=>setFlightArr(e.target.value)}/></div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="field-group">
          <div className="toggle-row" onClick={()=>setSendAlerts(v=>!v)}>
            <div className={`toggle-check ${sendAlerts?"on":""}`}>{sendAlerts?"✓":""}</div>
            <div><div className="toggle-label">📬 Let the family know</div><div className="toggle-desc">Send an alert to anyone signed up for notifications</div></div>
          </div>
        </div>

        <div className="modal-actions">
          {isEdit&&<button className="btn-remove" onClick={async()=>{if(window.confirm("Remove?")){{await onDelete(stay.id);onClose();}}}}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={loading}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({stay,onClose,onEdit,onDelete}){
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14}}>
          <div style={{width:10,height:10,borderRadius:3,background:stay.color||DEFAULT_COLOR,flexShrink:0,marginTop:6}}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:"var(--teal)"}}>{stay.isSurprise?"🤫 Surprise visit":stay.name}</div>
            <div style={{fontSize:13,color:"var(--mid)",fontWeight:300}}>{fmtLong(stay.start)} — {fmtLong(stay.end)}</div>
            {stay.flightNum&&<div style={{fontSize:12,color:"var(--light)",fontWeight:300,marginTop:4}}>✈️ {stay.flightNum}{stay.flightArr?" · arrives "+stay.flightArr:""}</div>}
          </div>
        </div>
        {stay.note&&<div style={{background:"var(--seafoam)",padding:"10px 14px",borderRadius:10,fontSize:13,color:"var(--mid)",fontStyle:"italic",fontWeight:300,marginBottom:4}}>"{stay.note}"</div>}
        <div className="modal-actions">
          <button className="btn-remove" onClick={async()=>{if(window.confirm("Remove?")){{await onDelete(stay.id);onClose();}}}}>Remove</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button className="btn-save" onClick={()=>{onClose();onEdit(stay);}}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── FAVORITES MODAL ───────────────────────────────────────────────────────────
function FavModal({fav,onClose,onSave}){
  const isEdit=!!fav?.id;
  const [name,setName]=useState(fav?.name||"");
  const [category,setCategory]=useState(fav?.category||"Restaurant");
  const [note,setNote]=useState(fav?.note||"");
  const [link,setLink]=useState(fav?.link||"");
  const [loading,setLoading]=useState(false);
  const save=async()=>{
    if(!name.trim())return;
    setLoading(true);
    try{await onSave({id:fav?.id,name:name.trim(),category,note,link:link.trim()});onClose();}
    finally{setLoading(false);}
  };
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit?"Edit Spot":"Add a Spot"}</div>
        <div className="field-group">
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Blue Heaven, Fort Zach..." autoFocus/>
        </div>
        <div className="field-group">
          <label className="field-label">Category</label>
          <div className="cat-selector">
            {FAV_CATEGORIES.map(c=>(
              <button key={c} className={`cat-opt ${category===c?"sel":""}`} onClick={()=>setCategory(c)}>{FAV_ICONS[c]} {c}</button>
            ))}
          </div>
        </div>
        <div className="field-group">
          <label className="field-label">Notes</label>
          <input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Get the lobster benedict, go early..."/>
        </div>
        <div className="field-group">
          <label className="field-label">Link (optional)</label>
          <input className="field-input" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://..."/>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={loading||!name.trim()}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── FAVORITES PAGE ────────────────────────────────────────────────────────────
function FavCard({fav,onEdit,onDelete,isPlaceholder}){
  const accent=ACCENT_CLASS[fav.category]||"";
  return(
    <div className={`fav-card${isPlaceholder?" placeholder":""}`} onClick={isPlaceholder?onEdit:undefined}>
      <div className={`fav-card-accent ${accent}`}/>
      <div className="fav-card-body">
        <div className="fav-card-top">
          <div style={{display:"flex",alignItems:"center",gap:7,flex:1,minWidth:0}}>
            <span className="fav-icon">{FAV_ICONS[fav.category]||"📍"}</span>
            <div className="fav-name">{fav.name}</div>
          </div>
          {!isPlaceholder&&<div className="fav-cat-badge">{fav.category}</div>}
        </div>
        {fav.note&&<div className="fav-note">{fav.note}</div>}
        {isPlaceholder&&<div className="fav-placeholder-tag">Tap to add →</div>}
        {!isPlaceholder&&(
          <div className="fav-card-footer">
            {fav.link?<a className="fav-link" href={fav.link} target="_blank" rel="noopener noreferrer">Open ↗</a>:<span/>}
            <div className="fav-card-actions">
              <button className="fav-action-btn" onClick={onEdit}>Edit</button>
              <button className="fav-action-btn del" onClick={()=>{if(window.confirm("Remove this spot?"))onDelete(fav.id);}}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FavoritesPage({showToast,setFavModal}){
  const [favs,setFavs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [activecat,setActivecat]=useState("All");

  const fetchFavs=useCallback(async()=>{
    try{const d=await api("favorites");setFavs(d.favorites||[]);}
    catch{}finally{setLoading(false);}
  },[]);
  useEffect(()=>{fetchFavs();},[fetchFavs]);

  const handleSave=async(fav)=>{
    try{
      if(fav.id){await api(`favorites/${fav.id}`,{method:"PUT",body:JSON.stringify(fav)});showToast("Updated!");}
      else{await api("favorites",{method:"POST",body:JSON.stringify(fav)});showToast("Added!");}
      fetchFavs();
    }catch{showToast("Something went wrong.");}
  };
  const handleDelete=async(id)=>{
    try{await api(`favorites/${id}`,{method:"DELETE"});showToast("Removed.");fetchFavs();}
    catch{showToast("Could not remove.");}
  };
  const openAdd=(prefill=null)=>setFavModal({fav:prefill?{name:prefill.name,category:prefill.category,note:prefill.note,link:prefill.link||""}:null,onSave:handleSave});
  const openEdit=(f)=>setFavModal({fav:f,onSave:handleSave});

  // Always show all 6 category tabs
  const allTabs=["All",...FAV_CATEGORIES];
  const realFavs=activecat==="All"?favs:favs.filter(f=>f.category===activecat);

  // For "All" view group by category; show placeholders for empty categories
  const sections=FAV_CATEGORIES.map(cat=>{
    const real=favs.filter(f=>f.category===cat);
    const placeholders=real.length===0?(FAV_PLACEHOLDERS[cat]||[]).slice(0,2).map((p,i)=>({...p,id:`ph_${cat}_${i}`,category:cat})):[];
    return{cat,real,placeholders};
  }).filter(s=>activecat==="All"||s.cat===activecat);

  return(
    <div>
      <div className="page-hero" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16}}>
        <div>
          <div className="page-hero-title">Local Favorites</div>
          <div className="page-hero-sub">The Kallman guide to Key West</div>
        </div>
        <button className="fav-add-btn" style={{marginBottom:4,flexShrink:0}} onClick={openAdd}>+ Add a spot</button>
      </div>
      <div className="fav-body">
        <div className="fav-cat-strip">
          <div className="fav-strip-inner">
            {allTabs.map(c=>{
              const count=c==="All"?favs.length:favs.filter(f=>f.category===c).length;
              return(
                <button key={c} className={`fav-cat-tab ${activecat===c?"active":""}`} onClick={()=>setActivecat(c)}>
                  {c==="All"?"All":<>{FAV_ICONS[c]} {c}</>}
                  <span className="fav-cat-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="fav-content">
          {loading?(
            <div style={{textAlign:"center",padding:"40px 0",color:"var(--light)",fontSize:13,fontStyle:"italic"}}>Loading...</div>
          ):(
            sections.map(({cat,real,placeholders})=>(
              <div key={cat} style={{marginBottom:28}}>
                <div className="fav-section-label">{FAV_ICONS[cat]} {cat}</div>
                {real.length>0&&<div className="fav-grid" style={{marginBottom:placeholders.length?10:0}}>
                  {real.map(f=><FavCard key={f.id} fav={f} onEdit={()=>openEdit(f)} onDelete={handleDelete} isPlaceholder={false}/>)}
                </div>}
                {placeholders.length>0&&(
                  <>
                    {real.length>0&&<div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--light)",margin:"8px 0 8px"}}>Suggestions — add your own</div>}
                    {real.length===0&&<div style={{fontSize:9,letterSpacing:"1.5px",textTransform:"uppercase",color:"var(--light)",marginBottom:8}}>Suggestions — add your own</div>}
                    <div className="fav-grid">
                      {placeholders.map(f=><FavCard key={f.id} fav={f} onEdit={()=>openAdd(f)} onDelete={()=>{}} isPlaceholder={true}/>)}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────────────────────
function CalendarPage({stays,knownPeople,onSave,onDelete,showToast}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [addModal,setAddModal]=useState(false);
  const [editStay,setEditStay]=useState(null);
  const [detailStay,setDetailStay]=useState(null);
  const td=today();
  const firstDay=new Date(year,month,1).getDay();
  const dim=daysInMonth(year,month);
  const prevDim=daysInMonth(year,month===0?11:month-1);
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevDim-i,cur:false});
  for(let i=1;i<=dim;i++)cells.push({day:i,cur:true});
  while(cells.length%7!==0)cells.push({day:cells.length-dim-firstDay+1,cur:false});
  const cellStays={};
  stays.forEach(stay=>{
    cells.forEach((cell,idx)=>{
      if(!cell.cur)return;
      const cellDate=ds(year,month,cell.day);
      if(cellDate<stay.start||cellDate>stay.end)return;
      const isStart=cellDate===stay.start,isEnd=cellDate===stay.end;
      const col=idx%7;
      let pos="mid";
      if(isStart&&isEnd)pos="single";
      else if(isStart)pos="start";
      else if(isEnd)pos="end";
      if(pos==="mid"&&col===0)pos="start";
      if(pos==="mid"&&col===6)pos="end";
      if(pos==="start"&&col===6)pos="single";
      if(!cellStays[idx])cellStays[idx]=[];
      cellStays[idx].push({stay,pos});
    });
  });
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const atHouse=stays.filter(s=>s.start<=td&&s.end>=td);
  const upcoming=stays.filter(s=>s.start>td).sort((a,b)=>a.start.localeCompare(b.start)).slice(0,8);
  return(
    <div className="cal-page">
      <div className="cal-main">
        <div className="cal-watermark">{MONTH_NAMES[month]}</div>
        <div className="cal-header">
          <div className="cal-nav">
            <button className="btn-nav" onClick={prev}>‹</button>
            <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
            <button className="btn-nav" onClick={next}>›</button>
          </div>
          <button className="btn-add-stay" onClick={()=>setAddModal(true)}>+ Add Stay</button>
        </div>
        <div className="cal-day-labels">{DAY_NAMES.map(d=><div key={d} className="day-label">{d}</div>)}</div>
        <div className="cal-grid">
          {cells.map((cell,i)=>{
            const cellDate=cell.cur?ds(year,month,cell.day):null;
            const isToday=cellDate===td;
            const segs=cellStays[i]||[];
            const isEmpty=cell.cur&&segs.length===0;
            return(
              <div key={i} className={`cal-cell ${!cell.cur?"other-month":""} ${isToday?"is-today":""} ${isEmpty?"is-empty":""}`}>
                <div className="cell-date">{cell.day}</div>
                <div className="stay-bars">
                  {segs.slice(0,3).map(({stay,pos},si)=>(
                    <div key={stay.id+si} className={`stay-bar bar-${pos}`} style={{background:stay.color||DEFAULT_COLOR}} onClick={()=>setDetailStay(stay)}>
                      <span className="bar-name">{stay.isSurprise?"🤫":stay.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="cal-sidebar">
        <SidebarPhoto/>
        <div className="sb-content">
          <WeatherCard/>
          <div className="sb-section">
            <div className="sb-label">At the house</div>
            {atHouse.length===0?<div className="sb-empty">Nobody home 🌴</div>:atHouse.map(s=>(
              <div key={s.id} className="home-card">
                <div className="home-dot" style={{background:s.color||DEFAULT_COLOR}}/>
                <div>
                  <div className="home-name">{s.isSurprise?"🤫 Surprise":s.name}</div>
                  <div className="home-dates">{fmt(s.start)} — {fmt(s.end)}</div>
                  {s.note&&<div style={{fontSize:11,color:"var(--mid)",fontStyle:"italic",fontWeight:300,marginTop:2}}>{s.note}</div>}
                  <div className="home-here">Here now</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sb-section">
            <div className="sb-label">Coming up</div>
            {upcoming.length===0?<div className="sb-empty">Nothing planned</div>:upcoming.map(s=>(
              <div key={s.id} className="coming-item">
                <div className="coming-dot" style={{background:s.color||DEFAULT_COLOR}}/>
                <div>
                  <div className="coming-name">{s.isSurprise?"🤫 Surprise":s.name}</div>
                  <div className="coming-dates">{fmt(s.start)} — {fmt(s.end)}</div>
                  {s.flightNum&&<div className="coming-note">✈️ {s.flightNum}</div>}
                  {s.note&&<div className="coming-note">{s.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {addModal&&<StayModal knownPeople={knownPeople} onClose={()=>setAddModal(false)} onSave={async s=>{await onSave(s);showToast("Stay added!");}} onDelete={onDelete}/>}
      {editStay&&<StayModal stay={editStay} knownPeople={knownPeople} onClose={()=>setEditStay(null)} onSave={async s=>{await onSave(s);showToast("Updated!");}} onDelete={async id=>{await onDelete(id);showToast("Removed.");}}/>}
      {detailStay&&<DetailModal stay={detailStay} onClose={()=>setDetailStay(null)} onEdit={s=>{setDetailStay(null);setEditStay(s);}} onDelete={async id=>{await onDelete(id);setDetailStay(null);showToast("Removed.");}}/>}
    </div>
  );
}

function getStoredPhoto(name){try{return JSON.parse(localStorage.getItem("ck_photos")||"{}")[name]||null;}catch{return null;}}
function savePhoto(name,src){try{const p=JSON.parse(localStorage.getItem("ck_photos")||"{}");p[name]=src;localStorage.setItem("ck_photos",JSON.stringify(p));}catch{}}
function PersonAvatar({name,color}){
  const [photo,setPhoto]=useState(()=>getStoredPhoto(name));
  const inputRef=useRef();
  const handleFile=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{savePhoto(name,ev.target.result);setPhoto(ev.target.result);};
    reader.readAsDataURL(file);
  };
  return(
    <div className="person-card-top" style={{background:`linear-gradient(135deg,${color}22,${color}44)`}}>
      <div className="person-av-wrap" onClick={()=>inputRef.current?.click()} title="Click to add photo">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
        {photo
          ?<img className="person-av-img" src={photo} alt={name}/>
          :<div style={{width:48,height:48,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:500,color:"white",border:"2px solid rgba(255,255,255,0.4)"}}>{name[0]?.toUpperCase()}</div>
        }
        <div className="person-av-overlay">📷</div>
      </div>
    </div>
  );
}
function WhoAvatar({name,color}){
  const [photo]=useState(()=>getStoredPhoto(name));
  if(photo)return<img src={photo} alt={name} style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:`2px solid ${color}`}}/>;
  return<div style={{width:42,height:42,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:500,color:"white",flexShrink:0}}>{name[0]?.toUpperCase()}</div>;
}

function WhoCard({stay,now}){
  const [note,setNote]=useState(()=>{try{return JSON.parse(localStorage.getItem("ck_notes")||"{}")[stay.name]||"";}catch{return "";}});
  const [editing,setEditing]=useState(false);
  const saveNote=val=>{setNote(val);try{const a=JSON.parse(localStorage.getItem("ck_notes")||"{}");a[stay.name]=val;localStorage.setItem("ck_notes",JSON.stringify(a));}catch{}setEditing(false);};
  return(
    <div style={{background:"var(--white)",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:12,border:`1px solid ${now?"var(--teal-light)":"var(--sand-mid)"}`,boxShadow:now?"0 3px 16px rgba(46,155,127,0.1)":"none"}}>
      <WhoAvatar name={stay.name} color={stay.color||DEFAULT_COLOR}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
          <div style={{fontSize:15,fontWeight:400}}>{stay.name}</div>
          {now&&<span style={{fontSize:9,background:"rgba(46,155,127,0.12)",color:"var(--teal)",padding:"2px 7px",borderRadius:20}}>Here now</span>}
        </div>
        <div style={{fontSize:12,color:"var(--light)",fontWeight:300}}>{fmt(stay.start)} — {fmt(stay.end)}</div>
        {stay.flightNum&&<div style={{fontSize:11,color:"var(--light)",fontWeight:300,marginTop:2}}>✈️ {stay.flightNum}{stay.flightArr?" · arrives "+stay.flightArr:""}</div>}
        {stay.note&&<div style={{fontSize:12,color:"var(--mid)",fontStyle:"italic",fontWeight:300,marginTop:2}}>{stay.note}</div>}
        {editing
          ?<textarea defaultValue={note} rows={2} style={{width:"100%",marginTop:6,fontSize:12,fontStyle:"italic",color:"var(--mid)",background:"var(--sand)",border:"none",borderRadius:7,padding:"6px 8px",fontFamily:"'Jost',sans-serif",fontWeight:300,outline:"1.5px solid var(--teal-mid)",resize:"none"}}
              onBlur={e=>saveNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&e.currentTarget.blur()} autoFocus/>
          :<div onClick={()=>setEditing(true)} style={{marginTop:6,fontSize:12,color:note?"var(--mid)":"var(--light)",fontStyle:"italic",fontWeight:300,cursor:"pointer"}}>{note||"Add a note…"}</div>
        }
      </div>
    </div>
  );
}

function WhosThereTab({stays}){
  const td=today();
  const all=stays.filter(s=>s.end>=td).sort((a,b)=>a.start.localeCompare(b.start));
  const atHouse=all.filter(s=>s.start<=td);
  const upcoming=all.filter(s=>s.start>td);
  return(
    <div>
      <div className="page-hero"><div className="page-hero-title">Who's There</div><div className="page-hero-sub">At the house and coming up</div></div>
      <div className="whos-body">
        {atHouse.length>0&&<div style={{marginBottom:28}}><div style={{fontSize:9,fontWeight:400,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--light)",marginBottom:12}}>At the house now</div>{atHouse.map(s=><WhoCard key={s.id} stay={s} now={true}/>)}</div>}
        {upcoming.length>0&&<div><div style={{fontSize:9,fontWeight:400,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--light)",marginBottom:12}}>Coming up</div>{upcoming.map(s=><WhoCard key={s.id} stay={s} now={false}/>)}</div>}
        {all.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"var(--light)"}}><div style={{fontSize:36,marginBottom:10}}>🌴</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"var(--teal)",marginBottom:4}}>All clear</div><div style={{fontSize:13,fontWeight:300}}>Nothing planned yet.</div></div>}
      </div>
    </div>
  );
}

function PeoplePage({stays}){
  const td=today();
  const [notes,setNotes]=useState({});
  const [editingNote,setEditingNote]=useState(null);
  const peopleMap={};
  stays.forEach(s=>{
    if(!peopleMap[s.name])peopleMap[s.name]={name:s.name,color:s.color||DEFAULT_COLOR,stays:[]};
    peopleMap[s.name].stays.push(s);
    peopleMap[s.name].color=s.color||peopleMap[s.name].color;
  });
  const people=Object.values(peopleMap).sort((a,b)=>a.name.localeCompare(b.name));
  const saveNote=(name,val)=>{const n={...notes,[name]:val};setNotes(n);localStorage.setItem("ck_notes",JSON.stringify(n));setEditingNote(null);};
  useEffect(()=>{try{const n=JSON.parse(localStorage.getItem("ck_notes")||"{}");setNotes(n);}catch{};},[]);
  return(
    <div>
      <div className="page-hero"><div className="page-hero-title">Profiles</div><div className="page-hero-sub">People who've been to the house</div></div>
      <div className="page-body">
        {people.length===0
          ?<div style={{textAlign:"center",padding:"60px 0",color:"var(--light)"}}><div style={{fontSize:36,marginBottom:10}}>🌴</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:"var(--teal)",marginBottom:4}}>No stays yet</div><div style={{fontSize:13,fontWeight:300}}>Add a stay to get started.</div></div>
          :<div className="people-grid">{people.map(p=>{
            const upcomingStays=p.stays.filter(s=>s.end>=td).sort((a,b)=>a.start.localeCompare(b.start));
            const pastStays=p.stays.filter(s=>s.end<td);
            const note=notes[p.name]||"";
            const isEditing=editingNote===p.name;
            return(
              <div key={p.name} className="person-card">
                <PersonAvatar name={p.name} color={p.color}/>
                <div className="person-card-body">
                  <div className="person-name">{p.name}</div>
                  <div className="person-meta">{upcomingStays.length>0?`Next: ${fmt(upcomingStays[0].start)}`:(pastStays.length>0?`Last: ${fmt(pastStays[pastStays.length-1].start)}`:"No visits yet")}</div>
                  {isEditing?<textarea className="person-note-input" defaultValue={note} rows={2} onBlur={e=>saveNote(p.name,e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&e.currentTarget.blur()} autoFocus/>:<div className="person-note" onClick={()=>setEditingNote(p.name)}>{note||"Something about "+p.name+"…"}</div>}
                  {(upcomingStays.length>0||pastStays.length>0)&&<div className="person-stays">{[...upcomingStays.slice(0,2),...(upcomingStays.length===0?pastStays.slice(0,2):[])].map(s=><div key={s.id} className="person-stay-row"><div className="psr-dot" style={{background:p.color}}/>{fmt(s.start)} → {fmt(s.end)}{s.note&&<span style={{color:"var(--light)",fontStyle:"italic"}}> · {s.note}</span>}</div>)}</div>}
                </div>
              </div>
            );
          })}</div>
        }
      </div>
    </div>
  );
}

function PhotosPage({showToast}){
  const [memories,setMemories]=useState([]);
  const [dragging,setDragging]=useState(false);
  const inputRef=useRef();
  useEffect(()=>{try{const m=JSON.parse(localStorage.getItem("ck_memories")||"[]");setMemories(m);}catch{};},[]);
  const handleFiles=files=>{
    const arr=Array.from(files).filter(f=>f.type.startsWith("image/"));
    arr.forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>{
        const m={id:Date.now()+Math.random(),src:e.target.result,name:file.name.replace(/\.[^.]+$/,""),date:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"})};
        setMemories(prev=>{const u=[m,...prev];try{localStorage.setItem("ck_memories",JSON.stringify(u));}catch{showToast("Storage full.");}return u;});
      };
      reader.readAsDataURL(file);
    });
    if(arr.length)showToast(`${arr.length} photo${arr.length>1?"s":""} added!`);
  };
  const remove=id=>{const m=memories.filter(x=>x.id!==id);setMemories(m);try{localStorage.setItem("ck_memories",JSON.stringify(m));}catch{}};
  return(
    <div>
      <div className="page-hero"><div className="page-hero-title">Photos</div><div className="page-hero-sub">Memories from your visits and the house</div></div>
      <div className="photos-body">
        <div className="photos-section-title" style={{marginBottom:4}}>Memories</div>
        <div className="photos-section-sub">Add photos from your visits.</div>
        <div className={`upload-zone ${dragging?"drag-over":""}`} onClick={()=>inputRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}>
          <input ref={inputRef} className="upload-input" type="file" accept="image/*" multiple onChange={e=>handleFiles(e.target.files)}/>
          <div className="upload-icon">📷</div>
          <div className="upload-text">Drop photos here or click to upload</div>
          <div className="upload-sub">JPG, PNG, HEIC — any size</div>
        </div>
        {memories.length>0
          ?<div className="memory-grid">{memories.map(m=><div key={m.id} className="memory-card"><img src={m.src} alt={m.name}/><div className="memory-overlay"/><div className="memory-label">{m.name} · {m.date}</div><button className="memory-delete" onClick={()=>remove(m.id)}>×</button></div>)}</div>
          :<div style={{textAlign:"center",padding:"32px 0",color:"var(--light)"}}><div style={{fontSize:28,marginBottom:8}}>🏖️</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:"var(--teal)",marginBottom:3}}>No memories yet</div><div style={{fontSize:12,fontWeight:300}}>Upload photos from your visits.</div></div>
        }
        <div style={{marginTop:36}}>
          <div className="photos-section-title" style={{marginBottom:4}}>The House</div>
          <div className="photos-section-sub">16 Sunset Key Dr · Key West, Florida</div>
          <div className="photos-house-grid">
            <div className="ph-main"><img className="ph-img" src={pool_exterior} alt="Pool"/><div className="ph-label">Pool & Exterior</div></div>
            <div className="ph-cell"><img className="ph-img" src={veranda} alt="Veranda"/><div className="ph-label">The Veranda</div></div>
            <div className="ph-cell"><img className="ph-img" src={sunset_pool} alt="Sunset"/><div className="ph-label">Sunset</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("gate");
  const [tab,setTab]=useState("calendar");
  const [stays,setStays]=useState([]);
  const [toast,setToast]=useState("");
  const [showNotifModal,setShowNotifModal]=useState(false);
  const [favModal,setFavModal]=useState(null);
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const fetchStays=useCallback(async()=>{
    try{const d=await api("bookings");setStays((d.bookings||[]).map(b=>({...b,start:b.start||b.startDate,end:b.end||b.endDate})));}catch{}
  },[]);
  useEffect(()=>{if(sessionStorage.getItem("casa_ok")==="true")setScreen("app");},[]);
  useEffect(()=>{if(screen==="app")fetchStays();},[screen,fetchStays]);

  const handleEnter=()=>{
    sessionStorage.setItem("casa_ok","true");
    setScreen("app");
    if(!localStorage.getItem("ck_notif_dismissed"))setTimeout(()=>setShowNotifModal(true),600);
  };
  const handleSave=async stay=>{
    try{
      const body={name:stay.name,startDate:stay.start,endDate:stay.end,note:stay.note||"",color:stay.color,visibility:"family",
        sendAlerts:stay.sendAlerts,isSurprise:stay.isSurprise,flightNum:stay.flightNum||"",flightArr:stay.flightArr||""};
      if(stay.id)await api(`bookings/${stay.id}`,{method:"PUT",body:JSON.stringify(body)});
      else await api("bookings",{method:"POST",body:JSON.stringify(body)});
      fetchStays();
    }catch{showToast("Something went wrong.");}
  };
  const handleDelete=async id=>{try{await api(`bookings/${id}`,{method:"DELETE"});fetchStays();}catch{showToast("Could not remove.");}};
  const knownPeople=Object.values(stays.reduce((acc,s)=>{
    if(!acc[s.name])acc[s.name]={name:s.name,color:s.color||DEFAULT_COLOR};
    else acc[s.name].color=s.color||acc[s.name].color;
    return acc;
  },{})).sort((a,b)=>a.name.localeCompare(b.name));

  const dismissNotif=()=>{
    localStorage.setItem("ck_notif_dismissed","true"); // always mark dismissed on any close
    setShowNotifModal(false);
  };

  if(screen==="gate")return(<><style>{css}</style><GateScreen onEnter={handleEnter}/></>);

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <div className="app-header">
          <div className="app-brand">Casa Kallman<span className="app-badge">Sunset Key</span></div>
          <div className="header-btns">
            <button className="btn-alerts" onClick={()=>setShowNotifModal(true)}>🔔 Alerts</button>
            <button className="btn-exit" onClick={()=>{sessionStorage.removeItem("casa_ok");setScreen("gate");}}>Exit</button>
          </div>
        </div>
        <div className="app-nav">
          <button className={`nav-tab ${tab==="calendar"?"active":""}`} onClick={()=>setTab("calendar")}>Calendar</button>
          <button className={`nav-tab ${tab==="whos"?"active":""}`} onClick={()=>setTab("whos")}>Who's There</button>
          <button className={`nav-tab ${tab==="people"?"active":""}`} onClick={()=>setTab("people")}>Profiles</button>
          <button className={`nav-tab ${tab==="favorites"?"active":""}`} onClick={()=>setTab("favorites")}>Favorites</button>
          <button className={`nav-tab ${tab==="photos"?"active":""}`} onClick={()=>setTab("photos")}>Photos</button>
        </div>
        {tab==="calendar"&&<CalendarPage stays={stays} knownPeople={knownPeople} onSave={handleSave} onDelete={handleDelete} showToast={showToast}/>}
        {tab==="whos"&&<WhosThereTab stays={stays}/>}
        {tab==="people"&&<PeoplePage stays={stays}/>}
        {tab==="favorites"&&<FavoritesPage showToast={showToast} setFavModal={setFavModal}/>}
        {tab==="photos"&&<PhotosPage showToast={showToast}/>}
      </div>
      {favModal!==null&&<FavModal fav={favModal.fav} onClose={()=>setFavModal(null)} onSave={favModal.onSave}/>}
      {showNotifModal&&<NotificationModal onDismiss={dismissNotif}/>}
      <Toast msg={toast}/>
    </>
  );
}
