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


const nthWeekday = (year, month, weekday, nth) => {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
};
const lastWeekday = (year, month, weekday) => {
  const last = new Date(year, month + 1, 0);
  return last.getDate() - ((last.getDay() - weekday + 7) % 7);
};
const easterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
};
const holidayObj = (year, month, day, name, tone="federal") => ({ date:dateStr(year,month,day), name, tone });
const getUSHolidays = (year) => {
  const e = easterDate(year);
  return [
    holidayObj(year,0,1,"New Year's Day"),
    holidayObj(year,0,nthWeekday(year,0,1,3),"MLK Day"),
    holidayObj(year,1,14,"Valentine's Day","social"),
    holidayObj(year,1,nthWeekday(year,1,1,3),"Presidents' Day"),
    holidayObj(year,e.month,e.day,"Easter","social"),
    holidayObj(year,4,nthWeekday(year,4,0,2),"Mother's Day","social"),
    holidayObj(year,4,lastWeekday(year,4,1),"Memorial Day"),
    holidayObj(year,5,19,"Juneteenth"),
    holidayObj(year,5,nthWeekday(year,5,0,3),"Father's Day","social"),
    holidayObj(year,6,4,"Independence Day"),
    holidayObj(year,8,nthWeekday(year,8,1,1),"Labor Day"),
    holidayObj(year,9,nthWeekday(year,9,1,2),"Indigenous Peoples' Day"),
    holidayObj(year,9,31,"Halloween","social"),
    holidayObj(year,10,11,"Veterans Day"),
    holidayObj(year,10,nthWeekday(year,10,4,4),"Thanksgiving"),
    holidayObj(year,11,25,"Christmas Day"),
  ];
};
const getHolidayByDate = (ds) => {
  const y = Number(ds.slice(0,4));
  return getUSHolidays(y).find(h=>h.date===ds) || null;
};
const monthOpenDays = (year, month, bookings, isGuest=false) => {
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  let open=0, booked=0;
  for(let d=1; d<=daysInMonth(year,month); d++){
    const ds=dateStr(year,month,d);
    if(visible.some(b=>isInRange(ds,b.startDate,b.endDate))) booked++; else open++;
  }
  return {open, booked};
};
const countBookedDaysInYear = (year, bookings, isGuest=false) => {
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const set=new Set();
  visible.forEach(b=>{
    const start=new Date(b.startDate+"T12:00:00");
    const end=new Date(b.endDate+"T12:00:00");
    for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
      if(d.getFullYear()===year)set.add(dateStr(d.getFullYear(),d.getMonth(),d.getDate()));
    }
  });
  return set.size;
};

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



  /* ── HOME WEATHER / SHARE STRIP ── */
  .home-weather-section{position:relative;background:linear-gradient(180deg,var(--sand) 0%,var(--white) 100%);padding:54px 56px 34px;overflow:hidden;}
  .home-weather-section::before{content:'';position:absolute;left:-100px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(91,191,163,0.14);filter:blur(12px);}
  .home-weather-section::after{content:'☀';position:absolute;right:7%;top:20px;font-size:104px;color:rgba(232,137,74,0.08);font-family:'Cormorant Garamond',serif;}
  .home-weather-grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:0.78fr 1.22fr;gap:18px;align-items:stretch;position:relative;z-index:2;}
  .home-weather-grid .status-card{margin:0;background:rgba(253,250,246,0.92);border-color:rgba(200,184,152,0.46);padding:22px 24px;border-radius:24px;box-shadow:0 18px 52px rgba(14,26,22,0.08);}
  .home-weather-grid .weather-temp{font-size:52px;}
  .home-weather-grid .weather-emoji{font-size:36px;}
  .home-share-card{background:linear-gradient(135deg,rgba(14,26,22,0.94),rgba(26,107,90,0.88));border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:24px 28px;color:var(--white);box-shadow:0 22px 60px rgba(14,26,22,0.16);display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;position:relative;overflow:hidden;}
  .home-share-card::after{content:'🌴';position:absolute;right:18px;bottom:-34px;font-size:96px;opacity:0.055;transform:rotate(-10deg);}
  .home-share-kicker{font-size:10px;letter-spacing:2.7px;text-transform:uppercase;color:rgba(184,228,226,0.78);margin-bottom:8px;}
  .home-share-title{font-family:'Cormorant Garamond',serif;font-size:34px;line-height:1.05;font-weight:300;margin-bottom:8px;}
  .home-share-text{font-size:14px;line-height:1.65;color:rgba(255,255,255,0.62);font-weight:300;max-width:560px;}
  .home-share-actions{display:flex;gap:10px;align-items:center;position:relative;z-index:2;}
  .btn-share-home{font-family:'Jost',sans-serif;font-size:11px;font-weight:400;letter-spacing:1.6px;text-transform:uppercase;border:none;border-radius:999px;padding:13px 19px;cursor:pointer;transition:all .22s;background:var(--white);color:var(--teal);box-shadow:0 10px 26px rgba(0,0,0,0.12);white-space:nowrap;}
  .btn-share-home:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,0,0,0.18);}
  .btn-share-secondary{background:rgba(255,255,255,0.10);color:var(--white);border:1px solid rgba(255,255,255,0.18);box-shadow:none;}

  .gallery-section::after{content:'';position:absolute;left:-130px;bottom:60px;width:320px;height:320px;border-radius:50%;background:rgba(232,137,74,0.08);filter:blur(14px);}
  .g-cell::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(14,26,22,0.34) 100%);pointer-events:none;opacity:.85;}
  .g-label{z-index:2;}

  /* ── AUTH ── */
  .auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 18% 22%,rgba(91,191,163,0.18),transparent 34%),radial-gradient(circle at 82% 64%,rgba(232,137,74,0.10),transparent 30%),linear-gradient(135deg,#F4FBF8 0%,var(--seafoam-pale) 46%,#F8F1E6 100%);position:relative;overflow:hidden;}
  .auth-screen::before{content:'🌴';position:absolute;left:-58px;bottom:-96px;font-size:300px;opacity:0.11;transform:rotate(-16deg);filter:saturate(0.75);}
  .auth-screen::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,0.08) 0 2px,transparent 2px 32px);opacity:0.55;pointer-events:none;}
  .auth-palm{position:absolute;z-index:1;pointer-events:none;font-size:230px;line-height:1;opacity:0.13;filter:saturate(0.65);}
  .auth-palm.top{right:-40px;top:-58px;transform:rotate(22deg);}
  .auth-palm.mid{right:8%;bottom:9%;font-size:92px;opacity:0.08;transform:rotate(-8deg);}
  .auth-glow{position:absolute;inset:auto 16% 6% auto;width:360px;height:360px;border-radius:50%;background:rgba(232,137,74,0.14);filter:blur(32px);z-index:1;pointer-events:none;}
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
  .month-date-row{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:5px;position:relative;z-index:2;}
  .month-date-num{font-size:13px;font-weight:400;color:var(--mid);}
  .mobile-day-name{display:none;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);}
  .today-cell .month-date-num{color:var(--white);background:var(--teal-mid);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;}
  .day-weather{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:6px;padding-top:5px;font-size:10px;color:var(--light);position:relative;z-index:2;}
  .day-weather-emoji{font-size:13px;line-height:1;}
  .day-weather-temp{white-space:nowrap;font-weight:400;color:var(--mid);}
  .forecast-note{font-size:11px;color:var(--light);font-weight:300;margin:-8px 0 10px;text-align:right;}

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



  /* ── HOUSE STATUS / WEATHER / PAGE TURN ── */
  .cal-main-area{background:
    radial-gradient(circle at 18% 12%, rgba(91,191,163,0.14), transparent 28%),
    radial-gradient(circle at 82% 0%, rgba(232,137,74,0.15), transparent 32%),
    linear-gradient(180deg, rgba(253,250,246,0.55), rgba(245,239,227,0.96));}
  .cal-main-area::after{content:'🌴';position:fixed;left:-34px;bottom:42px;font-size:210px;opacity:0.035;transform:rotate(-12deg);pointer-events:none;filter:grayscale(1);}
  .page-sheet{animation:pageTurn 0.42s ease both;transform-origin:left center;perspective:1200px;}
  @keyframes pageTurn{0%{opacity:0;transform:rotateY(-6deg) translateX(14px);filter:blur(1px)}100%{opacity:1;transform:rotateY(0) translateX(0);filter:blur(0)}}
  .status-card{background:rgba(253,250,246,0.78);border:1px solid var(--sand-mid);border-radius:18px;padding:16px;margin-bottom:16px;box-shadow:0 10px 30px rgba(14,26,22,0.05);}
  .weather-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
  .weather-temp{font-family:'Cormorant Garamond',serif;font-size:40px;line-height:0.9;color:var(--teal);font-weight:400;}
  .weather-emoji{font-size:28px;line-height:1;}
  .weather-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--light);margin-bottom:8px;}
  .weather-cond{font-size:13px;color:var(--mid);font-weight:300;line-height:1.45;}
  .weather-note{margin-top:10px;padding:8px 10px;border-radius:12px;background:rgba(91,191,163,0.1);font-size:12px;color:var(--teal);font-weight:300;line-height:1.45;}
  .mini-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 18px;}
  .mini-stat{background:rgba(253,250,246,0.65);border:1px solid var(--sand-mid);border-radius:16px;padding:13px 14px;}
  .mini-num{font-family:'Cormorant Garamond',serif;font-size:28px;color:var(--teal);line-height:1;font-weight:400;}
  .mini-label{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);margin-top:5px;}
  .holiday-chip{display:inline-flex;align-items:center;gap:5px;margin-top:auto;align-self:flex-start;font-size:9px;letter-spacing:0.7px;text-transform:uppercase;color:#A65A23;background:rgba(232,137,74,0.12);border:1px solid rgba(232,137,74,0.22);padding:3px 7px;border-radius:20px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .holiday-dot{position:absolute;right:4px;bottom:4px;width:7px;height:7px;border-radius:50%;background:var(--sunset);box-shadow:0 0 0 3px rgba(232,137,74,0.13);}
  .holiday-dot.social{background:var(--teal-light);box-shadow:0 0 0 3px rgba(91,191,163,0.14);}
  .holiday-mini{font-size:8px;color:rgba(14,26,22,0.45);position:absolute;bottom:3px;left:50%;transform:translateX(-50%);}
  .family-wrap{padding:32px;max-width:1040px;width:100%;position:relative;}
  .family-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;}
  .family-card{background:rgba(253,250,246,0.82);border:1px solid var(--sand-mid);border-radius:20px;padding:22px;box-shadow:0 16px 40px rgba(14,26,22,0.06);position:relative;overflow:hidden;}
  .family-card::after{content:' ';position:absolute;right:-28px;top:-28px;width:90px;height:90px;border-radius:50%;background:var(--member-color);opacity:0.08;}
  .family-head{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
  .family-avatar{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:500;font-size:18px;box-shadow:0 8px 22px rgba(14,26,22,0.12);}
  .family-name{font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--teal);line-height:1;font-weight:400;}
  .family-meta{font-size:11px;color:var(--light);letter-spacing:1px;text-transform:uppercase;margin-top:4px;}
  .family-row{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--sand-mid);padding:11px 0;font-size:13px;color:var(--mid);font-weight:300;}
  .family-row strong{font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--teal);font-weight:400;}
  .family-next{margin-top:10px;background:var(--seafoam-pale);border-radius:14px;padding:12px;font-size:13px;color:var(--mid);font-weight:300;line-height:1.45;}
  .family-note{font-family:'Cormorant Garamond',serif;font-style:italic;color:var(--teal);font-size:16px;margin-top:12px;}
  .year-stats{display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:12px;margin-bottom:22px;}
  .year-stat-card{background:rgba(253,250,246,0.72);border:1px solid var(--sand-mid);border-radius:18px;padding:16px;box-shadow:0 12px 30px rgba(14,26,22,0.04);}
  .year-stat-k{font-size:10px;letter-spacing:1.7px;text-transform:uppercase;color:var(--light);margin-bottom:8px;}
  .year-stat-v{font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--teal);font-weight:400;line-height:1.05;}
  .year-stat-sub{font-size:11px;color:var(--mid);font-weight:300;margin-top:5px;}


  /* ── FAMILY PHOTO DROP ── */
  .photos-wrap{padding:32px;max-width:1080px;width:100%;position:relative;}
  .photo-drop{margin-top:22px;border:1.5px dashed rgba(26,107,90,0.32);border-radius:28px;background:linear-gradient(135deg,rgba(253,250,246,0.9),rgba(238,248,245,0.82));padding:42px;display:grid;grid-template-columns:1fr auto;gap:28px;align-items:center;box-shadow:0 18px 52px rgba(14,26,22,0.07);position:relative;overflow:hidden;}
  .photo-drop::after{content:'🌴';position:absolute;right:32px;bottom:-34px;font-size:132px;opacity:0.055;pointer-events:none;}
  .photo-drop-title{font-family:'Cormorant Garamond',serif;font-size:34px;color:var(--teal);font-weight:300;line-height:1.05;margin-bottom:10px;}
  .photo-drop-text{font-size:15px;color:var(--mid);font-weight:300;line-height:1.7;max-width:560px;}
  .photo-upload-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;padding:15px 28px;border-radius:999px;background:linear-gradient(135deg,var(--teal),var(--teal-mid));color:var(--white);font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 28px rgba(46,155,127,0.22);white-space:nowrap;}
  .photo-upload-btn input{position:absolute;inset:0;opacity:0;cursor:pointer;}
  .photo-preview-grid{margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;}
  .photo-preview{aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:var(--white);border:1px solid var(--sand-mid);box-shadow:0 12px 28px rgba(14,26,22,0.07);position:relative;}
  .photo-preview img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-preview span{position:absolute;left:10px;bottom:10px;background:rgba(14,26,22,0.58);color:white;border-radius:999px;padding:4px 10px;font-size:10px;letter-spacing:1px;text-transform:uppercase;backdrop-filter:blur(8px);}
  .photo-empty-strip{margin-top:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .photo-empty-card{height:150px;border-radius:20px;background:rgba(253,250,246,0.65);border:1px solid rgba(200,184,152,0.42);display:flex;align-items:center;justify-content:center;color:rgba(26,107,90,0.22);font-size:34px;}



  /* ── ALIVE CALENDAR ATMOSPHERE ── */
  @keyframes casaAtmosphere{
    0%{background-position:0% 45%,100% 65%,0 0;filter:saturate(1);}
    33%{background-position:18% 30%,82% 60%,0 0;filter:saturate(1.03);}
    66%{background-position:42% 22%,70% 78%,0 0;filter:saturate(1.06);}
    100%{background-position:0% 45%,100% 65%,0 0;filter:saturate(1);}
  }
  .app-shell{
    background:
      radial-gradient(circle at 14% 18%,rgba(91,191,163,0.16),transparent 30%),
      radial-gradient(circle at 88% 76%,rgba(232,137,74,0.16),transparent 32%),
      linear-gradient(130deg,#F8F2E7 0%,#F2E8D7 35%,#EEF8F5 68%,#E9DCC8 100%) !important;
    background-size:130% 130%,140% 140%,100% 100%;
    animation:casaAtmosphere 240s ease-in-out infinite;
  }
  .app-shell::before{content:'' !important;position:fixed;inset:98px 280px 0 0;pointer-events:none;z-index:0;opacity:1;background:
    linear-gradient(90deg,transparent 0 12%,rgba(26,107,90,0.035) 12.2% 12.6%,transparent 12.8% 100%),
    linear-gradient(0deg,transparent 0 18%,rgba(26,107,90,0.028) 18.2% 18.55%,transparent 18.8% 100%),
    radial-gradient(circle at 28% 34%,transparent 0 82px,rgba(26,107,90,0.03) 83px 84px,transparent 85px),
    radial-gradient(circle at 68% 62%,transparent 0 118px,rgba(14,26,22,0.025) 119px 120px,transparent 121px);
    background-size:180px 180px,220px 220px,100% 100%,100% 100%;}
  .app-shell::after{content:'Sunset Key';position:fixed;right:330px;bottom:28px;font-family:'Cormorant Garamond',serif;font-size:72px;font-style:italic;color:rgba(26,107,90,0.045);pointer-events:none;z-index:0;}
  .cal-main-area{z-index:1;}
  .calendar-hero-row{display:grid;grid-template-columns:minmax(280px,1fr) 250px;gap:14px;margin-bottom:22px;align-items:stretch;}
  .house-status-card,.calendar-weather-card{background:rgba(253,250,246,0.78);border:1px solid rgba(232,220,200,0.9);border-radius:24px;padding:20px 22px;box-shadow:0 18px 50px rgba(14,26,22,0.08);backdrop-filter:blur(12px);position:relative;overflow:hidden;}
  .house-status-card::after{content:'';position:absolute;right:-28px;bottom:-38px;width:160px;height:160px;border-radius:50%;background:rgba(91,191,163,0.10);}
  .house-status-label,.calendar-weather-label{font-size:10px;letter-spacing:2.6px;text-transform:uppercase;color:var(--teal-mid);margin-bottom:10px;font-weight:400;}
  .house-status-main{display:flex;align-items:center;gap:12px;font-family:'Cormorant Garamond',serif;font-size:30px;color:var(--teal);font-weight:400;line-height:1;}
  .status-dot-live{width:11px;height:11px;border-radius:50%;background:var(--teal-mid);box-shadow:0 0 0 7px rgba(46,155,127,0.11);}
  .status-dot-live.open{background:var(--sunset);box-shadow:0 0 0 7px rgba(232,137,74,0.12);}
  .house-status-sub{margin-top:9px;font-size:14px;color:var(--mid);font-weight:300;line-height:1.55;}
  .calendar-weather-card{display:flex;align-items:center;justify-content:space-between;gap:16px;}
  .calendar-weather-temp{font-family:'Cormorant Garamond',serif;font-size:48px;color:var(--teal);line-height:.85;font-weight:400;}
  .calendar-weather-cond{font-size:13px;color:var(--mid);font-weight:300;line-height:1.45;}
  .calendar-weather-emoji{font-size:34px;}
  .occupancy-board{background:rgba(253,250,246,0.74);border:1px solid rgba(232,220,200,0.95);border-radius:30px;padding:28px;box-shadow:0 24px 70px rgba(14,26,22,0.10);backdrop-filter:blur(14px);position:relative;overflow:hidden;}
  .occupancy-board::before{content:'Occupancy';position:absolute;right:28px;top:18px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:42px;color:rgba(26,107,90,0.055);pointer-events:none;}
  .occupancy-row{display:grid;grid-template-columns:72px 1fr 70px;gap:18px;align-items:center;padding:13px 0;border-bottom:1px solid rgba(232,220,200,0.72);position:relative;z-index:1;}
  .occupancy-row:last-child{border-bottom:none;}
  .occ-month{font-family:'Cormorant Garamond',serif;font-size:24px;font-style:italic;color:var(--teal);letter-spacing:.6px;}
  .occ-track{height:28px;border-radius:999px;background:linear-gradient(90deg,rgba(245,239,227,0.98),rgba(232,220,200,0.72));position:relative;overflow:hidden;border:1px solid rgba(200,184,152,0.42);box-shadow:inset 0 1px 3px rgba(14,26,22,0.06);}
  .occ-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--teal),var(--teal-light));box-shadow:0 5px 18px rgba(46,155,127,0.22);min-width:0;transition:width .5s ease;}
  .occ-segment{position:absolute;top:4px;bottom:4px;border-radius:999px;background:var(--member-color);box-shadow:0 2px 10px rgba(14,26,22,.14);opacity:.95;}
  .occ-holiday{position:absolute;top:50%;width:7px;height:7px;border-radius:50%;background:var(--sunset);transform:translate(-50%,-50%);box-shadow:0 0 0 4px rgba(232,137,74,0.12);}
  .occ-percent{text-align:right;font-size:13px;color:var(--mid);font-weight:400;}
  .occ-detail{grid-column:2 / span 2;margin-top:-6px;font-size:12px;color:var(--light);font-weight:300;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .view-toggle{display:flex;border:1px solid rgba(200,184,152,.7);background:rgba(253,250,246,.7);border-radius:999px;padding:3px;}
  .view-toggle button{border:0;background:transparent;border-radius:999px;padding:7px 13px;font-family:'Jost',sans-serif;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--mid);cursor:pointer;}
  .view-toggle button.active{background:var(--teal);color:var(--white);}
  .memory-hero{background:linear-gradient(135deg,rgba(253,250,246,.82),rgba(238,248,245,.82)),url('') ;border:1px solid rgba(232,220,200,.9);border-radius:34px;padding:46px;box-shadow:0 24px 70px rgba(14,26,22,.09);position:relative;overflow:hidden;}
  .memory-hero::before{content:'Family Memories';position:absolute;right:28px;bottom:-10px;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:54px;color:rgba(26,107,90,.06);}
  .memory-empty{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;margin-top:22px;align-items:stretch;}
  .memory-album-card{min-height:280px;border-radius:30px;background:linear-gradient(135deg,rgba(14,26,22,.74),rgba(26,107,90,.5)),url(${sunset_pool});background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;padding:30px;color:var(--white);box-shadow:0 18px 52px rgba(14,26,22,.16);}
  .memory-album-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;line-height:1;}
  .memory-album-sub{font-size:13px;color:rgba(255,255,255,.68);font-weight:300;margin-top:8px;line-height:1.5;}
  .photo-drop{border-style:solid !important;background:rgba(253,250,246,.78) !important;backdrop-filter:blur(10px);}

  @media(max-width:900px){
    .about{grid-template-columns:1fr;padding:60px 28px;gap:48px;}
    .home-weather-section{padding:36px 20px 18px;}
    .home-weather-grid{grid-template-columns:1fr;}
    .home-share-card{grid-template-columns:1fr;padding:22px;}
    .home-share-actions{flex-wrap:wrap;}
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
    .year-stats{grid-template-columns:1fr 1fr;}
    .mini-stats{grid-template-columns:1fr 1fr;}
    .photo-drop{grid-template-columns:1fr;padding:28px;}
    .calendar-hero-row,.memory-empty{grid-template-columns:1fr;}
    .occupancy-row{grid-template-columns:54px 1fr 48px;gap:10px;}
    .occ-detail{display:none;}
    .photo-empty-strip{grid-template-columns:1fr;}
    .hero-title{font-size:clamp(62px,18vw,96px);}
    .hero-sub{font-size:18px;margin-bottom:34px;}
    .hero-pills{gap:7px;margin-bottom:30px;}
    .hero-pill{font-size:9px;padding:7px 12px;}
    .btn-cta-primary{padding:14px 30px;}
    .app-shell{background:linear-gradient(140deg,#f5efe3 0%,#eef8f5 55%,#f9efe2 100%);}
    .app-header{height:auto;min-height:58px;padding-top:10px;padding-bottom:10px;align-items:flex-start;gap:10px;}
    .app-brand{flex-direction:column;gap:3px;align-items:flex-start;}
    .app-header-right{gap:6px;flex-wrap:wrap;justify-content:flex-end;}
    .app-user-dot{width:24px;height:24px;font-size:11px;}
    .btn-home,.btn-signout{padding:6px 10px;font-size:10px;}
    .app-nav{overflow-x:auto;gap:4px;scrollbar-width:none;}
    .app-nav::-webkit-scrollbar{display:none;}
    .app-tab{flex:0 0 auto;padding:13px 14px;font-size:10px;}
    .cal-title{font-size:32px;}
    .month-header,.year-header{align-items:flex-start;}
    .calendar-hero-row{gap:12px;}
    .house-status-card,.calendar-weather-card{border-radius:20px;padding:16px 18px;}
    .calendar-weather-temp{font-size:38px;}
    .year-stats{gap:10px;}
    .year-stat-card{padding:14px;border-radius:18px;}
    .year-stat-v{font-size:24px;}
    .page-sheet{padding:12px;border-radius:22px;overflow:hidden;}
    .month-grid-header{display:none;}
    .month-grid{display:flex;flex-direction:column;gap:8px;}
    .month-cell{min-height:0;border-radius:16px;padding:12px 13px;background:rgba(253,250,246,0.92);border:1px solid rgba(232,220,200,0.9);box-shadow:0 8px 22px rgba(14,26,22,0.05);}
    .month-cell.other-month{display:none;}
    .month-date-row{margin-bottom:8px;}
    .mobile-day-name{display:block;}
    .booking-pill{font-size:12px;padding:6px 10px;max-width:100%;}
    .holiday-chip{align-self:flex-start;margin-top:2px;}
    .day-weather{margin-top:8px;border-top:1px solid rgba(232,220,200,0.65);padding-top:8px;font-size:11px;}
    .day-weather-emoji{font-size:16px;}
    .forecast-note{text-align:left;margin:0 0 10px;font-size:10px;}
    .year-grid{overflow-x:auto;border-radius:20px;padding:10px;}
    .year-row{min-width:760px;grid-template-columns:44px repeat(31,20px);}
    .year-cell{height:28px;border-radius:6px;}
    .year-label{font-size:13px;}
    .occupancy-board{padding:18px;border-radius:24px;}
    .occupancy-row{padding:13px 0;}
    .occ-month{font-size:17px;}
    .memory-hero{padding:28px;border-radius:26px;}
    .memory-album-card{min-height:230px;border-radius:24px;}
    .modal{padding:26px;width:92%;max-height:88vh;overflow:auto;}
  }

  @media(max-width:520px){
    .hero-top{padding:16px 16px;}
    .hero-logo{font-size:17px;}
    .btn-req-small{padding:8px 12px;font-size:9px;letter-spacing:1.3px;}
    .hero-content{padding:0 20px;}
    .hero-title{letter-spacing:-1.5px;}
    .home-weather-grid .weather-temp{font-size:44px;}
    .estate-footer{flex-direction:column;gap:8px;text-align:center;}
    .auth-screen{padding:16px;}
    .auth-right{padding:34px 24px;}
    .auth-title{font-size:34px;}
    .cal-main-area{padding:14px;}
    .cal-title{font-size:28px;}
    .btn-nav{width:30px;height:30px;}
    .month-nav{gap:8px;}
    .year-stats{grid-template-columns:1fr;}
    .calendar-weather-card{align-items:flex-start;}
    .calendar-weather-emoji{font-size:28px;}
    .whos-wrap,.req-wrap-app,.family-wrap,.photos-wrap{padding:20px 14px;}
    .whos-card{padding:16px;align-items:flex-start;}
    .whos-av{width:38px;height:38px;}
    .req-card{padding:18px;}
    .req-top{gap:10px;}
    .modal-actions{flex-wrap:wrap;}
    .btn-remove{width:100%;margin-right:0;}
    .btn-cancel,.btn-save{flex:1;}
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

      <section className="home-weather-section">
        <div className="home-weather-grid">
          <WeatherCard/>
          <div className="home-share-card">
            <div>
              <div className="home-share-kicker">For family and friends</div>
              <div className="home-share-title">Where every visit starts.</div>
              <div className="home-share-text">Check availability, request dates, and see who's home.</div>
            </div>
            <div className="home-share-actions">
              <button className="btn-share-home" onClick={()=>navigator.clipboard?.writeText(window.location.href).then(()=>alert("Link copied."))}>Copy Link</button>
              <button className="btn-share-home btn-share-secondary" onClick={onRequestStay}>Request Stay</button>
            </div>
          </div>
        </div>
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
      <div className="auth-glow"/>
      <div className="auth-palm top">🌴</div>
      <div className="auth-palm mid">🌴</div>
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
function weatherCodeLabel(code){
  const map={0:["Clear","☀️"],1:["Mostly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Cloudy","☁️"],45:["Foggy","🌫️"],48:["Foggy","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],95:["Thunderstorms","⛈️"]};
  return map[code]||["Key West weather","🌴"];
}
function WeatherCard(){
  const [weather,setWeather]=useState(null);
  useEffect(()=>{
    let alive=true;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&timezone=America/New_York")
      .then(r=>r.json()).then(d=>{if(alive)setWeather(d.current||null);}).catch(()=>{});
    return()=>{alive=false;};
  },[]);
  if(!weather)return <div className="status-card"><div className="weather-label">Key West Weather</div><div className="weather-cond">Loading island weather...</div></div>;
  const [label,emoji]=weatherCodeLabel(weather.weathercode);
  const temp=Math.round(weather.temperature_2m);
  const wind=Math.round(weather.windspeed_10m);
  const note=temp>=82?"Warm pool weather. Keep an eye on afternoon showers.":temp>=72?"Comfortable island weather for the porch and pool.":"A cooler Keys day — good for the veranda.";
  return(
    <div className="status-card">
      <div className="weather-label">Key West Weather</div>
      <div className="weather-top"><div className="weather-temp">{temp}°</div><div className="weather-emoji">{emoji}</div></div>
      <div className="weather-cond">{label} · wind {wind} mph</div>
      <div className="weather-note">{note}</div>
    </div>
  );
}

function CompactWeatherCard(){
  const [weather,setWeather]=useState(null);
  useEffect(()=>{
    let alive=true;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&timezone=America/New_York")
      .then(r=>r.json()).then(d=>{if(alive)setWeather(d.current||null);}).catch(()=>{});
    return()=>{alive=false;};
  },[]);
  if(!weather)return <div className="calendar-weather-card"><div><div className="calendar-weather-label">Key West</div><div className="calendar-weather-cond">Loading weather...</div></div><div className="calendar-weather-emoji">🌴</div></div>;
  const [label,emoji]=weatherCodeLabel(weather.weathercode);
  return <div className="calendar-weather-card"><div><div className="calendar-weather-label">Key West Today</div><div className="calendar-weather-temp">{Math.round(weather.temperature_2m)}°</div><div className="calendar-weather-cond">{label} · wind {Math.round(weather.windspeed_10m)} mph</div></div><div className="calendar-weather-emoji">{emoji}</div></div>;
}

function useDailyForecast(){
  const [daily,setDaily]=useState({});
  useEffect(()=>{
    let alive=true;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=16")
      .then(r=>r.json())
      .then(d=>{
        if(!alive||!d.daily?.time)return;
        const next={};
        d.daily.time.forEach((date,i)=>{
          const [label,emoji]=weatherCodeLabel(d.daily.weathercode?.[i]);
          next[date]={
            label,
            emoji,
            high:Math.round(d.daily.temperature_2m_max?.[i] ?? 0),
            low:Math.round(d.daily.temperature_2m_min?.[i] ?? 0),
            rain:d.daily.precipitation_probability_max?.[i]
          };
        });
        setDaily(next);
      }).catch(()=>{});
    return()=>{alive=false;};
  },[]);
  return daily;
}
function CalSidebar({bookings,isGuest}){
  const ts=todayStr();
  const now=new Date();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const upcoming=visible.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,8);
  const next=upcoming[0];
  const mo=monthOpenDays(now.getFullYear(),now.getMonth(),bookings,isGuest);
  return(
    <div className="cal-sidebar">
      <WeatherCard/>
      <div className="mini-stats">
        <div className="mini-stat"><div className="mini-num">{mo.open}</div><div className="mini-label">Open days</div></div>
        <div className="mini-stat"><div className="mini-num">{mo.booked}</div><div className="mini-label">Booked days</div></div>
      </div>
      <div className="sidebar-title">At the House</div>
      <div className="sidebar-sub">{next?`Next arrival: ${fmt(next.startDate)}`:"Upcoming stays"}</div>
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
  const [view,setView]=useState("ribbon");
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;

  const getDay=(y,m,d)=>{
    const ds=dateStr(y,m,d);
    return visible.filter(b=>isInRange(ds,b.startDate,b.endDate));
  };
  const bookedDays=countBookedDaysInYear(year,bookings,isGuest);
  const holidays=getUSHolidays(year);
  const nextStay=visible.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
  const currentStay=visible.find(b=>b.startDate<=ts&&b.endDate>=ts);
  const busiest=MONTHS.map((m,i)=>({m,booked:monthOpenDays(year,i,bookings,isGuest).booked})).sort((a,b)=>b.booked-a.booked)[0];

  const monthSummary=(mi)=>{
    const dim=daysInMonth(year,mi);
    const days=new Set();
    visible.forEach(b=>{
      for(let d=1;d<=dim;d++){
        const ds=dateStr(year,mi,d);
        if(isInRange(ds,b.startDate,b.endDate)) days.add(ds);
      }
    });
    const stays=visible.filter(b=>{
      const first=dateStr(year,mi,1), last=dateStr(year,mi,dim);
      return b.startDate<=last && b.endDate>=first;
    });
    const pct=Math.round((days.size/dim)*100);
    return {dim,booked:days.size,pct,stays};
  };

  const segmentFor=(b,mi,dim)=>{
    const startDay=Math.max(1,Number(b.startDate.slice(5,7))===mi+1&&Number(b.startDate.slice(0,4))===year?Number(b.startDate.slice(8,10)):1);
    const endDay=Math.min(dim,Number(b.endDate.slice(5,7))===mi+1&&Number(b.endDate.slice(0,4))===year?Number(b.endDate.slice(8,10)):dim);
    const left=((startDay-1)/dim)*100;
    const width=Math.max(3,((endDay-startDay+1)/dim)*100);
    return {left,width};
  };

  return(
    <>
      <div className="year-header">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="btn-nav" onClick={()=>setYear(y=>y-1)}>‹</button>
          <div className="cal-title">{year} Occupancy</div>
          <button className="btn-nav" onClick={()=>setYear(y=>y+1)}>›</button>
        </div>
        <div className="cal-controls">
          <div className="view-toggle">
            <button className={view==="ribbon"?"active":""} onClick={()=>setView("ribbon")}>Ribbon</button>
            <button className={view==="heatmap"?"active":""} onClick={()=>setView("heatmap")}>Grid</button>
          </div>
          <div className="year-legend">
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(155,123,168,0.5)",border:"2px solid #9B7BA8"}}/>Family</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"rgba(46,155,127,0.5)",border:"2px solid #2E9B7F"}}/>Open</div>
            <div className="legend-item"><div className="legend-dot" style={{background:"var(--sunset)",border:"2px solid rgba(232,137,74,0.2)",borderRadius:"50%"}}/>US holidays</div>
          </div>
          {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
        </div>
      </div>
      <div className="calendar-hero-row">
        <div className="house-status-card">
          <div className="house-status-label">House Status</div>
          <div className="house-status-main"><span className={`status-dot-live ${currentStay?"":"open"}`}/>{currentStay?"House occupied":"House available"}</div>
          <div className="house-status-sub">{currentStay?`${currentStay.name} is home · ${fmt(currentStay.startDate)} — ${fmt(currentStay.endDate)}`:nextStay?`Next arrival: ${nextStay.name} · ${fmt(nextStay.startDate)}`:"No upcoming stays on the books."}</div>
        </div>
        <CompactWeatherCard/>
      </div>
      <div className="year-stats">
        <div className="year-stat-card"><div className="year-stat-k">Booked this year</div><div className="year-stat-v">{bookedDays} days</div><div className="year-stat-sub">Across family + open stays</div></div>
        <div className="year-stat-card"><div className="year-stat-k">US holidays</div><div className="year-stat-v">{holidays.length}</div><div className="year-stat-sub">Marked on the calendar</div></div>
        <div className="year-stat-card"><div className="year-stat-k">Next stay</div><div className="year-stat-v">{nextStay?fmt(nextStay.startDate):"Open"}</div><div className="year-stat-sub">{nextStay?nextStay.name:"No upcoming stays"}</div></div>
        <div className="year-stat-card"><div className="year-stat-k">Busiest month</div><div className="year-stat-v">{busiest?.booked?busiest.m:"—"}</div><div className="year-stat-sub">{busiest?.booked||0} booked days</div></div>
      </div>
      <div className="page-sheet" key={`${year}-${view}`}>
        {view==="ribbon"?(
          <div className="occupancy-board">
            {MONTHS.map((m,mi)=>{
              const summary=monthSummary(mi);
              const monthHolidays=holidays.filter(h=>Number(h.date.slice(5,7))===mi+1);
              return(
                <div key={m} className="occupancy-row">
                  <div className="occ-month">{m}</div>
                  <div className="occ-track">
                    <div className="occ-fill" style={{width:`${summary.pct}%`}}/>
                    {summary.stays.map((b,i)=>{const seg=segmentFor(b,mi,summary.dim);return <button key={`${b.id}-${i}`} className="occ-segment" style={{left:`${seg.left}%`,width:`${seg.width}%`,"--member-color":b.color||DEFAULT_COLOR}} onClick={()=>setEditB(b)} title={`${b.name} · ${fmt(b.startDate)} — ${fmt(b.endDate)}`}/>;})}
                    {monthHolidays.map(h=>{const day=Number(h.date.slice(8,10));return <span key={h.date} className="occ-holiday" style={{left:`${((day-.5)/summary.dim)*100}%`}} title={h.name}/>;})}
                  </div>
                  <div className="occ-percent">{summary.pct}%</div>
                  <div className="occ-detail">{summary.stays.length?summary.stays.map(b=>`${b.name}: ${fmt(b.startDate)}–${fmt(b.endDate)}`).join(" · "):"Open month"}</div>
                </div>
              );
            })}
          </div>
        ):(
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
                  const holiday=getHolidayByDate(ds);
                  const isToday=ds===ts;
                  const bg=bs.length>0
                    ?bs.length===1?bs[0].color||DEFAULT_COLOR
                    :`linear-gradient(135deg,${bs.map(b=>b.color||DEFAULT_COLOR).join(",")})`
                    :undefined;
                  const names=[...bs.map(b=>b.name), ...(holiday?[holiday.name]:[])].join(" · ");
                  return(
                    <div key={di} className={`year-cell ${isToday?"is-today":""}`}
                      style={bg?{background:bg}: {}}
                      onClick={()=>bs.length&&setEditB(bs[0])}
                      title={names}>
                      {bs.length===1&&<span style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.9)",letterSpacing:0,lineHeight:1}}>{bs[0].name?.[0]?.toUpperCase()}</span>}
                      {bs.length>1&&<span style={{fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.9)"}}>{bs.length}</span>}
                      {!bs.length&&holiday&&<span className="holiday-mini">✦</span>}
                      {holiday&&<span className={`holiday-dot ${holiday.tone==="social"?"social":""}`}/>}                    
                      {names&&<div className="cell-tip">{names}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        )}
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
  const dailyForecast=useDailyForecast();

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
  const mo=monthOpenDays(year,month,bookings,isGuest);
  const monthHolidays=getUSHolidays(year).filter(h=>Number(h.date.slice(5,7))===month+1);
  const nextStay=visible.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];

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
      <div className="calendar-hero-row">
        <div className="house-status-card">
          <div className="house-status-label">House Status</div>
          <div className="house-status-main"><span className={`status-dot-live ${nextStay?"":"open"}`}/>{nextStay?"Next arrival set":"Open calendar"}</div>
          <div className="house-status-sub">{nextStay?`${nextStay.name} arrives ${fmt(nextStay.startDate)} · ${fmt(nextStay.startDate)} — ${fmt(nextStay.endDate)}`:"No upcoming stays on the books."}</div>
        </div>
        <CompactWeatherCard/>
      </div>
      <div className="year-stats">
        <div className="year-stat-card"><div className="year-stat-k">Open days</div><div className="year-stat-v">{mo.open}</div><div className="year-stat-sub">Available this month</div></div>
        <div className="year-stat-card"><div className="year-stat-k">Booked days</div><div className="year-stat-v">{mo.booked}</div><div className="year-stat-sub">Family + open stays</div></div>
        <div className="year-stat-card"><div className="year-stat-k">Holidays</div><div className="year-stat-v">{monthHolidays.length}</div><div className="year-stat-sub">{monthHolidays.map(h=>h.name).slice(0,2).join(" · ")||"None this month"}</div></div>
        <div className="year-stat-card"><div className="year-stat-k">Next arrival</div><div className="year-stat-v">{nextStay?fmt(nextStay.startDate):"Open"}</div><div className="year-stat-sub">{nextStay?nextStay.name:"No upcoming stays"}</div></div>
      </div>
      <div className="forecast-note">Daily weather appears for the live Key West forecast window.</div>
      <div className="page-sheet" key={`${year}-${month}`}>
      <div className="month-grid-header">{DAY_NAMES.map(d=><div key={d} className="month-day-label">{d}</div>)}</div>
      <div className="month-grid">
        {cells.map((cell,i)=>{
          const bs=bForDay(cell.day,cell.current);
          const isToday=cell.current&&dateStr(year,month,cell.day)===ts;
          const isEmpty=cell.current&&bs.length===0;
          const ds=cell.current?dateStr(year,month,cell.day):null;
          const holiday=ds?getHolidayByDate(ds):null;
          const dayWeather=ds?dailyForecast[ds]:null;
          const weekday=ds?DAY_NAMES[new Date(ds+"T12:00:00").getDay()]:"";
          return(
            <div key={i} className={`month-cell ${!cell.current?"other-month":""} ${isToday?"today-cell":""} ${isEmpty?"is-empty":""}`}>
              <div className="month-date-row"><div className="month-date-num">{cell.day}</div><div className="mobile-day-name">{weekday}</div></div>
              {bs.slice(0,3).map(b=>(
                <div key={b.id} className="booking-pill" style={{background:b.color||DEFAULT_COLOR}} onClick={()=>setDetailB(b)} title={b.name}>
                  {b.name}{b.note?` · ${b.note}`:""}
                </div>
              ))}
              {bs.length>3&&<div className="more-chip">+{bs.length-3} more</div>}
              {holiday&&<div className="holiday-chip">✦ {holiday.name}</div>}
              {dayWeather&&<div className="day-weather" title={`${dayWeather.label} · high ${dayWeather.high}° / low ${dayWeather.low}°${dayWeather.rain!=null?` · ${dayWeather.rain}% rain`:""}`}><span className="day-weather-emoji">{dayWeather.emoji}</span><span className="day-weather-temp">{dayWeather.high}°/{dayWeather.low}°</span></div>}
            </div>
          );
        })}
      </div>
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


// ── FAMILY PROFILES ──────────────────────────────────────────────────────────
function FamilyProfilesView({bookings,isGuest}){
  const ts=todayStr();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const derived=[...new Map(visible.map(b=>[b.name,{name:b.name,color:b.color||DEFAULT_COLOR}])).values()].filter(m=>m.name?.toLowerCase()!=="maahi");
  const members=(derived.length?derived:[{name:"Jake",color:DEFAULT_COLOR}]).sort((a,b)=>a.name.localeCompare(b.name));
  const thisYear=new Date().getFullYear();
  const countDays=(arr)=>{
    const set=new Set();
    arr.forEach(b=>{
      const start=new Date(b.startDate+"T12:00:00"), end=new Date(b.endDate+"T12:00:00");
      for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
        if(d.getFullYear()===thisYear)set.add(dateStr(d.getFullYear(),d.getMonth(),d.getDate()));
      }
    });
    return set.size;
  };
  return(
    <div className="family-wrap">
      <div className="section-title">Family Profiles</div>
      <div className="section-sub">A simple view of who uses the house and when. This uses existing booking data only.</div>
      {members.length===0?(
        <div className="empty-state"><div className="empty-icon">🌴</div><div className="empty-title">No profiles yet</div><div className="empty-sub">Add a stay and family profiles will appear automatically.</div></div>
      ):(
        <div className="family-grid">
          {members.map(m=>{
            const mine=visible.filter(b=>b.name===m.name).sort((a,b)=>a.startDate.localeCompare(b.startDate));
            const upcoming=mine.filter(b=>b.endDate>=ts);
            const next=upcoming[0];
            return(
              <div key={m.name} className="family-card" style={{"--member-color":m.color}}>
                <div className="family-head">
                  <div className="family-avatar" style={{background:m.color}}>{m.name?.[0]?.toUpperCase()}</div>
                  <div><div className="family-name">{m.name}</div><div className="family-meta">Casa Kallman</div></div>
                </div>
                <div className="family-row"><span>Upcoming stays</span><strong>{upcoming.length}</strong></div>
                <div className="family-row"><span>Days booked this year</span><strong>{countDays(mine)}</strong></div>
                <div className="family-row"><span>Total stays logged</span><strong>{mine.length}</strong></div>
                <div className="family-next">{next?<>Next stay: <strong>{fmt(next.startDate)} — {fmt(next.endDate)}</strong>{next.note?` · ${next.note}`:""}</>:"No upcoming stay yet."}</div>
                <div className="family-note">Favorite spot: add later</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── FAMILY PHOTOS ────────────────────────────────────────────────────────────
function FamilyPhotosView(){
  const [photos,setPhotos]=useState([]);
  const onPick=(e)=>{
    const files=Array.from(e.target.files||[]).slice(0,12);
    const next=files.map((file,i)=>({id:`${Date.now()}-${i}`,name:file.name,url:URL.createObjectURL(file)}));
    setPhotos(p=>[...next,...p].slice(0,18));
    e.target.value="";
  };
  return(
    <div className="photos-wrap">
      <div className="memory-hero">
        <div className="section-title">Family Memories</div>
        <div className="section-sub">A quiet house album for Casa Kallman. Uploads preview here for now; permanent shared storage can be added later without changing the look.</div>
        <div className="memory-empty">
          <div className="memory-album-card">
            <div className="memory-album-title">No memories added yet.</div>
            <div className="memory-album-sub">The first sunset dinner, pool afternoon, porch photo, or family weekend can live here.</div>
          </div>
          <div className="photo-drop">
            <div>
              <div className="photo-drop-title">Add the first memory.</div>
              <div className="photo-drop-text">Select photos from this computer to preview a polished memory wall for the family.</div>
            </div>
            <label className="photo-upload-btn">Upload Photos<input type="file" accept="image/*" multiple onChange={onPick}/></label>
          </div>
        </div>
      </div>
      {photos.length?(
        <div className="photo-preview-grid" style={{marginTop:24}}>
          {photos.map((p,i)=><div className="photo-preview" key={p.id}><img src={p.url} alt={p.name}/><span>Memory {i+1}</span></div>)}
        </div>
      ):(
        <div className="photo-empty-strip">
          <div className="photo-empty-card">☀</div>
          <div className="photo-empty-card">🌊</div>
          <div className="photo-empty-card">🌴</div>
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
    ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"},{id:"family",label:"Family"},{id:"photos",label:"Photos"}]
    :user?.isAdmin
      ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"},{id:"family",label:"Family"},{id:"photos",label:"Photos"},{id:"requests",label:"Requests"}]
      :[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"whos",label:"Who's There"},{id:"family",label:"Family"},{id:"photos",label:"Photos"}];

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
          {tab==="family"&&<FamilyProfilesView bookings={bookings} isGuest={isGuest}/>}
          {tab==="photos"&&<FamilyPhotosView/>}
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
