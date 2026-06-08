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

  .gate{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .gate-bg{position:absolute;inset:0;background-size:cover;background-position:center;animation:gzoom 20s ease-in-out infinite alternate;}
  @keyframes gzoom{from{transform:scale(1)}to{transform:scale(1.06)}}
  .gate-overlay{position:absolute;inset:0;background:linear-gradient(170deg,rgba(14,26,22,0.25) 0%,rgba(14,26,22,0.55) 55%,rgba(14,26,22,0.88) 100%);}
  .gate-card{position:relative;z-index:2;text-align:center;padding:56px 52px 48px;max-width:420px;width:92%;background:rgba(14,26,22,0.42);border:1px solid rgba(255,255,255,0.12);border-radius:24px;backdrop-filter:blur(20px);animation:riseIn 1s cubic-bezier(0.16,1,0.3,1);}
  @keyframes riseIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  .gate-palm{font-size:40px;margin-bottom:16px;animation:palmFloat 4s ease-in-out infinite;}
  @keyframes palmFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .gate-title{font-family:'Cormorant Garamond',serif;font-size:54px;font-weight:300;color:var(--white);line-height:0.93;letter-spacing:-1px;margin-bottom:6px;}
  .gate-title em{font-style:italic;}
  .gate-sub{font-size:12px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.42);margin-bottom:36px;}
  .gate-label{font-size:10px;font-weight:300;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.38);margin-bottom:10px;display:block;text-align:left;}
  .gate-input{width:100%;padding:14px 20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.16);border-radius:12px;font-size:20px;color:var(--white);letter-spacing:5px;text-align:center;outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;}
  .gate-input::placeholder{letter-spacing:2px;color:rgba(255,255,255,0.18);font-size:13px;}
  .gate-input:focus{border-color:rgba(91,191,163,0.6);}
  .gate-btn{width:100%;margin-top:12px;padding:14px;background:linear-gradient(135deg,var(--teal-mid),var(--teal-light));color:var(--white);border:none;border-radius:12px;font-size:11px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;box-shadow:0 6px 24px rgba(46,155,127,0.32);position:relative;overflow:hidden;}
  .gate-btn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(46,155,127,0.44);}
  .gate-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
  .gate-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.15),transparent 60%);background-size:200%;animation:shimmer 2.5s infinite;border-radius:12px;}
  @keyframes shimmer{0%{background-position:200%}100%{background-position:-200%}}
  .gate-error{margin-top:10px;font-size:13px;color:#ffb3b3;font-weight:300;}

  .app{min-height:100vh;display:flex;flex-direction:column;}
  .app-header{background:var(--ink);height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:100;}
  .app-brand{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:var(--white);display:flex;align-items:baseline;gap:10px;}
  .app-badge{font-size:9px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);padding:3px 8px;border:1px solid rgba(91,191,163,0.3);border-radius:20px;}
  .btn-exit{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;}
  .btn-exit:hover{background:rgba(255,255,255,0.14);color:white;}
  .app-nav{background:var(--ink);border-bottom:1px solid rgba(255,255,255,0.07);padding:0 32px;display:flex;}
  .nav-tab{padding:12px 18px;font-size:11px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;background:none;border-top:none;border-left:none;border-right:none;border-bottom:2px solid transparent;font-family:'Jost',sans-serif;}
  .nav-tab.active{color:var(--teal-light);border-bottom-color:var(--teal-light);}
  .nav-tab:hover:not(.active){color:rgba(255,255,255,0.7);}

  /* Page hero header */
  .page-hero{background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 60%,#3aab90 100%);padding:48px 40px 40px;}
  .page-hero-title{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:300;color:var(--white);margin-bottom:6px;}
  .page-hero-sub{font-size:13px;color:rgba(255,255,255,0.45);font-weight:300;letter-spacing:0.5px;}
  .page-body{padding:36px 40px 60px;max-width:960px;margin:0 auto;width:100%;}
  .whos-body{padding:32px 40px 60px;max-width:700px;margin:0 auto;width:100%;}
  .photos-body{padding:36px 40px 60px;max-width:1100px;margin:0 auto;width:100%;}

  /* Calendar */
  .cal-page{display:grid;grid-template-columns:1fr 300px;flex:1;}
  .cal-main{
    padding:28px 32px;
    background:
      radial-gradient(ellipse at 20% 0%, rgba(141,207,202,0.35) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(232,137,74,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 20%, rgba(91,164,207,0.18) 0%, transparent 45%),
      linear-gradient(160deg, #d4ede9 0%, #e8f7f5 30%, #f2ead8 70%, #ede4ce 100%);
    min-height:calc(100vh - 100px);
    position:relative;
  }
  .cal-watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond',serif;font-size:clamp(80px,14vw,180px);font-weight:300;font-style:italic;color:rgba(26,107,90,0.06);white-space:nowrap;pointer-events:none;letter-spacing:-4px;user-select:none;z-index:0;}
  .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;position:relative;z-index:1;}
  .cal-nav{display:flex;align-items:center;gap:14px;}
  .cal-month-title{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--teal);}
  .btn-nav{width:32px;height:32px;border-radius:50%;border:1.5px solid rgba(26,107,90,0.2);background:rgba(255,255,255,0.6);color:var(--teal);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
  .btn-nav:hover{background:var(--teal);color:white;border-color:var(--teal);}
  .btn-add-stay{padding:10px 22px;background:var(--sunset);color:white;border:none;border-radius:50px;font-size:11px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;box-shadow:0 4px 16px rgba(232,137,74,0.3);}
  .btn-add-stay:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,137,74,0.4);}
  .cal-day-labels{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px;position:relative;z-index:1;}
  .day-label{text-align:center;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);padding:6px 0;}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;position:relative;z-index:1;}
  .cal-cell{min-height:108px;background:rgba(253,250,246,0.96);border-radius:10px;padding:9px 7px 7px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.6);position:relative;overflow:hidden;transition:border-color 0.15s,box-shadow 0.2s,transform 0.15s;box-shadow:0 2px 12px rgba(0,0,0,0.18),0 1px 0 rgba(255,255,255,0.8) inset;}
  .cal-cell:hover{box-shadow:0 6px 24px rgba(0,0,0,0.28);transform:translateY(-1px);}
  .cal-cell.other-month{background:rgba(253,250,246,0.15);opacity:0.35;box-shadow:none;}
  .cal-cell.is-today{border-color:var(--teal-light);box-shadow:0 0 0 2px rgba(91,191,163,0.4),0 4px 16px rgba(0,0,0,0.2);}
  .cal-cell.is-empty::after{content:'🌴';position:absolute;bottom:5px;right:6px;font-size:15px;opacity:0.06;pointer-events:none;}
  .cell-date{font-size:12px;font-weight:400;color:var(--mid);margin-bottom:4px;line-height:1;}
  .is-today .cell-date{color:white;background:var(--teal-mid);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;}
  .stay-bars{display:flex;flex-direction:column;gap:3px;margin-top:3px;}
  .stay-bar{height:22px;display:flex;align-items:center;padding:0 8px;font-size:11px;font-weight:400;color:white;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity 0.15s,transform 0.1s;box-shadow:0 2px 6px rgba(0,0,0,0.2),0 1px 0 rgba(255,255,255,0.2) inset;letter-spacing:0.2px;position:relative;border-radius:4px;}
  .stay-bar:hover{opacity:0.85;transform:translateY(-1px);}
  .stay-bar.bar-start{border-radius:20px 4px 4px 20px;padding-left:11px;}
  .stay-bar.bar-mid{border-radius:0;margin-left:-3px;margin-right:-3px;padding:0 3px;}
  .stay-bar.bar-end{border-radius:4px 20px 20px 4px;margin-left:-3px;padding-right:11px;}
  .stay-bar.bar-single{border-radius:20px;}
  .stay-bar.bar-mid .bar-name,.stay-bar.bar-end .bar-name{display:none;}
  .more-chip{font-size:10px;color:var(--light);padding:2px 4px;font-weight:300;}

  /* Sidebar */
  .cal-sidebar{background:var(--white);border-left:1px solid var(--sand-mid);padding:0;overflow-y:auto;display:flex;flex-direction:column;}
  .sb-photo{height:160px;overflow:hidden;position:relative;flex-shrink:0;cursor:pointer;}
  .sb-photo img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s ease;}
  .sb-photo:hover img{transform:scale(1.04);}
  .sb-photo-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(14,26,22,0.6) 0%,transparent 60%);}
  .sb-photo-label{position:absolute;bottom:14px;left:16px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;font-weight:300;color:rgba(255,255,255,0.9);}
  .sb-photo-nav{position:absolute;bottom:14px;right:14px;display:flex;gap:5px;}
  .sb-photo-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);cursor:pointer;transition:background 0.2s;}
  .sb-photo-dot.active{background:white;}
  .sb-content{padding:20px 18px;flex:1;background:var(--white);}
  .sb-section{margin-bottom:24px;}
  .sb-label{font-size:10px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;color:var(--light);margin-bottom:12px;}
  .sb-empty{font-size:13px;color:var(--light);font-weight:300;font-style:italic;}
  .weather-card{background:var(--seafoam);border-radius:12px;padding:16px;margin-bottom:22px;}
  .weather-loc{font-size:10px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:var(--light);margin-bottom:8px;}
  .weather-main{display:flex;align-items:center;justify-content:space-between;}
  .weather-temp{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;color:var(--teal);line-height:1;}
  .weather-icon{font-size:32px;}
  .weather-desc{font-size:12px;color:var(--mid);font-weight:300;margin-top:5px;}
  .weather-vibe{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--teal);margin-top:5px;}
  .home-card{background:linear-gradient(135deg,rgba(168,221,208,0.2),rgba(245,239,227,0.4));border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;border-left:3px solid var(--teal-mid);}
  .home-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .home-name{font-size:14px;font-weight:400;margin-bottom:2px;}
  .home-dates{font-size:12px;color:var(--light);font-weight:300;}
  .home-here{font-size:10px;background:rgba(46,155,127,0.12);color:var(--teal);padding:2px 8px;border-radius:20px;display:inline-block;margin-top:4px;}
  .coming-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--sand-mid);align-items:flex-start;}
  .coming-item:last-child{border-bottom:none;}
  .coming-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .coming-name{font-size:13px;font-weight:400;margin-bottom:1px;}
  .coming-dates{font-size:11px;color:var(--light);font-weight:300;}
  .coming-note{font-size:11px;color:var(--mid);font-style:italic;margin-top:2px;font-weight:300;}

  /* People grid */
  .people-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
  .person-card{background:var(--white);border-radius:16px;overflow:hidden;border:1px solid var(--sand-mid);transition:box-shadow 0.2s,transform 0.2s;}
  .person-card:hover{box-shadow:0 8px 32px rgba(14,26,22,0.1);transform:translateY(-2px);}
  .person-card-top{height:80px;display:flex;align-items:center;justify-content:center;}
  .person-av{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:500;color:white;border:3px solid rgba(255,255,255,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
  .person-card-body{padding:16px;}
  .person-name{font-size:17px;font-weight:400;margin-bottom:3px;text-align:center;}
  .person-meta{font-size:12px;color:var(--light);font-weight:300;text-align:center;margin-bottom:12px;}
  .person-note{font-size:15px;color:var(--mid);font-style:italic;background:var(--sand);border-radius:8px;padding:10px 12px;margin-bottom:12px;font-weight:300;font-family:'Cormorant Garamond',serif;line-height:1.5;cursor:pointer;transition:background 0.2s;}
  .person-note:hover{background:var(--sand-mid);}
  .person-note-input{width:100%;font-size:14px;font-style:italic;color:var(--mid);background:var(--sand);border:none;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-weight:300;font-family:'Cormorant Garamond',serif;outline:1.5px solid var(--teal-mid);resize:none;}
  .person-stays{border-top:1px solid var(--sand-mid);padding-top:10px;}
  .person-stay-row{font-size:12px;color:var(--mid);padding:4px 0;border-bottom:1px solid rgba(232,220,200,0.5);font-weight:300;display:flex;align-items:center;gap:6px;}
  .person-stay-row:last-child{border-bottom:none;}
  .psr-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  .person-av-wrap{position:relative;width:56px;height:56px;margin:0 auto 12px;cursor:pointer;}
  .person-av-wrap input[type=file]{display:none;}
  .person-av-img{width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;border:3px solid rgba(255,255,255,0.5);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
  .person-av-overlay{position:absolute;inset:0;border-radius:50%;background:rgba(14,26,22,0.45);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;font-size:18px;}
  .person-av-wrap:hover .person-av-overlay{opacity:1;}

  /* Photos */
  .photos-house-grid{display:grid;grid-template-columns:1.6fr 1fr;grid-template-rows:340px 220px;gap:6px;border-radius:16px;overflow:hidden;margin-bottom:40px;}
  .ph-main{grid-row:1/3;position:relative;overflow:hidden;}
  .ph-cell{position:relative;overflow:hidden;}
  .ph-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.7s ease;}
  .ph-cell:hover .ph-img,.ph-main:hover .ph-img{transform:scale(1.04);}
  .ph-label{position:absolute;bottom:12px;left:14px;font-size:10px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.8);background:rgba(14,26,22,0.5);padding:4px 10px;border-radius:50px;backdrop-filter:blur(8px);}
  .photos-section-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:var(--teal);margin-bottom:6px;}
  .photos-section-sub{font-size:13px;color:var(--light);font-weight:300;margin-bottom:20px;}
  .upload-zone{border:2px dashed var(--sand-dark);border-radius:14px;padding:36px;text-align:center;background:rgba(253,250,246,0.6);cursor:pointer;transition:all 0.2s;margin-bottom:24px;}
  .upload-zone:hover,.upload-zone.drag-over{border-color:var(--teal-mid);background:var(--seafoam);}
  .upload-icon{font-size:36px;margin-bottom:10px;}
  .upload-text{font-size:14px;color:var(--mid);font-weight:300;}
  .upload-sub{font-size:12px;color:var(--light);font-weight:300;margin-top:4px;}
  .upload-input{display:none;}
  .memory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;}
  .memory-card{border-radius:12px;overflow:hidden;aspect-ratio:4/3;position:relative;background:var(--sand-mid);}
  .memory-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.5s;}
  .memory-card:hover img{transform:scale(1.06);}
  .memory-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(14,26,22,0.5),transparent);opacity:0;transition:opacity 0.2s;}
  .memory-card:hover .memory-overlay{opacity:1;}
  .memory-label{position:absolute;bottom:10px;left:12px;font-size:12px;color:white;font-weight:300;}
  .memory-delete{position:absolute;top:8px;right:8px;background:rgba(14,26,22,0.6);border:none;color:white;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;}
  .memory-card:hover .memory-delete{opacity:1;}

  /* Modal */
  .modal-overlay{position:fixed;inset:0;background:rgba(14,26,22,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn 0.2s;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--white);border-radius:20px;padding:36px;max-width:460px;width:94%;box-shadow:0 32px 80px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;color:var(--teal);margin-bottom:22px;}
  .field-group{margin-bottom:16px;}
  .field-label{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid);margin-bottom:8px;}
  .field-input{width:100%;padding:12px 15px;border:1.5px solid var(--sand-mid);border-radius:10px;font-size:15px;color:var(--ink);background:var(--white);outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;font-weight:300;}
  .field-input:focus{border-color:var(--teal-mid);}
  .color-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
  .color-dot{width:28px;height:28px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all 0.18s;}
  .color-dot.sel{border-color:var(--ink);transform:scale(1.2);}
  .color-dot:hover{transform:scale(1.1);}
  .name-suggestions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
  .name-chip{font-size:12px;padding:4px 12px;border-radius:20px;background:var(--sand-mid);color:var(--mid);cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.15s;border:none;}
  .name-chip:hover{background:var(--teal-mid);color:white;}
  .modal-actions{display:flex;gap:10px;margin-top:22px;justify-content:flex-end;}
  .btn-cancel{padding:10px 18px;background:none;border:1.5px solid var(--sand-dark);border-radius:8px;font-size:11px;cursor:pointer;color:var(--mid);font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;}
  .btn-cancel:hover{border-color:var(--teal-mid);color:var(--teal);}
  .btn-save{padding:10px 22px;background:var(--teal);color:white;border:none;border-radius:8px;font-size:11px;font-weight:400;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-save:hover{background:var(--teal-mid);}
  .btn-remove{padding:10px 18px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;margin-right:auto;transition:all 0.2s;letter-spacing:1px;text-transform:uppercase;}
  .btn-remove:hover{background:#fff0f0;}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--teal);color:white;padding:11px 26px;border-radius:50px;font-size:13px;z-index:2000;transition:transform 0.3s;pointer-events:none;white-space:nowrap;font-family:'Jost',sans-serif;}
  .toast.show{transform:translateX(-50%) translateY(0);}

  @media(max-width:800px){
    .cal-page{grid-template-columns:1fr;}
    .cal-sidebar{display:none;}
    .cal-main,.page-body,.whos-body,.photos-body{padding:16px;}
    .app-header,.app-nav{padding:0 16px;}
    .cal-cell{min-height:72px;}
    .photos-house-grid{grid-template-columns:1fr;grid-template-rows:auto;height:auto;}
    .ph-main{grid-row:auto;}
    .page-hero{padding:32px 20px 28px;}
    .page-hero-title{font-size:36px;}
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
    <div className="sb-photo" onClick={()=>setIdx(i=>(i+1)%HOUSE_PHOTOS.length)} title="Click to browse">
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

function StayModal({stay,knownPeople,onClose,onSave,onDelete}){
  const isEdit=!!stay?.id;
  const td=today();
  const [name,setName]=useState(stay?.name||"");
  const [start,setStart]=useState(stay?.start||td);
  const [end,setEnd]=useState(stay?.end||td);
  const [note,setNote]=useState(stay?.note||"");
  const [color,setColor]=useState(stay?.color||DEFAULT_COLOR);
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
    try{await onSave({name:name.trim(),start,end,note,color,id:stay?.id});onClose();}
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
        <div className="field-group" style={{display:"flex",gap:12}}>
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
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{width:12,height:12,borderRadius:3,background:stay.color||DEFAULT_COLOR,flexShrink:0}}/>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:400,color:"var(--teal)"}}>{stay.name}</div>
            </div>
            <div style={{fontSize:14,color:"var(--mid)",fontWeight:300}}>{fmtLong(stay.start)} — {fmtLong(stay.end)}</div>
          </div>
        </div>
        {stay.note&&<div style={{background:"var(--seafoam)",padding:"12px 16px",borderRadius:10,fontSize:14,color:"var(--mid)",fontStyle:"italic",fontWeight:300}}>"{stay.note}"</div>}
        <div className="modal-actions">
          <button className="btn-remove" onClick={async()=>{if(window.confirm("Remove?")){{await onDelete(stay.id);onClose();}}}}>Remove</button>
          <button className="btn-cancel" onClick={onClose}>Close</button>
          <button className="btn-save" onClick={()=>{onClose();onEdit(stay);}}>Edit</button>
        </div>
      </div>
    </div>
  );
}

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
                  {segs.map(({stay,pos},si)=>(
                    <div key={stay.id+si} className={`stay-bar bar-${pos}`} style={{background:stay.color||DEFAULT_COLOR}} onClick={()=>setDetailStay(stay)}>
                      <span className="bar-name">{stay.name}{stay.note?` · ${stay.note}`:""}</span>
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
            {atHouse.length===0?<div className="sb-empty">Nobody home right now 🌴</div>:atHouse.map(s=>(
              <div key={s.id} className="home-card">
                <div className="home-dot" style={{background:s.color||DEFAULT_COLOR}}/>
                <div>
                  <div className="home-name">{s.name}</div>
                  <div className="home-dates">{fmt(s.start)} — {fmt(s.end)}</div>
                  {s.note&&<div style={{fontSize:12,color:"var(--mid)",fontStyle:"italic",fontWeight:300,marginTop:2}}>{s.note}</div>}
                  <div className="home-here">Here now</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sb-section">
            <div className="sb-label">Coming up</div>
            {upcoming.length===0?<div className="sb-empty">Nothing planned yet</div>:upcoming.map(s=>(
              <div key={s.id} className="coming-item">
                <div className="coming-dot" style={{background:s.color||DEFAULT_COLOR}}/>
                <div>
                  <div className="coming-name">{s.name}</div>
                  <div className="coming-dates">{fmt(s.start)} — {fmt(s.end)}</div>
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

function WhoCard({stay,now}){
  const [note,setNote]=useState(()=>{try{return JSON.parse(localStorage.getItem("ck_notes")||"{}")[stay.name]||"";}catch{return "";}});
  const [editing,setEditing]=useState(false);
  const saveNote=val=>{
    setNote(val);
    try{const a=JSON.parse(localStorage.getItem("ck_notes")||"{}");a[stay.name]=val;localStorage.setItem("ck_notes",JSON.stringify(a));}catch{}
    setEditing(false);
  };
  return(
    <div style={{background:"var(--white)",borderRadius:14,padding:"18px 20px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:14,border:`1px solid ${now?"var(--teal-light)":"var(--sand-mid)"}`,boxShadow:now?"0 4px 20px rgba(46,155,127,0.1)":"none"}}>
      <WhoAvatar name={stay.name} color={stay.color||DEFAULT_COLOR}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <div style={{fontSize:16,fontWeight:400}}>{stay.name}</div>
          {now&&<span style={{fontSize:10,background:"rgba(46,155,127,0.12)",color:"var(--teal)",padding:"2px 8px",borderRadius:20}}>Here now</span>}
        </div>
        <div style={{fontSize:13,color:"var(--light)",fontWeight:300,marginBottom:stay.note?4:0}}>{fmt(stay.start)} — {fmt(stay.end)}</div>
        {stay.note&&<div style={{fontSize:13,color:"var(--mid)",fontStyle:"italic",fontWeight:300}}>{stay.note}</div>}
        {editing?(
          <textarea defaultValue={note} rows={2} style={{width:"100%",marginTop:8,fontSize:13,fontStyle:"italic",color:"var(--mid)",background:"var(--sand)",border:"none",borderRadius:8,padding:"8px 10px",fontFamily:"'Jost',sans-serif",fontWeight:300,outline:"1.5px solid var(--teal-mid)",resize:"none"}}
            onBlur={e=>saveNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&e.currentTarget.blur()} autoFocus/>
        ):(
          <div onClick={()=>setEditing(true)} style={{marginTop:8,fontSize:13,color:note?"var(--mid)":"var(--light)",fontStyle:"italic",fontWeight:300,cursor:"pointer",padding:"6px 0"}}>{note||"Add a note…"}</div>
        )}
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
      <div className="page-hero">
        <div className="page-hero-title">Who's There</div>
        <div className="page-hero-sub">At the house and coming up</div>
      </div>
      <div className="whos-body">
        {atHouse.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontSize:10,fontWeight:400,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--light)",marginBottom:14}}>At the house now</div>
            {atHouse.map(s=><WhoCard key={s.id} stay={s} now={true}/>)}
          </div>
        )}
        {upcoming.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:400,letterSpacing:"2.5px",textTransform:"uppercase",color:"var(--light)",marginBottom:14}}>Coming up</div>
            {upcoming.map(s=><WhoCard key={s.id} stay={s} now={false}/>)}
          </div>
        )}
        {all.length===0&&(
          <div style={{textAlign:"center",padding:"60px 0",color:"var(--light)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🌴</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"var(--teal)",marginBottom:6}}>All clear</div>
            <div style={{fontSize:14,fontWeight:300}}>Nothing planned yet — the house is waiting.</div>
          </div>
        )}
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
  const saveNote=(name,val)=>{
    const n={...notes,[name]:val};setNotes(n);
    localStorage.setItem("ck_notes",JSON.stringify(n));setEditingNote(null);
  };
  useEffect(()=>{try{const n=JSON.parse(localStorage.getItem("ck_notes")||"{}");setNotes(n);}catch{};},[]);
  return(
    <div>
      <div className="page-hero">
        <div className="page-hero-title">Profiles</div>
        <div className="page-hero-sub">People who've been to the house</div>
      </div>
      <div className="page-body">
        {people.length===0?(
          <div style={{textAlign:"center",padding:"60px 0",color:"var(--light)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🌴</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"var(--teal)",marginBottom:6}}>No stays yet</div>
            <div style={{fontSize:14,fontWeight:300}}>Add a stay from the calendar to get started.</div>
          </div>
        ):(
          <div className="people-grid">
            {people.map(p=>{
              const upcomingStays=p.stays.filter(s=>s.end>=td).sort((a,b)=>a.start.localeCompare(b.start));
              const pastStays=p.stays.filter(s=>s.end<td);
              const note=notes[p.name]||"";
              const isEditing=editingNote===p.name;
              return(
                <div key={p.name} className="person-card">
                  <PersonAvatar name={p.name} color={p.color}/>
                  <div className="person-card-body">
                    <div className="person-name">{p.name}</div>
                    <div className="person-meta">{upcomingStays.length>0?`Next up: ${fmt(upcomingStays[0].start)}`:(pastStays.length>0?`Last visited: ${fmt(pastStays[pastStays.length-1].start)}`:"No visits yet")}</div>
                    {isEditing?(
                      <textarea className="person-note-input" defaultValue={note} rows={2} onBlur={e=>saveNote(p.name,e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&e.currentTarget.blur()} autoFocus/>
                    ):(
                      <div className="person-note" onClick={()=>setEditingNote(p.name)}>{note||"Something about "+p.name+"…"}</div>
                    )}
                    {(upcomingStays.length>0||pastStays.length>0)&&(
                      <div className="person-stays">
                        {[...upcomingStays.slice(0,2),...(upcomingStays.length===0?pastStays.slice(0,2):[])].map(s=>(
                          <div key={s.id} className="person-stay-row">
                            <div className="psr-dot" style={{background:p.color}}/>
                            {fmt(s.start)} → {fmt(s.end)}
                            {s.note&&<span style={{color:"var(--light)",fontStyle:"italic"}}> · {s.note}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
      <div className="page-hero">
        <div className="page-hero-title">Photos</div>
        <div className="page-hero-sub">Memories from your visits and the house</div>
      </div>
      <div className="photos-body">
        <div className="photos-section-title" style={{marginBottom:6}}>Memories</div>
        <div className="photos-section-sub">Add photos from your visits.</div>
        <div className={`upload-zone ${dragging?"drag-over":""}`} onClick={()=>inputRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}>
          <input ref={inputRef} className="upload-input" type="file" accept="image/*" multiple onChange={e=>handleFiles(e.target.files)}/>
          <div className="upload-icon">📷</div>
          <div className="upload-text">Drop photos here or click to upload</div>
          <div className="upload-sub">JPG, PNG, HEIC — any size</div>
        </div>
        {memories.length>0?(
          <div className="memory-grid">
            {memories.map(m=>(
              <div key={m.id} className="memory-card">
                <img src={m.src} alt={m.name}/>
                <div className="memory-overlay"/>
                <div className="memory-label">{m.name} · {m.date}</div>
                <button className="memory-delete" onClick={()=>remove(m.id)}>×</button>
              </div>
            ))}
          </div>
        ):(
          <div style={{textAlign:"center",padding:"40px 0",color:"var(--light)"}}>
            <div style={{fontSize:32,marginBottom:10}}>🏖️</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--teal)",marginBottom:4}}>No memories yet</div>
            <div style={{fontSize:13,fontWeight:300}}>Upload photos from your visits to see them here.</div>
          </div>
        )}
        <div style={{marginTop:48}}>
          <div className="photos-section-title" style={{marginBottom:6}}>The House</div>
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

export default function App(){
  const [screen,setScreen]=useState("gate");
  const [tab,setTab]=useState("calendar");
  const [stays,setStays]=useState([]);
  const [toast,setToast]=useState("");
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const fetchStays=useCallback(async()=>{
    try{const d=await api("bookings");setStays((d.bookings||[]).map(b=>({...b,start:b.start||b.startDate,end:b.end||b.endDate})));}catch{}
  },[]);
  useEffect(()=>{if(sessionStorage.getItem("casa_ok")==="true")setScreen("app");},[]);
  useEffect(()=>{if(screen==="app")fetchStays();},[screen,fetchStays]);
  const handleEnter=()=>{sessionStorage.setItem("casa_ok","true");setScreen("app");};
  const handleSave=async stay=>{
    try{
      const body={name:stay.name,startDate:stay.start,endDate:stay.end,note:stay.note||"",color:stay.color,visibility:"family"};
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

  if(screen==="gate")return(<><style>{css}</style><GateScreen onEnter={handleEnter}/></>);

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <div className="app-header">
          <div className="app-brand">Casa Kallman<span className="app-badge">Sunset Key</span></div>
          <button className="btn-exit" onClick={()=>{sessionStorage.removeItem("casa_ok");setScreen("gate");}}>Exit</button>
        </div>
        <div className="app-nav">
          <button className={`nav-tab ${tab==="calendar"?"active":""}`} onClick={()=>setTab("calendar")}>Calendar</button>
          <button className={`nav-tab ${tab==="whos"?"active":""}`} onClick={()=>setTab("whos")}>Who's There</button>
          <button className={`nav-tab ${tab==="people"?"active":""}`} onClick={()=>setTab("people")}>Profiles</button>
          <button className={`nav-tab ${tab==="photos"?"active":""}`} onClick={()=>setTab("photos")}>Photos</button>
        </div>
        {tab==="calendar"&&<CalendarPage stays={stays} knownPeople={knownPeople} onSave={handleSave} onDelete={handleDelete} showToast={showToast}/>}
        {tab==="whos"&&<WhosThereTab stays={stays}/>}
        {tab==="people"&&<PeoplePage stays={stays}/>}
        {tab==="photos"&&<PhotosPage showToast={showToast}/>}
      </div>
      <Toast msg={toast}/>
    </>
  );
}
