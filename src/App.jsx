import { useState, useEffect, useCallback, useRef } from "react";
import { pool_exterior, veranda, kitchen, living, living2, sunset_pool, underwater } from "./photos.js";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MEMBER_COLORS = [
  { id:"sunset",  hex:"#E8894A", label:"Sunset"    },
  { id:"pool",    hex:"#5BA4CF", label:"Pool Blue"  },
  { id:"teal",    hex:"#1A7A6B", label:"Deep Teal"  },
  { id:"terra",   hex:"#C17B5C", label:"Terracotta" },
  { id:"seafoam", hex:"#6BB89A", label:"Seafoam"    },
  { id:"golden",  hex:"#D4A843", label:"Golden"     },
  { id:"orchid",  hex:"#9B7BA8", label:"Orchid"     },
  { id:"coral",   hex:"#E06B6B", label:"Coral"      },
];
const DEFAULT_COLOR = "#1A7A6B";

const api = async (path, opts={}) => {
  const token = localStorage.getItem("bh_token");
  const res = await fetch(`/api/${path}`, {
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||"Request failed");
  return data;
};

const fmt = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtFull = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const dateStr = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const isInRange = (ds,s,e) => ds>=s&&ds<=e;
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const todayStr = () => { const n=new Date(); return dateStr(n.getFullYear(),n.getMonth(),n.getDate()); };

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

  :root {
    --ink: #0E1A16;
    --teal: #1A6B5A;
    --teal-mid: #2E9B7F;
    --teal-light: #5BBFA3;
    --seafoam: #A8DDD0;
    --seafoam-pale: #EEF8F5;
    --sand: #F5EFE3;
    --sand-mid: #E8DCC8;
    --sand-dark: #C8B898;
    --sunset: #E8894A;
    --white: #FDFAF6;
    --mid: #5A7068;
    --light: #96B0A8;
  }

  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Jost',sans-serif;background:var(--white);color:var(--ink);min-height:100vh;overflow-x:hidden;}

  /* ── HERO ── */
  .hero{height:100vh;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
  .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;animation:zoom 20s ease-in-out infinite alternate;}
  @keyframes zoom{from{transform:scale(1)}to{transform:scale(1.07)}}
  .hero-overlay{position:absolute;inset:0;background:linear-gradient(170deg,rgba(14,26,22,0.2) 0%,rgba(14,26,22,0.45) 55%,rgba(14,26,22,0.8) 100%);}

  .hero-top{position:absolute;top:0;left:0;right:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:28px 40px;}
  .hero-logo{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:400;color:rgba(255,255,255,0.85);letter-spacing:1px;}
  .btn-req-small{font-family:'Jost',sans-serif;font-size:11px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--white);background:linear-gradient(135deg,rgba(46,155,127,0.72),rgba(91,191,163,0.72));border:1px solid rgba(255,255,255,0.34);border-radius:50px;padding:10px 22px;cursor:pointer;transition:all 0.25s;text-decoration:none;box-shadow:0 10px 26px rgba(14,26,22,0.18);backdrop-filter:blur(12px);}
  .btn-req-small:hover{transform:translateY(-2px);background:linear-gradient(135deg,var(--teal-mid),var(--teal-light));border-color:rgba(255,255,255,0.56);box-shadow:0 14px 34px rgba(46,155,127,0.32);}
  .btn-family{
    font-family:'Jost',sans-serif;font-size:12px;font-weight:400;letter-spacing:2px;
    text-transform:uppercase;color:var(--white);
    background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.3);
    border-radius:50px;padding:10px 24px;cursor:pointer;
    transition:all 0.25s;backdrop-filter:blur(10px);
  }
  .btn-family:hover{background:rgba(255,255,255,0.22);border-color:rgba(255,255,255,0.5);}

  .hero-content{position:relative;z-index:2;text-align:center;padding:0 32px;}
  .hero-eyebrow{font-size:11px;font-weight:300;letter-spacing:5px;text-transform:uppercase;color:rgba(184,228,226,0.9);margin-bottom:20px;}
  .hero-title{font-family:'Cormorant Garamond',serif;font-size:clamp(80px,13vw,140px);font-weight:300;color:var(--white);line-height:0.9;letter-spacing:-3px;margin-bottom:12px;text-shadow:0 4px 30px rgba(0,0,0,0.3);}
  .hero-title em{font-style:italic;}
  .hero-sub{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:22px;color:rgba(255,255,255,0.65);margin-bottom:48px;font-weight:300;letter-spacing:1px;}
  .hero-pills{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:44px;}
  .hero-pill{font-size:11px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.75);border:1px solid rgba(255,255,255,0.2);border-radius:50px;padding:8px 18px;backdrop-filter:blur(8px);background:rgba(255,255,255,0.06);}
  .hero-actions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;}
  .btn-cta-primary{
    padding:16px 44px;background:linear-gradient(135deg,var(--teal-mid),var(--teal-light));
    color:var(--white);border:none;border-radius:50px;font-family:'Jost',sans-serif;
    font-size:12px;font-weight:400;letter-spacing:2.5px;text-transform:uppercase;
    cursor:pointer;transition:all 0.3s;text-decoration:none;display:inline-block;
    box-shadow:0 8px 32px rgba(46,155,127,0.4);
  }
  .btn-cta-primary:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(46,155,127,0.5);}
  .hero-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:300;animation:bob 2.5s ease-in-out infinite;}
  @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}

  /* ── GALLERY ── */
  .gallery-section{background:linear-gradient(180deg,var(--white) 0%,var(--sand) 100%);padding:82px 56px 96px;position:relative;overflow:hidden;}
  .gallery-section::before{content:'';position:absolute;right:-120px;top:50px;width:360px;height:360px;border-radius:50%;background:rgba(91,191,163,0.10);filter:blur(10px);}
  .gallery-kicker{font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase;color:var(--teal-mid);text-align:center;margin-bottom:12px;}
  .gallery-title{font-family:'Cormorant Garamond',serif;font-size:clamp(42px,5vw,68px);font-weight:300;color:var(--teal);text-align:center;line-height:1;margin-bottom:12px;}
  .gallery-sub{max-width:620px;margin:0 auto 42px;text-align:center;color:var(--mid);font-size:15px;line-height:1.8;font-weight:300;}
  .gallery{max-width:1220px;margin:0 auto;display:grid;grid-template-columns:1.25fr 0.85fr 0.85fr;grid-template-rows:300px 250px 210px;gap:16px;position:relative;z-index:2;}
  .g-cell{overflow:hidden;position:relative;border-radius:22px;box-shadow:0 18px 50px rgba(14,26,22,0.12);background:var(--sand-mid);}
  .g-cell img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.8s ease,filter 0.8s ease;}
  .g-cell:hover img{transform:scale(1.055);filter:saturate(1.05);}
  .g-main{grid-row:1/3;}
  .g-wide{grid-column:2/4;}
  .g-label{position:absolute;bottom:16px;left:16px;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--white);background:rgba(14,26,22,0.50);padding:7px 14px;border-radius:50px;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);}

  /* ── ABOUT ── */
  .about{display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:100px 80px;max-width:1400px;margin:0 auto;align-items:start;}
  .about-tag{font-size:10px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:var(--teal-mid);margin-bottom:18px;}
  .about-title{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,4vw,54px);font-weight:300;color:var(--ink);line-height:1.1;margin-bottom:24px;}
  .about-body{font-size:16px;line-height:1.9;color:var(--mid);font-weight:300;margin-bottom:36px;}
  .amenities{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px;}
  .amenity{padding:18px 20px;border:1px solid var(--sand-mid);border-radius:10px;background:var(--white);}
  .amenity-icon{font-size:20px;margin-bottom:8px;}
  .amenity-name{font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--teal);margin-bottom:3px;}
  .amenity-desc{font-size:12px;color:var(--light);line-height:1.5;font-weight:300;}
  .about-quote{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:26px;font-weight:300;color:var(--teal);line-height:1.55;margin-bottom:36px;padding-left:22px;border-left:2px solid var(--teal-light);}
  .photo-grid-sm{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .photo-sm{border-radius:10px;overflow:hidden;aspect-ratio:4/3;}
  .photo-sm img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s;}
  .photo-sm:hover img{transform:scale(1.05);}

  /* ── REQUEST ── */
  .request-page{min-height:100vh;background:radial-gradient(circle at 18% 18%,rgba(91,191,163,0.18),transparent 32%),linear-gradient(135deg,var(--ink) 0%,#123A32 46%,var(--sand) 46%,var(--white) 100%);padding:34px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
  .request-page::before{content:'🌴';position:absolute;left:-30px;bottom:-65px;font-size:210px;opacity:0.055;transform:rotate(-18deg);}
  .request-page::after{content:'';position:absolute;right:-120px;top:-120px;width:340px;height:340px;border-radius:50%;background:rgba(232,137,74,0.14);filter:blur(8px);}
  .request-card{width:min(1040px,96vw);min-height:640px;background:rgba(253,250,246,0.96);border-radius:28px;display:grid;grid-template-columns:0.88fr 1.12fr;overflow:hidden;box-shadow:0 28px 90px rgba(14,26,22,0.28);position:relative;z-index:2;}
  .request-photo{position:relative;min-height:520px;}
  .request-photo img{width:100%;height:100%;object-fit:cover;display:block;}
  .request-photo::after{content:'';position:absolute;inset:0;background:linear-gradient(160deg,rgba(14,60,50,0.24),rgba(14,26,22,0.68));}
  .request-photo-copy{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:space-between;padding:38px;color:var(--white);}
  .request-photo-title{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:300;line-height:1;}
  .request-photo-text{font-family:'Cormorant Garamond',serif;font-size:20px;font-style:italic;font-weight:300;color:rgba(255,255,255,0.72);line-height:1.5;}
  .request-form-panel{padding:46px 52px;display:flex;flex-direction:column;justify-content:center;}
  .request-back{align-self:flex-start;background:none;border:none;color:var(--light);font-family:'Jost',sans-serif;font-size:12px;letter-spacing:1px;cursor:pointer;margin-bottom:28px;}
  .request-back:hover{color:var(--teal);}
  .request-section{background:var(--ink);padding:100px 80px;}
  .req-inner{max-width:680px;margin:0 auto;}
  .req-tag{font-size:10px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:var(--teal-light);margin-bottom:18px;}
  .req-title{font-family:'Cormorant Garamond',serif;font-size:clamp(42px,5vw,66px);font-weight:300;color:var(--white);line-height:1.0;margin-bottom:14px;}
  .req-sub{font-size:16px;color:rgba(255,255,255,0.45);margin-bottom:48px;font-weight:300;line-height:1.7;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:10px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:9px;}
  .form-input{width:100%;padding:14px 18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:15px;color:var(--white);outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;font-weight:300;}
  .form-input:focus{border-color:rgba(91,191,163,0.5);}
  .form-input::placeholder{color:rgba(255,255,255,0.18);}
  textarea.form-input{resize:vertical;min-height:110px;}
  .btn-submit{width:100%;padding:16px;margin-top:8px;background:linear-gradient(135deg,var(--teal),var(--teal-mid));color:var(--white);border:none;border-radius:10px;font-size:12px;font-weight:400;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;}
  .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(46,155,127,0.3);}
  .btn-submit:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
  .success-wrap{text-align:center;padding:60px 0;}
  .success-icon{font-size:52px;margin-bottom:20px;}
  .success-title{font-family:'Cormorant Garamond',serif;font-size:40px;color:var(--white);font-weight:300;margin-bottom:12px;}
  .success-sub{font-size:15px;color:rgba(255,255,255,0.4);font-weight:300;}
  .estate-footer{background:var(--ink);border-top:1px solid rgba(255,255,255,0.06);padding:28px 80px;display:flex;align-items:center;justify-content:space-between;}
  .footer-brand{font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(255,255,255,0.3);font-weight:300;}
  .footer-loc{font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;font-weight:300;}

  /* ── AUTH ── */
  .auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 18% 22%,rgba(91,191,163,0.18),transparent 34%),radial-gradient(circle at 82% 64%,rgba(232,137,74,0.10),transparent 30%),linear-gradient(135deg,#F4FBF8 0%,var(--seafoam-pale) 46%,#F8F1E6 100%);position:relative;overflow:hidden;}
  .auth-screen::before{content:'🌴';position:absolute;left:-54px;bottom:-92px;font-size:250px;opacity:0.055;transform:rotate(-16deg);}
  .auth-screen::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,0.08) 0 2px,transparent 2px 32px);opacity:0.55;pointer-events:none;}
  /* floating sea-glass dots */
  .auth-bubble{position:absolute;border-radius:50%;background:rgba(46,155,127,0.055);animation:floatUp linear infinite;}
  @keyframes floatUp{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:0.5}100%{transform:translateY(-20vh) scale(1);opacity:0}}

  .auth-wrap{display:grid;grid-template-columns:1fr 1fr;max-width:920px;width:95%;min-height:580px;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(14,26,22,0.15);position:relative;z-index:10;}
  .auth-left{position:relative;overflow:hidden;}
  .auth-left img{width:100%;height:100%;object-fit:cover;display:block;}
  .auth-left-overlay{position:absolute;inset:0;background:linear-gradient(160deg,rgba(14,60,50,0.5),rgba(14,60,50,0.8));}
  .auth-left-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:44px;}
  .auth-left-title{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;color:var(--white);text-shadow:0 2px 12px rgba(0,0,0,0.3);}
  .auth-left-sub{font-size:14px;color:rgba(255,255,255,0.6);font-weight:300;margin-top:6px;}
  .auth-left-quote{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px;color:rgba(255,255,255,0.55);font-weight:300;line-height:1.6;}
  .auth-right{background:var(--white);padding:52px 48px;display:flex;flex-direction:column;justify-content:center;}
  .auth-back{font-size:12px;color:var(--light);cursor:pointer;margin-bottom:32px;display:inline-flex;align-items:center;gap:6px;background:none;border:none;font-family:'Jost',sans-serif;font-weight:300;letter-spacing:1px;transition:color 0.2s;}
  .auth-back:hover{color:var(--teal);}
  .auth-title{font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--teal);margin-bottom:6px;}
  .auth-sub{font-size:14px;color:var(--light);margin-bottom:32px;font-weight:300;}
  .field-group{margin-bottom:16px;}
  .field-label{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid);margin-bottom:8px;}
  .field-input{width:100%;padding:13px 16px;border:1.5px solid var(--sand-mid);border-radius:10px;font-size:15px;color:var(--ink);background:var(--white);outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;font-weight:300;}
  .field-input:focus{border-color:var(--teal-mid);}
  .color-picker{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;}
  .color-swatch{width:30px;height:30px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all 0.2s;}
  .color-swatch.selected{border-color:var(--ink);transform:scale(1.18);}
  .color-swatch:hover{transform:scale(1.1);}
  .btn-primary{width:100%;padding:14px;background:var(--teal);color:var(--white);border:none;border-radius:10px;font-size:12px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;margin-top:8px;font-family:'Jost',sans-serif;}
  .btn-primary:hover{background:var(--teal-mid);transform:translateY(-1px);}
  .toggle-mode{text-align:center;margin-top:16px;font-size:13px;color:var(--light);font-weight:300;}
  .toggle-mode button{background:none;border:none;color:var(--teal-mid);cursor:pointer;font-size:13px;font-family:'Jost',sans-serif;text-decoration:underline;text-underline-offset:3px;}
  .err{color:#c0392b;font-size:13px;margin-bottom:10px;font-weight:300;}

  /* ── APP SHELL ── */
  .app-shell{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(circle at 12% 18%,rgba(91,191,163,0.11),transparent 28%),radial-gradient(circle at 88% 82%,rgba(232,137,74,0.10),transparent 28%),linear-gradient(180deg,#F7F1E6 0%,var(--sand) 62%,#EFE5D3 100%);position:relative;}
  .app-shell::before{content:'🌴';position:fixed;left:-44px;bottom:-72px;font-size:210px;opacity:0.035;transform:rotate(-15deg);pointer-events:none;z-index:0;}
  .app-header{background:var(--ink);padding:0 32px;height:58px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
  .app-brand{display:flex;align-items:baseline;gap:10px;}
  .app-brand-name{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:400;color:var(--white);cursor:pointer;}
  .app-brand-badge{font-size:9px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);padding:3px 8px;border:1px solid rgba(91,191,163,0.3);border-radius:20px;}
  .app-header-right{display:flex;align-items:center;gap:12px;}
  .app-user-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:white;flex-shrink:0;}
  .app-user{font-size:12px;color:rgba(255,255,255,0.45);font-weight:300;}
  .btn-home{background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.55);padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;}
  .btn-home:hover{border-color:rgba(255,255,255,0.3);color:white;}
  .btn-signout{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);padding:6px 14px;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;}
  .btn-signout:hover{background:rgba(255,255,255,0.13);color:white;}
  .app-nav{background:var(--ink);border-bottom:1px solid rgba(255,255,255,0.07);padding:0 32px;display:flex;gap:0;}
  .app-tab{padding:13px 18px;font-size:11px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;background:none;border-top:none;border-left:none;border-right:none;border-bottom:2px solid transparent;font-family:'Jost',sans-serif;}
  .app-tab.active{color:var(--teal-light);border-bottom-color:var(--teal-light);}
  .app-tab:hover:not(.active){color:rgba(255,255,255,0.7);}

  /* ── CALENDAR LAYOUT WITH SIDEBAR ── */
  .cal-layout{display:grid;grid-template-columns:1fr 280px;gap:0;flex:1;position:relative;z-index:1;}
  .cal-main-area{padding:32px;overflow:auto;position:relative;}
  .cal-main-area::before{content:'';position:fixed;right:300px;top:118px;width:240px;height:240px;border-radius:50%;background:rgba(255,255,255,0.22);filter:blur(2px);pointer-events:none;}
  .cal-sidebar{background:rgba(253,250,246,0.86);backdrop-filter:blur(10px);border-left:1px solid var(--sand-mid);padding:28px 24px;overflow-y:auto;position:relative;z-index:2;box-shadow:-18px 0 50px rgba(14,26,22,0.05);}
  .sidebar-title{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--teal);margin-bottom:4px;font-weight:400;}
  .sidebar-sub{font-size:11px;color:var(--light);margin-bottom:20px;font-weight:300;letter-spacing:0.5px;}
  .sidebar-empty{text-align:center;padding:32px 0;}
  .sidebar-palm{font-size:36px;margin-bottom:8px;}
  .sidebar-empty-text{font-size:13px;color:var(--light);font-weight:300;line-height:1.6;}
  .sidebar-booking{
    display:flex;gap:10px;align-items:flex-start;
    padding:12px 0;border-bottom:1px solid var(--sand-mid);
  }
  .sidebar-booking:last-child{border-bottom:none;}
  .sb-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
  .sb-name{font-size:14px;font-weight:400;margin-bottom:2px;}
  .sb-dates{font-size:12px;color:var(--light);font-weight:300;}
  .sb-note{font-size:12px;color:var(--mid);font-style:italic;font-weight:300;margin-top:2px;}
  .sb-here{font-size:10px;background:rgba(46,155,127,0.12);color:var(--teal);padding:2px 8px;border-radius:20px;display:inline-block;margin-top:3px;letter-spacing:0.5px;}

  /* ── YEAR VIEW ── */
  .year-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:14px;}
  .cal-title{font-family:'Cormorant Garamond',serif;font-size:38px;color:var(--teal);font-weight:400;}
  .cal-controls{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
  .btn-nav{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--sand-dark);background:var(--white);color:var(--teal);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
  .btn-nav:hover{background:var(--teal);color:var(--white);border-color:var(--teal);}
  .btn-add{padding:9px 20px;background:var(--sunset);color:var(--white);border:none;border-radius:10px;font-size:11px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;}
  .btn-add:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,137,74,0.3);}
  .year-grid{display:flex;flex-direction:column;gap:3px;background:linear-gradient(135deg,rgba(232,220,200,0.82),rgba(245,239,227,0.92));padding:14px;border-radius:24px;box-shadow:0 18px 50px rgba(14,26,22,0.10);border:1px solid rgba(200,184,152,0.55);position:relative;overflow:hidden;}
  .year-grid::before{content:'Annual booking board';position:absolute;right:18px;bottom:12px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:rgba(14,26,22,0.10);pointer-events:none;}
  .year-row{display:grid;grid-template-columns:52px repeat(31,1fr);gap:3px;align-items:center;position:relative;z-index:1;}
  .year-label{font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--teal);text-align:right;padding-right:12px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:16px;}
  .year-cell{height:36px;border-radius:7px;background:rgba(253,250,246,0.92);cursor:pointer;position:relative;transition:transform 0.1s,box-shadow 0.1s,filter 0.1s;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.7);}
  .year-cell:hover{transform:scale(1.18);z-index:2;box-shadow:0 8px 18px rgba(14,26,22,0.18);filter:saturate(1.12);}
  .year-cell.empty{background:rgba(245,239,227,0.3);cursor:default;pointer-events:none;}
  .year-cell.is-today{outline:2px solid var(--teal-mid);outline-offset:1px;}
  .cell-tip{position:absolute;bottom:calc(100%+5px);left:50%;transform:translateX(-50%);background:var(--ink);color:var(--white);padding:4px 10px;border-radius:6px;font-size:11px;white-space:nowrap;pointer-events:none;z-index:100;opacity:0;transition:opacity 0.15s;font-family:'Jost',sans-serif;font-weight:300;}
  .year-cell:hover .cell-tip{opacity:1;}
  .year-legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;}
  .legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mid);font-weight:300;}
  .legend-dot{width:11px;height:11px;border-radius:3px;}

  /* ── MONTH VIEW ── */
  .month-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:14px;}
  .month-nav{display:flex;align-items:center;gap:12px;}
  .month-grid-header{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;}
  .month-day-label{text-align:center;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);padding:8px 0;}
  .month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}

  .month-cell{
    min-height:108px;background:var(--white);border-radius:10px;
    padding:10px 8px 8px;border:1.5px solid transparent;
    transition:border-color 0.15s,box-shadow 0.2s;display:flex;flex-direction:column;
    position:relative;overflow:hidden;
  }
  .month-cell:hover{box-shadow:0 4px 16px rgba(14,26,22,0.08);}
  .month-cell.other-month{background:rgba(253,250,246,0.5);opacity:0.45;}
  .month-cell.today-cell{border-color:var(--teal-mid);}
  /* subtle palm watermark on empty cells */
  .month-cell.is-empty::after{content:'🌴';position:absolute;bottom:4px;right:6px;font-size:18px;opacity:0.06;pointer-events:none;}
  .month-date-num{font-size:13px;font-weight:400;color:var(--mid);margin-bottom:5px;}
  .today-cell .month-date-num{color:var(--white);background:var(--teal-mid);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;}

  /* pill-style booking bars */
  .booking-pill{
    font-size:11px;font-weight:400;padding:4px 9px;
    border-radius:20px;margin-bottom:3px;cursor:pointer;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    transition:all 0.15s;line-height:1.3;color:white;
    letter-spacing:0.2px;box-shadow:0 2px 6px rgba(0,0,0,0.15);
  }
  .booking-pill:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,0.2);}
  .more-chip{font-size:10px;color:var(--light);padding:2px 4px;font-weight:300;}

  /* ── WHO'S THERE ── */
  .whos-wrap{padding:32px;max-width:800px;width:100%;}
  .section-title{font-family:'Cormorant Garamond',serif;font-size:36px;color:var(--teal);margin-bottom:6px;font-weight:400;}
  .section-sub{font-size:14px;color:var(--light);margin-bottom:28px;font-weight:300;}
  .whos-list{display:flex;flex-direction:column;gap:10px;}
  .whos-card{background:var(--white);border-radius:14px;padding:20px 24px;display:flex;align-items:center;gap:16px;border:1px solid var(--sand-mid);transition:box-shadow 0.2s;}
  .whos-card.here-now{border-color:var(--teal-light);box-shadow:0 4px 20px rgba(46,155,127,0.12);}
  .whos-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500;color:white;flex-shrink:0;}
  .whos-info{flex:1;}
  .whos-name{font-weight:400;font-size:16px;margin-bottom:2px;}
  .whos-dates{font-size:13px;color:var(--light);font-weight:300;}
  .whos-note{font-size:13px;color:var(--mid);font-style:italic;margin-top:2px;font-weight:300;}
  .here-badge{font-size:10px;background:rgba(46,155,127,0.12);color:var(--teal);padding:2px 8px;border-radius:20px;font-weight:400;margin-left:8px;}
  .vis-tag{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:400;letter-spacing:0.5px;}
  .vis-family{background:rgba(155,123,168,0.12);color:#7B5A8A;}
  .vis-open{background:rgba(46,155,127,0.12);color:var(--teal);}
  .empty-state{text-align:center;padding:60px 24px;color:var(--light);}
  .empty-icon{font-size:48px;margin-bottom:14px;}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:30px;color:var(--teal);margin-bottom:6px;}
  .empty-sub{font-size:14px;font-weight:300;}

  /* ── REQUESTS ── */
  .req-wrap-app{padding:32px;max-width:800px;width:100%;}
  .req-card{background:var(--white);border-radius:14px;padding:24px;margin-bottom:12px;border:1px solid var(--sand-mid);}
  .req-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}
  .req-name-app{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--teal);font-weight:400;}
  .req-email{font-size:13px;color:var(--light);font-weight:300;}
  .req-dates-app{font-size:14px;color:var(--mid);margin-bottom:10px;font-weight:300;}
  .req-msg-app{font-size:14px;color:var(--mid);font-style:italic;background:var(--seafoam-pale);padding:12px 16px;border-radius:8px;margin-bottom:16px;font-weight:300;}
  .req-actions{display:flex;gap:10px;}
  .btn-approve{padding:8px 20px;background:var(--teal);color:var(--white);border:none;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-approve:hover{background:var(--teal-mid);}
  .btn-deny{padding:8px 20px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;}
  .btn-deny:hover{background:#fff0f0;}
  .status-badge{font-size:10px;padding:4px 10px;border-radius:20px;font-weight:400;letter-spacing:0.5px;}
  .status-pending{background:rgba(232,137,74,0.12);color:#B8601A;}
  .status-approved{background:rgba(46,155,127,0.12);color:var(--teal);}
  .status-denied{background:rgba(192,57,43,0.08);color:#c0392b;}

  /* ── MODAL ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(14,26,22,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--white);border-radius:20px;padding:40px;max-width:500px;width:94%;box-shadow:0 32px 80px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:28px;color:var(--teal);margin-bottom:24px;font-weight:400;}
  .modal-actions{display:flex;gap:10px;margin-top:24px;justify-content:flex-end;}
  .btn-cancel{padding:10px 20px;background:none;border:1.5px solid var(--sand-dark);border-radius:8px;font-size:11px;cursor:pointer;color:var(--mid);font-family:'Jost',sans-serif;letter-spacing:1px;transition:all 0.2s;text-transform:uppercase;}
  .btn-cancel:hover{border-color:var(--teal-mid);color:var(--teal);}
  .btn-save{padding:10px 24px;background:var(--teal);color:var(--white);border:none;border-radius:8px;font-size:11px;font-weight:400;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-save:hover{background:var(--teal-mid);}
  .btn-remove{padding:10px 20px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:11px;cursor:pointer;font-family:'Jost',sans-serif;margin-right:auto;transition:all 0.2s;letter-spacing:1px;text-transform:uppercase;}
  .btn-remove:hover{background:#fff0f0;}
  .vis-toggle{display:flex;gap:10px;margin-top:8px;}
  .vis-btn{flex:1;padding:10px;border-radius:8px;border:1.5px solid var(--sand-mid);background:var(--white);font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;text-align:center;transition:all 0.2s;color:var(--mid);}
  .vis-btn.active-family{border-color:#9B7BA8;background:rgba(155,123,168,0.08);color:#7B5A8A;font-weight:500;}
  .vis-btn.active-open{border-color:var(--teal-mid);background:rgba(46,155,127,0.08);color:var(--teal);font-weight:500;}

  .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--teal);color:var(--white);padding:12px 28px;border-radius:50px;font-size:13px;z-index:2000;transition:transform 0.3s ease;pointer-events:none;white-space:nowrap;font-family:'Jost',sans-serif;}
  .toast.show{transform:translateX(-50%) translateY(0);}

  @media(max-width:900px){
    .about{grid-template-columns:1fr;padding:60px 28px;gap:48px;}
    .gallery-section{padding:54px 22px 64px;}
    .gallery{grid-template-columns:1fr;grid-template-rows:280px 190px 190px 190px 190px 190px 190px;height:auto;gap:12px;}
    .g-main,.g-wide{grid-row:auto;grid-column:auto;}
    .request-card{grid-template-columns:1fr;}
    .request-photo{display:none;}
    .request-form-panel{padding:34px 24px;}
    .request-page{padding:18px;}
    .auth-wrap{grid-template-columns:1fr;}
    .auth-left{display:none;}
    .request-section,.estate-footer{padding:60px 28px;}
    .cal-layout{grid-template-columns:1fr;}
    .cal-sidebar{display:none;}
    .cal-main-area{padding:20px;}
    .app-header,.app-nav{padding:0 16px;}
    .app-user{display:none;}
    .form-row{grid-template-columns:1fr;}
    .photo-grid-sm{grid-template-columns:1fr;}
    .hero-top{padding:20px 24px;}
  }
`;

function Toast({msg}){return <div className={`toast ${msg?"show":""}`}>{msg}</div>;}

// ── ESTATE PAGE ───────────────────────────────────────────────────────────────
function EstatePage({onFamilyAccess,onRequestStay}){
  return(
    <div className="estate">
      {/* Header */}
      <div className="hero-top">
        <div className="hero-logo">Casa Kallman</div>
        <button className="btn-req-small" onClick={onRequestStay}>Request a Stay</button>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" style={{backgroundImage:`url(${pool_exterior})`}}/>
        <div className="hero-overlay"/>
        <div className="hero-content">
          <div className="hero-eyebrow">Private Vacation Home · Sunset Key, Key West</div>
          <h1 className="hero-title"><em>Casa</em><br/>Kallman</h1>
          <p className="hero-sub">Key West, Florida</p>
          <div className="hero-pills">
            <span className="hero-pill">4 Bedrooms</span>
            <span className="hero-pill">4 Bathrooms</span>
            <span className="hero-pill">Private Island</span>
            <span className="hero-pill">Ocean Views</span>
          </div>
          <button className="btn-cta-primary" onClick={onFamilyAccess}>Family Access →</button>
        </div>
        <div className="hero-scroll"><span>Gallery</span><span>↓</span></div>
      </section>

      {/* Gallery */}
      <section className="gallery-section">
        <div className="gallery-kicker">A private island house</div>
        <h2 className="gallery-title">Inside Casa Kallman</h2>
        <p className="gallery-sub">A calmer, more visual look at the spaces family and friends actually use: the pool, veranda, kitchen, living rooms, and sunset corners of the house.</p>
        <div className="gallery">
          <div className="g-cell g-main"><img src={pool_exterior} alt="Casa Kallman exterior"/><div className="g-label">Exterior</div></div>
          <div className="g-cell"><img src={veranda} alt="Veranda"/><div className="g-label">Veranda</div></div>
          <div className="g-cell"><img src={sunset_pool} alt="Sunset pool"/><div className="g-label">Sunset Pool</div></div>
          <div className="g-cell g-wide"><img src={underwater} alt="Pool water"/><div className="g-label">Pool Light</div></div>
          <div className="g-cell"><img src={kitchen} alt="Kitchen"/><div className="g-label">Kitchen</div></div>
          <div className="g-cell"><img src={living} alt="Living room"/><div className="g-label">Living Room</div></div>
          <div className="g-cell"><img src={living2} alt="Second living room"/><div className="g-label">Lounge</div></div>
        </div>
      </section>

      <footer className="estate-footer">
        <div className="footer-brand">Casa Kallman</div>
        <div className="footer-loc">Sunset Key · Key West, FL</div>
      </footer>
    </div>
  );
}

function RequestStayPage({onBack}){
  const [form,setForm]=useState({name:"",email:"",checkin:"",checkout:"",message:""});
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [err,setErr]=useState("");
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));

  const submit=async()=>{
    if(!form.name||!form.email||!form.checkin||!form.checkout){setErr("Please fill in all required fields.");return;}
    setSubmitting(true);setErr("");
    try{await api("request",{method:"POST",body:JSON.stringify(form)});setSubmitted(true);}
    catch(e){setErr("Something went wrong. Please try again.");}
    finally{setSubmitting(false);}
  };

  return(
    <div className="request-page">
      <div className="request-card">
        <div className="request-photo">
          <img src={sunset_pool} alt="Casa Kallman sunset pool"/>
          <div className="request-photo-copy">
            <div>
              <div className="request-photo-title">Casa Kallman</div>
              <div className="auth-left-sub">Sunset Key · Key West</div>
            </div>
            <div className="request-photo-text">Private family house, shared carefully with friends of the family.</div>
          </div>
        </div>
        <div className="request-form-panel">
          <button className="request-back" onClick={onBack}>← Back to Casa Kallman</button>
          {submitted?(
            <div className="success-wrap" style={{padding:"40px 0"}}><div className="success-icon">🌴</div><div className="success-title" style={{color:"var(--teal)"}}>Request Received</div><p className="success-sub" style={{color:"var(--mid)"}}>The Kallman family will be in touch to confirm your dates.</p></div>
          ):(
            <>
              <div className="req-tag" style={{color:"var(--teal-mid)"}}>Plan Your Visit</div>
              <h2 className="req-title" style={{color:"var(--teal)"}}>Request a Stay</h2>
              <p className="req-sub" style={{color:"var(--mid)"}}>Submit your dates and a short note. The family will review the request and confirm availability directly.</p>
              <div className="form-row">
                <div className="field-group"><label className="field-label">Your Name *</label><input className="field-input" value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Full name"/></div>
                <div className="field-group"><label className="field-label">Email *</label><input className="field-input" type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="your@email.com"/></div>
              </div>
              <div className="form-row">
                <div className="field-group"><label className="field-label">Check In *</label><input className="field-input" type="date" value={form.checkin} onChange={e=>upd("checkin",e.target.value)}/></div>
                <div className="field-group"><label className="field-label">Check Out *</label><input className="field-input" type="date" value={form.checkout} onChange={e=>upd("checkout",e.target.value)}/></div>
              </div>
              <div className="field-group"><label className="field-label">Message</label><textarea className="field-input" value={form.message} onChange={e=>upd("message",e.target.value)} placeholder="Group size, reason for visit, any questions..." style={{minHeight:120}}/></div>
              {err&&<div className="err" style={{marginBottom:12}}>{err}</div>}
              <button className="btn-primary" onClick={submit} disabled={submitting}>{submitting?"Sending...":"Send Request"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({onBack,onSuccess}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [password,setPassword]=useState("");
  const [familyPasskey,setFamilyPasskey]=useState("");
  const [color,setColor]=useState(MEMBER_COLORS[2].hex);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const bubbles=Array.from({length:14},(_,i)=>({
    id:i,size:Math.random()*80+20,
    left:Math.random()*100,
    duration:Math.random()*18+10,
    delay:Math.random()*12,
  }));

  const handle=async()=>{
    if(!name||!password){setErr("Please fill in all fields.");return;}
    if(mode==="register"&&!familyPasskey){setErr("Family passkey required.");return;}
    setLoading(true);setErr("");
    try{
      const endpoint=mode==="login"?"login":"register";
      const body=mode==="login"?{name:name.trim(),password}:{name:name.trim(),password,familyPasskey,color};
      const data=await api(endpoint,{method:"POST",body:JSON.stringify(body)});
      localStorage.setItem("bh_token",data.token);
      localStorage.setItem("bh_user",JSON.stringify(data.user));
      onSuccess(data.user);
    }catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

  return(
    <div className="auth-screen">
      {bubbles.map(b=>(
        <div key={b.id} className="auth-bubble" style={{width:b.size,height:b.size,left:`${b.left}%`,animationDuration:`${b.duration}s`,animationDelay:`${b.delay}s`}}/>
      ))}
      <div className="auth-wrap">
        <div className="auth-left">
          <img src={pool_exterior} alt="Casa Kallman"/>
          <div className="auth-left-overlay"/>
          <div className="auth-left-content">
            <div>
              <div className="auth-left-title">Casa Kallman</div>
              <div className="auth-left-sub">Family vacation home · Sunset Key, Key West</div>
            </div>
            <div className="auth-left-quote">"Where every visit becomes a memory."</div>
          </div>
        </div>
        <div className="auth-right">
          <button className="auth-back" onClick={onBack}>← Back to site</button>
          <div className="auth-title">{mode==="login"?"Welcome back":"Create account"}</div>
          <div className="auth-sub">{mode==="login"?"Sign in to manage your stays.":"Family members only — you'll need the family passkey."}</div>
          <div className="field-group"><label className="field-label">Name</label><input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          <div className="field-group"><label className="field-label">Password</label><input className="field-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          {mode==="register"&&<>
            <div className="field-group"><label className="field-label">Family Passkey</label><input className="field-input" type="password" value={familyPasskey} onChange={e=>setFamilyPasskey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
            <div className="field-group"><label className="field-label">Your Color</label><div className="color-picker">{MEMBER_COLORS.map(c=><div key={c.id} className={`color-swatch ${color===c.hex?"selected":""}`} style={{background:c.hex}} onClick={()=>setColor(c.hex)} title={c.label}/>)}</div></div>
          </>}
          {err&&<div className="err">{err}</div>}
          <button className="btn-primary" onClick={handle} disabled={loading}>{loading?"...":(mode==="login"?"Sign In":"Create Account")}</button>
          <div className="toggle-mode">
            {mode==="login"?<><span>New? </span><button onClick={()=>{setMode("register");setErr("");}}>Create an account</button></>:<><span>Have an account? </span><button onClick={()=>{setMode("login");setErr("");}}>Sign in</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────
function BookingModal({booking,user,onClose,onSave,onDelete}){
  const isEdit=!!booking?.id;
  const ts=todayStr();
  const [name,setName]=useState(booking?.name||user?.name||"");
  const [startDate,setStartDate]=useState(booking?.startDate||ts);
  const [endDate,setEndDate]=useState(booking?.endDate||ts);
  const [note,setNote]=useState(booking?.note||"");
  const [visibility,setVisibility]=useState(booking?.visibility||"family");
  const [loading,setLoading]=useState(false);

  const save=async()=>{
    if(!name||!startDate||!endDate)return;
    if(endDate<startDate){alert("End date must be after start.");return;}
    setLoading(true);
    try{await onSave({name,startDate,endDate,note,visibility,color:user?.color||DEFAULT_COLOR,id:booking?.id});onClose();}
    finally{setLoading(false);}
  };

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit?"Edit Stay":"Add Stay"}</div>
        <div className="field-group"><label className="field-label">Name</label><input className="field-input" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="field-group" style={{display:"flex",gap:12}}>
          <div style={{flex:1}}><label className="field-label">Check in</label><input className="field-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
          <div style={{flex:1}}><label className="field-label">Check out</label><input className="field-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
        </div>
        <div className="field-group"><label className="field-label">Note</label><input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Bringing friends, special occasion..."/></div>
        <div className="field-group"><label className="field-label">Visibility</label>
          <div className="vis-toggle">
            <button className={`vis-btn ${visibility==="family"?"active-family":""}`} onClick={()=>setVisibility("family")}>🔒 Family only</button>
            <button className={`vis-btn ${visibility==="open"?"active-open":""}`} onClick={()=>setVisibility("open")}>🌊 Open for friends</button>
          </div>
        </div>
        <div className="modal-actions">
          {isEdit&&<button className="btn-remove" onClick={async()=>{if(window.confirm("Remove?")){await onDelete(booking.id);onClose();}}}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={loading}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function CalSidebar({bookings,isGuest}){
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const upcoming=visible.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,8);
  return(
    <div className="cal-sidebar">
      <div className="sidebar-title">At the House</div>
      <div className="sidebar-sub">Upcoming stays</div>
      {upcoming.length===0?(
        <div className="sidebar-empty">
          <div className="sidebar-palm">🌴</div>
          <div className="sidebar-empty-text">Nothing scheduled yet.<br/>The house is all yours.</div>
        </div>
      ):(
        upcoming.map(b=>{
          const isNow=b.startDate<=ts&&b.endDate>=ts;
          return(
            <div key={b.id} className="sidebar-booking">
              <div className="sb-dot" style={{background:b.color||DEFAULT_COLOR}}/>
              <div>
                <div className="sb-name">{b.name}</div>
                <div className="sb-dates">{fmt(b.startDate)} — {fmt(b.endDate)}</div>
                {b.note&&<div className="sb-note">{b.note}</div>}
                {isNow&&<div className="sb-here">Here now</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── YEAR VIEW ─────────────────────────────────────────────────────────────────
function YearView({bookings,user,isGuest,onSave,onDelete,showToast}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [editB,setEditB]=useState(null);
  const [addModal,setAddModal]=useState(false);
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;

  const getDay=(y,m,d)=>{
    const ds=dateStr(y,m,d);
    return visible.filter(b=>isInRange(ds,b.startDate,b.endDate));
  };

  return(
    <>
      <div className="year-header">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="btn-nav" onClick={()=>setYear(y=>y-1)}>‹</button>
          <div className="cal-title">{year}</div>
          <button className="btn-nav" onClick={()=>setYear(y=>y+1)}>›</button>
        </div>
        <div className="cal-controls">
          <div className="year-legend">
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(155,123,168,0.5)",border:"2px solid #9B7BA8"}}/>Family</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(46,155,127,0.5)",border:"2px solid #2E9B7F"}}/>Open</div>
          </div>
          {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
        </div>
      </div>
      <div className="year-grid">
        {Array.from({length:12},(_,mi)=>{
          const dim=daysInMonth(year,mi);
          return(
            <div key={mi} className="year-row">
              <div className="year-label">{MONTHS[mi]}</div>
              {Array.from({length:31},(_,di)=>{
                if(di>=dim)return<div key={di} className="year-cell empty"/>;
                const d=di+1;const ds=dateStr(year,mi,d);
                const bs=getDay(year,mi,d);
                const isToday=ds===ts;
                const bg=bs.length>0
                  ?bs.length===1?bs[0].color||DEFAULT_COLOR
                  :`linear-gradient(135deg,${bs.map(b=>b.color||DEFAULT_COLOR).join(",")})`
                  :undefined;
                const names=bs.map(b=>b.name).join(", ");
                return(
                  <div key={di} className={`year-cell ${isToday?"is-today":""} ${bs.length?"":""}`}
                    style={bg?{background:bg}:{}}
                    onClick={()=>bs.length&&setEditB(bs[0])}
                    title={names}>
                    {bs.length===1&&<span style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.9)",letterSpacing:0,lineHeight:1}}>{bs[0].name?.[0]?.toUpperCase()}</span>}
                    {bs.length>1&&<span style={{fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.9)"}}>{bs.length}</span>}
                    {names&&<div className="cell-tip">{names}</div>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {(addModal||editB)&&(
        <BookingModal booking={editB} user={user}
          onClose={()=>{setAddModal(false);setEditB(null);}}
          onSave={async(b)=>{await onSave(b);showToast(b.id?"Updated!":"Stay added!");}}
          onDelete={async(id)=>{await onDelete(id);showToast("Removed.");}}/>
      )}
    </>
  );
}

// ── MONTH VIEW ────────────────────────────────────────────────────────────────
function MonthView({bookings,user,isGuest,onSave,onDelete,showToast}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [detailB,setDetailB]=useState(null);
  const [editB,setEditB]=useState(null);
  const [addModal,setAddModal]=useState(false);
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;

  const firstDay=new Date(year,month,1).getDay();
  const dim=daysInMonth(year,month);
  const prevDim=daysInMonth(year,month===0?11:month-1);
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevDim-i,current:false});
  for(let i=1;i<=dim;i++)cells.push({day:i,current:true});
  while(cells.length%7!==0)cells.push({day:cells.length-dim-firstDay+1,current:false});

  const bForDay=(d,c)=>{if(!c)return[];const ds=dateStr(year,month,d);return visible.filter(b=>isInRange(ds,b.startDate,b.endDate));};
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};

  return(
    <>
      <div className="month-header">
        <div className="month-nav">
          <button className="btn-nav" onClick={prev}>‹</button>
          <div className="cal-title">{MONTH_NAMES[month]} {year}</div>
          <button className="btn-nav" onClick={next}>›</button>
        </div>
        {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
      </div>
      <div className="month-grid-header">{DAY_NAMES.map(d=><div key={d} className="month-day-label">{d}</div>)}</div>
      <div className="month-grid">
        {cells.map((cell,i)=>{
          const bs=bForDay(cell.day,cell.current);
          const isToday=cell.current&&dateStr(year,month,cell.day)===ts;
          const isEmpty=cell.current&&bs.length===0;
          return(
            <div key={i} className={`month-cell ${!cell.current?"other-month":""} ${isToday?"today-cell":""} ${isEmpty?"is-empty":""}`}>
              <div className="month-date-num">{cell.day}</div>
              {bs.slice(0,3).map(b=>(
                <div key={b.id} className="booking-pill" style={{background:b.color||DEFAULT_COLOR}} onClick={()=>setDetailB(b)} title={b.name}>
                  {b.name}{b.note?` · ${b.note}`:""}
                </div>
              ))}
              {bs.length>3&&<div className="more-chip">+{bs.length-3} more</div>}
            </div>
          );
        })}
      </div>
      {detailB&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetailB(null)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{width:12,height:12,borderRadius:3,background:detailB.color||DEFAULT_COLOR,flexShrink:0}}/>
                  <div className="modal-title" style={{marginBottom:0}}>{detailB.name}</div>
                </div>
                <div style={{fontSize:14,color:"var(--mid)",fontWeight:300}}>{fmtFull(detailB.startDate)} → {fmtFull(detailB.endDate)}</div>
              </div>
              <span className={`vis-tag ${detailB.visibility==="open"?"vis-open":"vis-family"}`}>{detailB.visibility==="open"?"Open":"Family"}</span>
            </div>
            {detailB.note&&<div style={{background:"var(--seafoam-pale)",padding:"14px 16px",borderRadius:10,fontSize:14,color:"var(--mid)",fontStyle:"italic",fontWeight:300}}>"{detailB.note}"</div>}
            <div className="modal-actions">
              {user&&(user.name===detailB.name||user.isAdmin)&&<button className="btn-remove" onClick={async()=>{if(window.confirm("Remove?")){await onDelete(detailB.id);setDetailB(null);showToast("Removed.");}}}>Remove</button>}
              <button className="btn-cancel" onClick={()=>setDetailB(null)}>Close</button>
              {user&&(user.name===detailB.name||user.isAdmin)&&<button className="btn-save" onClick={()=>{setEditB(detailB);setDetailB(null);}}>Edit</button>}
            </div>
          </div>
        </div>
      )}
      {(addModal||editB)&&(
        <BookingModal booking={editB} user={user}
          onClose={()=>{setAddModal(false);setEditB(null);}}
          onSave={async(b)=>{await onSave(b);showToast(b.id?"Updated!":"Stay added!");}}
          onDelete={async(id)=>{await onDelete(id);showToast("Removed.");}}/>
      )}
    </>
  );
}

// ── WHO'S THERE ───────────────────────────────────────────────────────────────
function WhosThereView({bookings,isGuest}){
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const upcoming=visible.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  return(
    <div className="whos-wrap">
      <div className="section-title">Who's at the House</div>
      <div className="section-sub">Upcoming stays at Casa Kallman</div>
      {upcoming.length===0?(
        <div className="empty-state"><div className="empty-icon">🌴</div><div className="empty-title">All clear</div><div className="empty-sub">No upcoming stays scheduled.</div></div>
      ):(
        <div className="whos-list">
          {upcoming.map(b=>{
            const isNow=b.startDate<=ts&&b.endDate>=ts;
            return(
              <div key={b.id} className={`whos-card ${isNow?"here-now":""}`}>
                <div className="whos-av" style={{background:b.color||DEFAULT_COLOR}}>{b.name?.[0]?.toUpperCase()}</div>
                <div className="whos-info">
                  <div className="whos-name">{b.name}{isNow&&<span className="here-badge">Here now</span>}</div>
                  <div className="whos-dates">{fmt(b.startDate)} — {fmt(b.endDate)}</div>
                  {b.note&&<div className="whos-note">{b.note}</div>}
                </div>
                <span className={`vis-tag ${b.visibility==="open"?"vis-open":"vis-family"}`}>{b.visibility==="open"?"Open":"Family"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── REQUESTS ──────────────────────────────────────────────────────────────────
function RequestsView({showToast}){
  const [requests,setRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const load=async()=>{try{const d=await api("requests");setRequests(d.requests||[]);}catch{}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const update=async(id,status)=>{
    try{await api(`requests/${id}`,{method:"PUT",body:JSON.stringify({status})});showToast(status==="approved"?"Approved!":"Denied.");load();}
    catch{showToast("Something went wrong.");}
  };
  if(loading)return<div className="req-wrap-app"><div style={{color:"var(--light)",padding:40}}>Loading...</div></div>;
  return(
    <div className="req-wrap-app">
      <div className="section-title">Stay Requests</div>
      <div className="section-sub">Guest requests from the website</div>
      {requests.length===0?(
        <div className="empty-state"><div className="empty-icon">📬</div><div className="empty-title">No requests yet</div><div className="empty-sub">Guest stay requests will appear here.</div></div>
      ):requests.map(r=>(
        <div key={r.id} className="req-card">
          <div className="req-top"><div><div className="req-name-app">{r.name}</div><div className="req-email">{r.email}</div></div><span className={`status-badge status-${r.status||"pending"}`}>{r.status||"Pending"}</span></div>
          <div className="req-dates-app">📅 {fmt(r.checkin)} → {fmt(r.checkout)}</div>
          {r.message&&<div className="req-msg-app">"{r.message}"</div>}
          <div className="req-actions">
            {(!r.status||r.status==="pending")&&<><button className="btn-approve" onClick={()=>update(r.id,"approved")}>Approve</button><button className="btn-deny" onClick={()=>update(r.id,"denied")}>Deny</button></>}
            {r.status==="approved"&&<span style={{fontSize:13,color:"var(--teal)"}}>✓ Approved</span>}
            {r.status==="denied"&&<span style={{fontSize:13,color:"#c0392b"}}>✗ Denied</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FAMILY APP ────────────────────────────────────────────────────────────────
function FamilyApp({user,bookings,onSave,onDelete,showToast,isGuest,onGoHome}){
  const [tab,setTab]=useState("month");
  const tabs=isGuest
    ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"}]
    :user?.isAdmin
      ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"},{id:"requests",label:"Requests"}]
      :[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"}];

  const signOut=()=>{localStorage.removeItem("bh_token");localStorage.removeItem("bh_user");sessionStorage.removeItem("bh_passkey_ok");window.location.reload();};
  const showSidebar=tab==="year"||tab==="month";

  return(
    <div className="app-shell">
      <div className="app-header">
        <div className="app-brand">
          <span className="app-brand-name" onClick={onGoHome}>Casa Kallman</span>
          <span className="app-brand-badge">{isGuest?"Guest":"Family"}</span>
        </div>
        <div className="app-header-right">
          {user&&<>
            <div className="app-user-dot" style={{background:user.color||DEFAULT_COLOR}}>{user.name?.[0]?.toUpperCase()}</div>
            <span className="app-user">Hi, {user.name}</span>
          </>}
          <button className="btn-home" onClick={onGoHome}>← Home</button>
          <button className="btn-signout" onClick={signOut}>{isGuest?"Exit":"Sign out"}</button>
        </div>
      </div>
      <div className="app-nav">
        {tabs.map(t=><button key={t.id} className={`app-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>
      {showSidebar?(
        <div className="cal-layout">
          <div className="cal-main-area">
            {tab==="year"&&<YearView bookings={bookings} user={user} isGuest={isGuest} onSave={onSave} onDelete={onDelete} showToast={showToast}/>}
            {tab==="month"&&<MonthView bookings={bookings} user={user} isGuest={isGuest} onSave={onSave} onDelete={onDelete} showToast={showToast}/>}
          </div>
          <CalSidebar bookings={bookings} isGuest={isGuest}/>
        </div>
      ):(
        <>
          {tab==="whos"&&<WhosThereView bookings={bookings} isGuest={isGuest}/>}
          {tab==="requests"&&user?.isAdmin&&<RequestsView showToast={showToast}/>}
        </>
      )}
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("estate");
  const [user,setUser]=useState(null);
  const [isGuest,setIsGuest]=useState(false);
  const [bookings,setBookings]=useState([]);
  const [toast,setToast]=useState("");

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),3000);};
  const fetchBookings=useCallback(async()=>{try{const d=await api("bookings");setBookings(d.bookings||[]);}catch{}},[]);

  useEffect(()=>{
    const token=localStorage.getItem("bh_token");
    const savedUser=localStorage.getItem("bh_user");
    const guestOk=sessionStorage.getItem("bh_passkey_ok");
    if(token&&savedUser){setUser(JSON.parse(savedUser));setScreen("app");}
    else if(guestOk==="true"){setIsGuest(true);setScreen("app");}
  },[]);

  useEffect(()=>{if(screen==="app")fetchBookings();},[screen,fetchBookings]);

  const handleSave=async(booking)=>{
    try{
      if(booking.id)await api(`bookings/${booking.id}`,{method:"PUT",body:JSON.stringify(booking)});
      else await api("bookings",{method:"POST",body:JSON.stringify(booking)});
      fetchBookings();
    }catch{showToast("Something went wrong.");}
  };
  const handleDelete=async(id)=>{try{await api(`bookings/${id}`,{method:"DELETE"});fetchBookings();}catch{showToast("Could not delete.");}};

  return(
    <>
      <style>{css}</style>
      {screen==="estate"&&<EstatePage onFamilyAccess={()=>setScreen("auth")} onRequestStay={()=>setScreen("request")}/>}
      {screen==="request"&&<RequestStayPage onBack={()=>setScreen("estate")}/>}
      {screen==="auth"&&<AuthScreen onBack={()=>setScreen("estate")} onSuccess={(u)=>{setUser(u);setScreen("app");}}/>}
      {screen==="app"&&<FamilyApp user={user} bookings={bookings} isGuest={isGuest} onSave={handleSave} onDelete={handleDelete} showToast={showToast} onGoHome={()=>setScreen("estate")}/>}
      <Toast msg={toast}/>
    </>
  );
}
