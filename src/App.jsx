import { useState, useEffect, useCallback, useRef } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const HERO = "https://photos.zillowstatic.com/fp/778e79f94a6dac02ad684702e2e0d7fc-cc_ft_1536.jpg";

// Color palette derived from house photos
const MEMBER_COLORS = [
  { id:"sunset",    hex:"#E8894A", label:"Sunset"    },
  { id:"pool",      hex:"#5BA4CF", label:"Pool Blue"  },
  { id:"teal",      hex:"#1A7A6B", label:"Deep Teal"  },
  { id:"terra",     hex:"#C17B5C", label:"Terracotta" },
  { id:"seafoam",   hex:"#6BB89A", label:"Seafoam"    },
  { id:"golden",    hex:"#D4A843", label:"Golden"     },
  { id:"orchid",    hex:"#9B7BA8", label:"Orchid"     },
  { id:"coral",     hex:"#E06B6B", label:"Coral"      },
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
const today = () => { const n=new Date(); return dateStr(n.getFullYear(),n.getMonth(),n.getDate()); };

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
    --radius: 10px;
  }

  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Jost',sans-serif;background:var(--white);color:var(--ink);min-height:100vh;overflow-x:hidden;}

  /* ── ESTATE PAGE ── */
  .estate{min-height:100vh;}

  .hero{
    height:100vh;position:relative;overflow:hidden;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
  }
  .hero-bg{
    position:absolute;inset:0;
    background:url('${HERO}') center/cover no-repeat;
    animation:zoom 18s ease-in-out infinite alternate;
  }
  @keyframes zoom{from{transform:scale(1)}to{transform:scale(1.06)}}
  .hero-overlay{
    position:absolute;inset:0;
    background:linear-gradient(
      175deg,
      rgba(14,26,22,0.25) 0%,
      rgba(14,26,22,0.4) 50%,
      rgba(14,26,22,0.75) 100%
    );
  }
  .hero-content{
    position:relative;z-index:2;text-align:center;padding:0 32px;
    animation:riseIn 1.4s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  @keyframes riseIn{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}

  .hero-eyebrow{
    font-family:'Jost',sans-serif;font-size:11px;font-weight:300;
    letter-spacing:5px;text-transform:uppercase;
    color:rgba(168,221,208,0.85);margin-bottom:24px;
  }
  .hero-title{
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(72px,12vw,130px);font-weight:300;
    color:var(--white);line-height:0.92;letter-spacing:-3px;
    margin-bottom:8px;
  }
  .hero-title em{font-style:italic;font-weight:300;}
  .hero-sub{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:20px;color:rgba(255,255,255,0.55);
    margin-bottom:52px;letter-spacing:1px;font-weight:300;
  }
  .hero-pills{
    display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:52px;
  }
  .hero-pill{
    font-size:11px;font-weight:300;letter-spacing:2px;text-transform:uppercase;
    color:rgba(255,255,255,0.7);
    border:1px solid rgba(255,255,255,0.2);border-radius:50px;
    padding:8px 18px;backdrop-filter:blur(8px);
    background:rgba(255,255,255,0.06);
  }
  .hero-cta{
    display:inline-block;padding:16px 44px;
    background:linear-gradient(135deg,var(--teal-mid),var(--teal-light));
    color:var(--white);border:none;border-radius:50px;
    font-family:'Jost',sans-serif;font-size:12px;font-weight:400;
    letter-spacing:2.5px;text-transform:uppercase;
    cursor:pointer;transition:all 0.3s;text-decoration:none;
    box-shadow:0 8px 32px rgba(46,155,127,0.35);
  }
  .hero-cta:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(46,155,127,0.45);}

  .hero-scroll{
    position:absolute;bottom:36px;left:50%;transform:translateX(-50%);
    z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;
    color:rgba(255,255,255,0.35);font-size:10px;letter-spacing:3px;text-transform:uppercase;
    font-family:'Jost',sans-serif;font-weight:300;
    animation:bob 2.5s ease-in-out infinite;
  }
  @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}

  .family-btn{
    position:absolute;top:32px;right:32px;z-index:10;
    font-family:'Jost',sans-serif;font-size:11px;font-weight:300;
    letter-spacing:2px;text-transform:uppercase;
    color:rgba(255,255,255,0.5);
    background:rgba(255,255,255,0.08);
    border:1px solid rgba(255,255,255,0.15);
    border-radius:50px;padding:10px 20px;
    cursor:pointer;transition:all 0.2s;backdrop-filter:blur(8px);
  }
  .family-btn:hover{color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.15);}

  /* Photo gallery */
  .gallery{
    display:grid;
    grid-template-columns:1.6fr 1fr;
    grid-template-rows:320px 240px;
    gap:4px;
    height:560px;
    overflow:hidden;
  }
  .gallery-main{grid-row:1/3;position:relative;overflow:hidden;}
  .gallery-cell{position:relative;overflow:hidden;}
  .gallery-img{
    width:100%;height:100%;object-fit:cover;
    transition:transform 0.8s ease;display:block;
  }
  .gallery-cell:hover .gallery-img,
  .gallery-main:hover .gallery-img{transform:scale(1.04);}
  .gallery-label{
    position:absolute;bottom:16px;left:16px;
    font-family:'Jost',sans-serif;font-size:10px;font-weight:300;
    letter-spacing:2px;text-transform:uppercase;
    color:rgba(255,255,255,0.7);
    background:rgba(14,26,22,0.5);
    padding:5px 12px;border-radius:50px;
    backdrop-filter:blur(8px);
  }

  /* About section */
  .about{
    display:grid;grid-template-columns:1fr 1fr;
    gap:80px;padding:100px 80px;align-items:start;
    max-width:1400px;margin:0 auto;
  }
  .about-left{}
  .about-tag{
    font-size:10px;font-weight:300;letter-spacing:3px;text-transform:uppercase;
    color:var(--teal-mid);margin-bottom:20px;
  }
  .about-title{
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(36px,4vw,56px);font-weight:300;
    color:var(--ink);line-height:1.1;margin-bottom:28px;
  }
  .about-body{
    font-size:16px;line-height:1.9;color:var(--mid);font-weight:300;
    margin-bottom:36px;
  }
  .about-tag2{
    font-size:10px;font-weight:300;letter-spacing:3px;text-transform:uppercase;
    color:var(--teal-mid);margin-bottom:20px;margin-top:60px;
  }
  .amenities{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .amenity{
    padding:20px;border:1px solid var(--sand-mid);border-radius:var(--radius);
    background:var(--white);
  }
  .amenity-icon{font-size:22px;margin-bottom:8px;}
  .amenity-name{
    font-family:'Cormorant Garamond',serif;font-size:18px;
    color:var(--teal);margin-bottom:4px;
  }
  .amenity-desc{font-size:12px;color:var(--light);line-height:1.5;font-weight:300;}

  .about-right{}
  .about-quote{
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:28px;font-weight:300;color:var(--teal);
    line-height:1.5;margin-bottom:40px;
    padding-left:24px;border-left:2px solid var(--teal-light);
  }
  .about-gallery-sm{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .about-img-wrap{border-radius:var(--radius);overflow:hidden;aspect-ratio:4/3;}
  .about-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s;}
  .about-img-wrap:hover img{transform:scale(1.05);}

  /* Request section */
  .request-section{background:var(--ink);padding:100px 80px;}
  .request-inner{max-width:680px;margin:0 auto;}
  .req-tag{font-size:10px;font-weight:300;letter-spacing:3px;text-transform:uppercase;color:var(--teal-light);margin-bottom:20px;}
  .req-title{
    font-family:'Cormorant Garamond',serif;
    font-size:clamp(40px,5vw,64px);font-weight:300;
    color:var(--white);line-height:1.05;margin-bottom:16px;
  }
  .req-sub{font-size:15px;color:rgba(255,255,255,0.4);margin-bottom:52px;font-weight:300;line-height:1.7;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:10px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;}
  .form-input{
    width:100%;padding:14px 18px;
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:var(--radius);font-size:15px;color:var(--white);
    outline:none;transition:border-color 0.2s;
    font-family:'Jost',sans-serif;font-weight:300;
  }
  .form-input:focus{border-color:rgba(91,191,163,0.5);}
  .form-input::placeholder{color:rgba(255,255,255,0.18);}
  textarea.form-input{resize:vertical;min-height:110px;}
  .btn-submit{
    width:100%;padding:16px;margin-top:8px;
    background:linear-gradient(135deg,var(--teal),var(--teal-mid));
    color:var(--white);border:none;border-radius:var(--radius);
    font-size:12px;font-weight:400;letter-spacing:2px;text-transform:uppercase;
    cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;
  }
  .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(46,155,127,0.3);}
  .btn-submit:disabled{opacity:0.4;cursor:not-allowed;transform:none;}

  .success-wrap{text-align:center;padding:60px 0;}
  .success-icon{font-size:52px;margin-bottom:20px;}
  .success-title{font-family:'Cormorant Garamond',serif;font-size:40px;color:var(--white);font-weight:300;margin-bottom:12px;}
  .success-sub{font-size:15px;color:rgba(255,255,255,0.4);font-weight:300;}

  .estate-footer{
    background:var(--ink);border-top:1px solid rgba(255,255,255,0.06);
    padding:28px 80px;display:flex;align-items:center;justify-content:space-between;
  }
  .footer-brand{font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(255,255,255,0.3);font-weight:300;}
  .footer-loc{font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:2px;text-transform:uppercase;font-weight:300;}

  /* ── AUTH ── */
  .auth-screen{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:var(--seafoam-pale);
  }
  .auth-wrap{display:grid;grid-template-columns:1fr 1fr;max-width:900px;width:95%;min-height:560px;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(14,26,22,0.12);}
  .auth-left{
    background:var(--teal);
    padding:52px;display:flex;flex-direction:column;justify-content:space-between;
    background-image:url('${HERO}');background-size:cover;background-position:center;
    position:relative;
  }
  .auth-left-overlay{position:absolute;inset:0;background:rgba(14,60,50,0.75);}
  .auth-left-content{position:relative;z-index:1;}
  .auth-left-title{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:300;color:var(--white);margin-bottom:8px;}
  .auth-left-sub{font-size:14px;color:rgba(255,255,255,0.55);font-weight:300;line-height:1.6;}
  .auth-left-quote{
    position:relative;z-index:1;
    font-family:'Cormorant Garamond',serif;font-style:italic;
    font-size:16px;color:rgba(255,255,255,0.5);font-weight:300;line-height:1.6;
  }
  .auth-right{background:var(--white);padding:52px;}
  .auth-back{font-size:12px;color:var(--light);cursor:pointer;margin-bottom:32px;display:inline-flex;align-items:center;gap:6px;background:none;border:none;font-family:'Jost',sans-serif;font-weight:300;letter-spacing:1px;transition:color 0.2s;}
  .auth-back:hover{color:var(--teal);}
  .auth-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:400;color:var(--teal);margin-bottom:6px;}
  .auth-sub{font-size:14px;color:var(--light);margin-bottom:32px;font-weight:300;}

  .field-group{margin-bottom:16px;}
  .field-label{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid);margin-bottom:8px;}
  .field-input{
    width:100%;padding:12px 16px;border:1.5px solid var(--sand-mid);
    border-radius:var(--radius);font-size:15px;color:var(--ink);background:var(--white);
    outline:none;transition:border-color 0.2s;font-family:'Jost',sans-serif;font-weight:300;
  }
  .field-input:focus{border-color:var(--teal-mid);}

  .color-picker{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;}
  .color-swatch{
    width:32px;height:32px;border-radius:50%;cursor:pointer;
    border:3px solid transparent;transition:all 0.2s;
  }
  .color-swatch.selected{border-color:var(--ink);transform:scale(1.15);}
  .color-swatch:hover{transform:scale(1.1);}

  .btn-primary{
    width:100%;padding:14px;background:var(--teal);color:var(--white);border:none;
    border-radius:var(--radius);font-size:12px;font-weight:400;letter-spacing:1.5px;
    text-transform:uppercase;cursor:pointer;transition:all 0.2s;margin-top:8px;
    font-family:'Jost',sans-serif;
  }
  .btn-primary:hover{background:var(--teal-mid);transform:translateY(-1px);}
  .toggle-mode{text-align:center;margin-top:18px;font-size:13px;color:var(--light);font-weight:300;}
  .toggle-mode button{background:none;border:none;color:var(--teal-mid);cursor:pointer;font-size:13px;font-family:'Jost',sans-serif;text-decoration:underline;text-underline-offset:3px;}
  .err{color:#c0392b;font-size:13px;margin-bottom:10px;font-weight:300;}

  /* ── APP SHELL ── */
  .app-shell{min-height:100vh;display:flex;flex-direction:column;background:var(--sand);}

  .app-header{
    background:var(--ink);padding:0 36px;height:60px;
    display:flex;align-items:center;justify-content:space-between;
    position:sticky;top:0;z-index:100;
  }
  .app-brand{display:flex;align-items:baseline;gap:10px;}
  .app-brand-name{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--white);}
  .app-brand-badge{
    font-size:9px;font-weight:300;letter-spacing:2px;text-transform:uppercase;
    color:var(--teal-light);padding:3px 8px;border:1px solid rgba(91,191,163,0.3);border-radius:20px;
  }
  .app-header-right{display:flex;align-items:center;gap:14px;}
  .app-user{font-size:12px;color:rgba(255,255,255,0.4);font-weight:300;letter-spacing:0.5px;}
  .app-user-dot{
    width:28px;height:28px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:500;color:white;flex-shrink:0;
  }
  .btn-signout{
    background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
    color:rgba(255,255,255,0.6);padding:6px 14px;border-radius:8px;font-size:11px;
    cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;letter-spacing:1px;
  }
  .btn-signout:hover{background:rgba(255,255,255,0.13);color:white;}

  .app-nav{
    background:var(--ink);border-bottom:1px solid rgba(255,255,255,0.07);
    padding:0 36px;display:flex;gap:0;
  }
  .app-tab{
    padding:13px 20px;font-size:11px;font-weight:300;letter-spacing:2px;
    text-transform:uppercase;color:rgba(255,255,255,0.4);cursor:pointer;
    border-bottom:2px solid transparent;transition:all 0.2s;
    background:none;border-top:none;border-left:none;border-right:none;
    border-bottom:2px solid transparent;
    font-family:'Jost',sans-serif;
  }
  .app-tab.active{color:var(--teal-light);border-bottom-color:var(--teal-light);}
  .app-tab:hover:not(.active){color:rgba(255,255,255,0.7);}

  /* View toggle */
  .view-toggle{
    display:inline-flex;background:var(--sand-mid);border-radius:8px;padding:3px;gap:2px;
  }
  .view-btn{
    padding:6px 14px;border-radius:6px;border:none;background:none;
    font-size:11px;font-weight:400;letter-spacing:1px;text-transform:uppercase;
    color:var(--mid);cursor:pointer;transition:all 0.2s;font-family:'Jost',sans-serif;
  }
  .view-btn.active{background:var(--white);color:var(--teal);box-shadow:0 1px 4px rgba(0,0,0,0.1);}

  /* ── YEAR VIEW ── */
  .year-wrap{padding:36px;max-width:1300px;margin:0 auto;width:100%;}
  .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px;}
  .cal-title{font-family:'Cormorant Garamond',serif;font-size:40px;color:var(--teal);font-weight:400;}
  .cal-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
  .btn-nav{
    width:34px;height:34px;border-radius:50%;border:1.5px solid var(--sand-dark);
    background:var(--white);color:var(--teal);cursor:pointer;font-size:14px;
    display:flex;align-items:center;justify-content:center;transition:all 0.2s;
  }
  .btn-nav:hover{background:var(--teal);color:var(--white);border-color:var(--teal);}
  .btn-add{
    padding:9px 20px;background:var(--sunset);color:var(--white);border:none;
    border-radius:var(--radius);font-size:11px;font-weight:400;letter-spacing:1.5px;
    text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;transition:all 0.2s;
  }
  .btn-add:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,137,74,0.3);}

  .year-grid{display:flex;flex-direction:column;gap:3px;background:var(--sand-mid);padding:3px;border-radius:12px;}
  .year-row{display:grid;grid-template-columns:44px repeat(31,1fr);gap:2px;align-items:center;}
  .year-label{font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:var(--light);text-align:right;padding-right:10px;}
  .year-cell{
    height:28px;border-radius:4px;background:var(--white);
    cursor:pointer;position:relative;transition:transform 0.1s,box-shadow 0.1s;
  }
  .year-cell:hover{transform:scale(1.2);z-index:2;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
  .year-cell.empty{background:rgba(245,239,227,0.4);cursor:default;pointer-events:none;}
  .year-cell.today{outline:2px solid var(--teal-mid);outline-offset:1px;}
  .year-cell.booked{opacity:0.95;}
  .cell-tip{
    position:absolute;bottom:calc(100%+6px);left:50%;transform:translateX(-50%);
    background:var(--ink);color:var(--white);padding:5px 10px;border-radius:6px;
    font-size:11px;white-space:nowrap;pointer-events:none;z-index:100;
    opacity:0;transition:opacity 0.15s;font-family:'Jost',sans-serif;font-weight:300;
  }
  .year-cell:hover .cell-tip{opacity:1;}

  .year-legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;}
  .legend-item{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--mid);font-weight:300;}
  .legend-dot{width:12px;height:12px;border-radius:3px;}

  /* ── MONTH VIEW ── */
  .month-wrap{padding:36px;max-width:1100px;margin:0 auto;width:100%;}
  .month-grid-header{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;}
  .month-day-label{text-align:center;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);padding:8px 0;}
  .month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
  .month-cell{
    min-height:120px;background:var(--white);border-radius:var(--radius);
    padding:10px 8px 8px;border:1.5px solid transparent;
    transition:border-color 0.15s;display:flex;flex-direction:column;
    position:relative;
  }
  .month-cell.other-month{background:rgba(253,250,246,0.5);opacity:0.5;}
  .month-cell.today-cell{border-color:var(--teal-mid);}
  .month-date-num{font-size:13px;font-weight:400;color:var(--mid);margin-bottom:6px;font-family:'Jost',sans-serif;}
  .month-cell.today-cell .month-date-num{
    color:var(--white);background:var(--teal-mid);width:24px;height:24px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;
  }

  /* Booking bars */
  .booking-bar{
    font-size:11px;font-weight:400;padding:4px 8px;border-radius:5px;
    margin-bottom:3px;cursor:pointer;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;transition:opacity 0.15s;line-height:1.3;
    color:white;letter-spacing:0.3px;
  }
  .booking-bar:hover{opacity:0.85;}
  .more-chip{font-size:10px;color:var(--light);padding:2px 4px;font-weight:300;}

  /* ── TIMELINE VIEW ── */
  .timeline-wrap{padding:36px;max-width:1200px;margin:0 auto;width:100%;overflow-x:auto;}
  .timeline-grid{position:relative;min-width:900px;}
  .timeline-header{display:flex;margin-bottom:8px;padding-left:120px;}
  .timeline-date-label{
    flex:1;text-align:center;font-size:9px;font-weight:400;
    letter-spacing:1.5px;text-transform:uppercase;color:var(--light);
  }
  .timeline-row{display:flex;align-items:center;margin-bottom:8px;position:relative;}
  .timeline-name{
    width:120px;flex-shrink:0;font-size:13px;font-weight:400;
    color:var(--mid);padding-right:16px;text-align:right;
    font-family:'Jost',sans-serif;
  }
  .timeline-track{
    flex:1;height:36px;background:var(--white);border-radius:6px;
    position:relative;overflow:hidden;
  }
  .timeline-bar{
    position:absolute;top:4px;bottom:4px;border-radius:4px;
    display:flex;align-items:center;padding:0 8px;
    font-size:11px;color:white;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;cursor:pointer;transition:opacity 0.2s;
  }
  .timeline-bar:hover{opacity:0.85;}
  .timeline-today{
    position:absolute;top:0;bottom:0;width:2px;background:var(--teal-mid);
    z-index:2;pointer-events:none;
  }
  .timeline-today::before{
    content:'Today';position:absolute;top:-18px;left:50%;transform:translateX(-50%);
    font-size:9px;color:var(--teal-mid);white-space:nowrap;letter-spacing:1px;
    text-transform:uppercase;font-family:'Jost',sans-serif;
  }

  /* ── WHO'S THERE ── */
  .whos-wrap{padding:36px;max-width:800px;margin:0 auto;width:100%;}
  .section-title{font-family:'Cormorant Garamond',serif;font-size:38px;color:var(--teal);margin-bottom:6px;font-weight:400;}
  .section-sub{font-size:14px;color:var(--light);margin-bottom:32px;font-weight:300;}
  .whos-list{display:flex;flex-direction:column;gap:10px;}
  .whos-card{
    background:var(--white);border-radius:14px;padding:20px 24px;
    display:flex;align-items:center;gap:16px;
    border:1px solid var(--sand-mid);transition:box-shadow 0.2s;
  }
  .whos-card.here-now{border-color:var(--teal-light);box-shadow:0 4px 20px rgba(46,155,127,0.12);}
  .whos-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:500;color:white;flex-shrink:0;}
  .whos-info{flex:1;}
  .whos-name{font-weight:400;font-size:16px;margin-bottom:3px;}
  .whos-dates{font-size:13px;color:var(--light);font-weight:300;}
  .whos-note{font-size:13px;color:var(--mid);font-style:italic;margin-top:3px;font-weight:300;}
  .here-badge{font-size:10px;background:rgba(46,155,127,0.12);color:var(--teal);padding:3px 10px;border-radius:20px;font-weight:400;letter-spacing:0.5px;margin-left:8px;}
  .vis-tag{font-size:10px;padding:3px 10px;border-radius:20px;font-weight:400;letter-spacing:0.5px;}
  .vis-family{background:rgba(155,123,168,0.12);color:#7B5A8A;}
  .vis-open{background:rgba(46,155,127,0.12);color:var(--teal);}

  .empty-state{text-align:center;padding:80px 24px;color:var(--light);}
  .empty-icon{font-size:52px;margin-bottom:16px;}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--teal);margin-bottom:8px;}
  .empty-sub{font-size:14px;font-weight:300;}

  /* ── REQUESTS ── */
  .req-wrap{padding:36px;max-width:800px;margin:0 auto;width:100%;}
  .req-card{
    background:var(--white);border-radius:14px;padding:24px;margin-bottom:12px;
    border:1px solid var(--sand-mid);
  }
  .req-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
  .req-name{font-family:'Cormorant Garamond',serif;font-size:24px;color:var(--teal);font-weight:400;}
  .req-email{font-size:13px;color:var(--light);font-weight:300;}
  .req-dates{font-size:14px;color:var(--mid);margin-bottom:10px;font-weight:300;}
  .req-msg{
    font-size:14px;color:var(--mid);font-style:italic;
    background:var(--seafoam-pale);padding:12px 16px;border-radius:8px;margin-bottom:16px;font-weight:300;
  }
  .req-actions{display:flex;gap:10px;}
  .btn-approve{padding:8px 20px;background:var(--teal);color:var(--white);border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-approve:hover{background:var(--teal-mid);}
  .btn-deny{padding:8px 20px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s;}
  .btn-deny:hover{background:#fff0f0;}
  .status-badge{font-size:10px;padding:4px 10px;border-radius:20px;font-weight:400;letter-spacing:0.5px;}
  .status-pending{background:rgba(232,137,74,0.12);color:#B8601A;}
  .status-approved{background:rgba(46,155,127,0.12);color:var(--teal);}
  .status-denied{background:rgba(192,57,43,0.08);color:#c0392b;}

  /* ── MODAL ── */
  .modal-overlay{
    position:fixed;inset:0;background:rgba(14,26,22,0.65);
    backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;
    z-index:1000;animation:fadeIn 0.2s ease;
  }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{
    background:var(--white);border-radius:20px;padding:40px;
    max-width:500px;width:94%;
    box-shadow:0 32px 80px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;
  }
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-title{font-family:'Cormorant Garamond',serif;font-size:30px;color:var(--teal);margin-bottom:24px;font-weight:400;}
  .modal-actions{display:flex;gap:10px;margin-top:24px;justify-content:flex-end;}
  .btn-cancel{padding:10px 20px;background:none;border:1.5px solid var(--sand-dark);border-radius:8px;font-size:12px;cursor:pointer;color:var(--mid);font-family:'Jost',sans-serif;letter-spacing:1px;transition:all 0.2s;text-transform:uppercase;}
  .btn-cancel:hover{border-color:var(--teal-mid);color:var(--teal);}
  .btn-save{padding:10px 24px;background:var(--teal);color:var(--white);border:none;border-radius:8px;font-size:12px;font-weight:400;cursor:pointer;font-family:'Jost',sans-serif;letter-spacing:1px;text-transform:uppercase;transition:background 0.2s;}
  .btn-save:hover{background:var(--teal-mid);}
  .btn-remove{padding:10px 20px;background:none;border:1.5px solid #ffb3b3;color:#c0392b;border-radius:8px;font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;margin-right:auto;transition:all 0.2s;letter-spacing:1px;text-transform:uppercase;}
  .btn-remove:hover{background:#fff0f0;}
  .vis-toggle{display:flex;gap:10px;margin-top:8px;}
  .vis-btn{flex:1;padding:10px;border-radius:8px;border:1.5px solid var(--sand-mid);background:var(--white);font-size:12px;cursor:pointer;font-family:'Jost',sans-serif;text-align:center;transition:all 0.2s;color:var(--mid);letter-spacing:0.5px;}
  .vis-btn.active-family{border-color:#9B7BA8;background:rgba(155,123,168,0.08);color:#7B5A8A;font-weight:500;}
  .vis-btn.active-open{border-color:var(--teal-mid);background:rgba(46,155,127,0.08);color:var(--teal);font-weight:500;}

  .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--teal);color:var(--white);padding:12px 28px;border-radius:50px;font-size:13px;z-index:2000;transition:transform 0.3s ease;pointer-events:none;white-space:nowrap;font-family:'Jost',sans-serif;letter-spacing:0.5px;}
  .toast.show{transform:translateX(-50%) translateY(0);}

  @media(max-width:900px){
    .about{grid-template-columns:1fr;padding:60px 32px;gap:48px;}
    .gallery{grid-template-columns:1fr;grid-template-rows:300px 160px 160px;height:auto;}
    .gallery-main{grid-row:auto;}
    .auth-wrap{grid-template-columns:1fr;}
    .auth-left{display:none;}
    .request-section{padding:60px 32px;}
    .estate-footer{padding:28px 32px;}
    .year-wrap,.month-wrap,.whos-wrap,.req-wrap{padding:20px;}
    .app-header{padding:0 20px;}
    .app-nav{padding:0 20px;}
    .app-user{display:none;}
    .about-gallery-sm{grid-template-columns:1fr;}
    .form-row{grid-template-columns:1fr;}
  }
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
function Toast({msg}){return <div className={`toast ${msg?"show":""}`}>{msg}</div>;}

// ── ESTATE PAGE ───────────────────────────────────────────────────────────────
function EstatePage({onFamilyAccess}){
  const [form,setForm]=useState({name:"",email:"",checkin:"",checkout:"",message:""});
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [err,setErr]=useState("");
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));

  const submit=async()=>{
    if(!form.name||!form.email||!form.checkin||!form.checkout){setErr("Please fill in all required fields.");return;}
    setSubmitting(true);setErr("");
    try{
      await api("request",{method:"POST",body:JSON.stringify(form)});
      setSubmitted(true);
    }catch(e){setErr("Something went wrong. Please try again.");}
    finally{setSubmitting(false);}
  };

  // Use uploaded photos as data URIs isn't possible, so we use CSS backgrounds
  const photos = [
    {label:"The Veranda", bg:"linear-gradient(135deg,#1A6B5A,#2E9B7F)"},
    {label:"Living Room", bg:"linear-gradient(135deg,#5BA4CF,#8DCFCA)"},
    {label:"The Kitchen", bg:"linear-gradient(135deg,#C17B5C,#E8894A)"},
    {label:"Sunset Pool", bg:"linear-gradient(160deg,#E8894A,#D4A843)"},
  ];

  return(
    <div className="estate">
      <button className="family-btn" onClick={onFamilyAccess}>Family access</button>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg"/>
        <div className="hero-overlay"/>
        <div className="hero-content">
          <div className="hero-eyebrow">Private Vacation Home · Sunset Key</div>
          <h1 className="hero-title"><em>Casa</em><br/>Kallman</h1>
          <p className="hero-sub">Key West, Florida</p>
          <div className="hero-pills">
            <span className="hero-pill">4 Bedrooms</span>
            <span className="hero-pill">4 Bathrooms</span>
            <span className="hero-pill">Private Island</span>
            <span className="hero-pill">Ocean Views</span>
          </div>
          <a href="#request" className="hero-cta">Request a Stay</a>
        </div>
        <div className="hero-scroll"><span>Discover</span><span>↓</span></div>
      </section>

      {/* Photo gallery */}
      <div className="gallery">
        <div className="gallery-main">
          <img className="gallery-img" src={HERO} alt="Casa Kallman exterior" loading="lazy"/>
          <div className="gallery-label">Exterior & Pool</div>
        </div>
        <div className="gallery-cell" style={{background:"linear-gradient(135deg,#1A4A3A,#2E8B6F)"}}>
          <div style={{width:"100%",height:"100%",background:"linear-gradient(135deg,#1A7A6B 0%,#5BBFA3 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:48,opacity:0.3}}>🌊</span>
          </div>
          <div className="gallery-label">Ocean View</div>
        </div>
        <div className="gallery-cell" style={{background:"linear-gradient(135deg,#C17B5C,#E8894A)"}}>
          <div style={{width:"100%",height:"100%",background:"linear-gradient(160deg,#E8894A 0%,#D4A843 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:48,opacity:0.3}}>🌅</span>
          </div>
          <div className="gallery-label">Sunset Views</div>
        </div>
      </div>

      {/* About */}
      <div className="about">
        <div className="about-left">
          <div className="about-tag">The Property</div>
          <h2 className="about-title">A private vacation home at the edge of the Atlantic</h2>
          <p className="about-body">
            Nestled on Sunset Key — a private island accessible only by ferry from Old Town Key West —
            Casa Kallman is the Kallman family's four-bedroom vacation home. With a resort-style pool,
            lush tropical gardens, and sweeping ocean views, it's the kind of place where time slows down
            and evenings end with the sound of the sea.
          </p>
          <div className="about-tag2">What's Here</div>
          <div className="amenities">
            {[
              {icon:"🏊",name:"Resort Pool",desc:"Lagoon-style pool with sundeck"},
              {icon:"🌴",name:"Private Island",desc:"Ferry access, no cars, total seclusion"},
              {icon:"🌊",name:"Ocean Views",desc:"Direct Atlantic views throughout"},
              {icon:"🍽️",name:"Chef's Kitchen",desc:"Full kitchen with ocean sightlines"},
            ].map(a=>(
              <div key={a.name} className="amenity">
                <div className="amenity-icon">{a.icon}</div>
                <div className="amenity-name">{a.name}</div>
                <div className="amenity-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="about-right">
          <div className="about-quote">
            "Mornings begin with coffee on the veranda. Evenings end with the sound of the sea."
          </div>
          <div className="about-gallery-sm">
            {[
              {bg:"linear-gradient(135deg,#1A7A6B,#5BBFA3)",icon:"🏖️"},
              {bg:"linear-gradient(135deg,#5BA4CF,#8DCFCA)",icon:"🌊"},
              {bg:"linear-gradient(135deg,#E8894A,#F2A96E)",icon:"🌅"},
              {bg:"linear-gradient(135deg,#C17B5C,#D4A843)",icon:"🌴"},
            ].map((p,i)=>(
              <div key={i} className="about-img-wrap">
                <div style={{width:"100%",height:"100%",background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",minHeight:140}}>
                  <span style={{fontSize:36,opacity:0.3}}>{p.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request */}
      <section className="request-section" id="request">
        <div className="request-inner">
          {submitted?(
            <div className="success-wrap">
              <div className="success-icon">🌴</div>
              <div className="success-title">Request Received</div>
              <p className="success-sub">The Kallman family will be in touch to confirm your dates.</p>
            </div>
          ):(
            <>
              <div className="req-tag">Plan Your Visit</div>
              <h2 className="req-title">Request a Stay</h2>
              <p className="req-sub">Casa Kallman is a private family vacation home. Submit a request and the family will confirm availability and be in touch directly.</p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-input" value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Full name"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="your@email.com"/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Check In *</label>
                  <input className="form-input" type="date" value={form.checkin} onChange={e=>upd("checkin",e.target.value)}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Check Out *</label>
                  <input className="form-input" type="date" value={form.checkout} onChange={e=>upd("checkout",e.target.value)}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" value={form.message} onChange={e=>upd("message",e.target.value)} placeholder="Tell us about your visit, group size, any questions..."/>
              </div>
              {err&&<div className="err" style={{marginBottom:12}}>{err}</div>}
              <button className="btn-submit" onClick={submit} disabled={submitting}>{submitting?"Sending...":"Send Request"}</button>
            </>
          )}
        </div>
      </section>

      <footer className="estate-footer">
        <div className="footer-brand">Casa Kallman</div>
        <div className="footer-loc">Sunset Key · Key West, FL</div>
      </footer>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({onBack,onSuccess}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [password,setPassword]=useState("");
  const [familyPasskey,setFamilyPasskey]=useState("");
  const [color,setColor]=useState(MEMBER_COLORS[0].hex);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

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
      <div className="auth-wrap">
        <div className="auth-left">
          <div className="auth-left-overlay"/>
          <div className="auth-left-content">
            <div className="auth-left-title">Casa Kallman</div>
            <div className="auth-left-sub">Family vacation home · Sunset Key, Key West</div>
          </div>
          <div className="auth-left-quote">"Where every visit becomes a memory."</div>
        </div>
        <div className="auth-right">
          <button className="auth-back" onClick={onBack}>← Back to site</button>
          <div className="auth-title">{mode==="login"?"Welcome back":"Create account"}</div>
          <div className="auth-sub">{mode==="login"?"Sign in to manage your stays.":"Family members only — you'll need the family passkey."}</div>

          <div className="field-group">
            <label className="field-label">Name</label>
            <input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          {mode==="register"&&(
            <>
              <div className="field-group">
                <label className="field-label">Family Passkey</label>
                <input className="field-input" type="password" value={familyPasskey} onChange={e=>setFamilyPasskey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
              </div>
              <div className="field-group">
                <label className="field-label">Your Color</label>
                <div className="color-picker">
                  {MEMBER_COLORS.map(c=>(
                    <div key={c.id} className={`color-swatch ${color===c.hex?"selected":""}`}
                      style={{background:c.hex}} onClick={()=>setColor(c.hex)}
                      title={c.label}/>
                  ))}
                </div>
              </div>
            </>
          )}
          {err&&<div className="err">{err}</div>}
          <button className="btn-primary" onClick={handle} disabled={loading}>{loading?"...":(mode==="login"?"Sign In":"Create Account")}</button>
          <div className="toggle-mode">
            {mode==="login"
              ?<><span>New? </span><button onClick={()=>{setMode("register");setErr("");}}>Create an account</button></>
              :<><span>Have an account? </span><button onClick={()=>{setMode("login");setErr("");}}>Sign in</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────
function BookingModal({booking,user,onClose,onSave,onDelete}){
  const isEdit=!!booking?.id;
  const todayS=today();
  const [name,setName]=useState(booking?.name||user?.name||"");
  const [startDate,setStartDate]=useState(booking?.startDate||todayS);
  const [endDate,setEndDate]=useState(booking?.endDate||todayS);
  const [note,setNote]=useState(booking?.note||"");
  const [visibility,setVisibility]=useState(booking?.visibility||"family");
  const [loading,setLoading]=useState(false);

  const save=async()=>{
    if(!name||!startDate||!endDate)return;
    if(endDate<startDate){alert("End date must be after start.");return;}
    setLoading(true);
    try{
      await onSave({name,startDate,endDate,note,visibility,color:user?.color||DEFAULT_COLOR,id:booking?.id});
      onClose();
    }finally{setLoading(false);}
  };

  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-title">{isEdit?"Edit Stay":"Add Stay"}</div>
        <div className="field-group">
          <label className="field-label">Name</label>
          <input className="field-input" value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <div className="field-group" style={{display:"flex",gap:12}}>
          <div style={{flex:1}}><label className="field-label">Check in</label><input className="field-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
          <div style={{flex:1}}><label className="field-label">Check out</label><input className="field-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
        </div>
        <div className="field-group">
          <label className="field-label">Note</label>
          <input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Bringing friends, special occasion..."/>
        </div>
        <div className="field-group">
          <label className="field-label">Visibility</label>
          <div className="vis-toggle">
            <button className={`vis-btn ${visibility==="family"?"active-family":""}`} onClick={()=>setVisibility("family")}>🔒 Family only</button>
            <button className={`vis-btn ${visibility==="open"?"active-open":""}`} onClick={()=>setVisibility("open")}>🌊 Open for friends</button>
          </div>
        </div>
        <div className="modal-actions">
          {isEdit&&<button className="btn-remove" onClick={async()=>{if(window.confirm("Remove this stay?")){await onDelete(booking.id);onClose();}}}>Remove</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={loading}>{loading?"Saving...":"Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ── YEAR VIEW ─────────────────────────────────────────────────────────────────
function YearView({bookings,user,isGuest,onSave,onDelete,showToast}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [editB,setEditB]=useState(null);
  const [addModal,setAddModal]=useState(false);
  const todayS=today();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;

  const getDay=(y,m,d)=>{
    const ds=dateStr(y,m,d);
    return visible.filter(b=>isInRange(ds,b.startDate,b.endDate));
  };

  return(
    <div className="year-wrap">
      <div className="cal-header">
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
                const d=di+1;
                const ds=dateStr(year,mi,d);
                const bs=getDay(year,mi,d);
                const isToday=ds===todayS;
                const bg=bs.length>0
                  ? bs.length===1
                    ? bs[0].color||DEFAULT_COLOR
                    : `linear-gradient(135deg,${bs[0].color||DEFAULT_COLOR},${bs[bs.length-1].color||"#2E9B7F"})`
                  : undefined;
                const names=bs.map(b=>b.name).join(", ");
                return(
                  <div key={di} className={`year-cell ${isToday?"today":""} ${bs.length?"booked":""}`}
                    style={bg?{background:bg}:{}}
                    onClick={()=>bs.length&&setEditB(bs[0])}
                    title={names}>
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
    </div>
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
  const todayS=today();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;

  const firstDay=new Date(year,month,1).getDay();
  const dim=daysInMonth(year,month);
  const prevDim=daysInMonth(year,month===0?11:month-1);
  const cells=[];
  for(let i=firstDay-1;i>=0;i--)cells.push({day:prevDim-i,current:false});
  for(let i=1;i<=dim;i++)cells.push({day:i,current:true});
  while(cells.length%7!==0)cells.push({day:cells.length-dim-firstDay+1,current:false});

  const bForDay=(d,c)=>{
    if(!c)return[];
    const ds=dateStr(year,month,d);
    return visible.filter(b=>isInRange(ds,b.startDate,b.endDate));
  };
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};

  return(
    <div className="month-wrap">
      <div className="cal-header">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="btn-nav" onClick={prev}>‹</button>
          <div className="cal-title">{MONTH_NAMES[month]} {year}</div>
          <button className="btn-nav" onClick={next}>›</button>
        </div>
        <div className="cal-controls">
          {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
        </div>
      </div>
      <div className="month-grid-header">{DAY_NAMES.map(d=><div key={d} className="month-day-label">{d}</div>)}</div>
      <div className="month-grid">
        {cells.map((cell,i)=>{
          const bs=bForDay(cell.day,cell.current);
          const isToday=cell.current&&dateStr(year,month,cell.day)===todayS;
          return(
            <div key={i} className={`month-cell ${!cell.current?"other-month":""} ${isToday?"today-cell":""}`}>
              <div className="month-date-num">{cell.day}</div>
              {bs.slice(0,3).map(b=>(
                <div key={b.id} className="booking-bar"
                  style={{background:b.color||DEFAULT_COLOR}}
                  onClick={()=>setDetailB(b)}
                  title={b.name}>
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
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
                  <div style={{width:14,height:14,borderRadius:3,background:detailB.color||DEFAULT_COLOR,flexShrink:0}}/>
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
    </div>
  );
}

// ── TIMELINE VIEW ─────────────────────────────────────────────────────────────
function TimelineView({bookings,user,isGuest,onSave,onDelete,showToast}){
  const [editB,setEditB]=useState(null);
  const [addModal,setAddModal]=useState(false);
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const todayS=today();

  // Show 90 days from today
  const startDate=new Date(todayS+"T12:00:00");
  const days=90;
  const dates=Array.from({length:days},(_,i)=>{
    const d=new Date(startDate);d.setDate(d.getDate()+i);
    return dateStr(d.getFullYear(),d.getMonth(),d.getDate());
  });

  // Group by person
  const people=[...new Set(visible.map(b=>b.name))].sort();

  const getLeft=(ds)=>{
    const idx=dates.indexOf(ds);
    return idx>=0?`${(idx/days)*100}%`:`${((new Date(ds+"T12:00:00")-startDate)/(1000*60*60*24)/days)*100}%`;
  };
  const getWidth=(s,e)=>{
    const si=Math.max(0,dates.indexOf(s));
    const ei=Math.min(days-1,dates.indexOf(e));
    return`${Math.max(1,(ei-si+1)/days)*100}%`;
  };

  // Mark every 7 days
  const weekMarks=dates.filter((_,i)=>i%7===0);

  return(
    <div className="timeline-wrap">
      <div className="cal-header">
        <div className="cal-title">Next 90 Days</div>
        {!isGuest&&user&&<button className="btn-add" onClick={()=>setAddModal(true)}>+ Add Stay</button>}
      </div>
      <div className="timeline-grid">
        <div className="timeline-header">
          {weekMarks.map((ds,i)=>(
            <div key={i} className="timeline-date-label" style={{position:"absolute",left:`${(dates.indexOf(ds)/days)*100}%`,transform:"translateX(-50%)"}}>
              {fmt(ds)}
            </div>
          ))}
        </div>
        <div style={{height:24}}/>
        {people.map(person=>{
          const pBookings=visible.filter(b=>b.name===person);
          const color=pBookings[0]?.color||DEFAULT_COLOR;
          return(
            <div key={person} className="timeline-row">
              <div className="timeline-name" style={{color}}>{person}</div>
              <div className="timeline-track">
                <div className="timeline-today" style={{left:`${(dates.indexOf(todayS)/days)*100}%`}}/>
                {pBookings.map(b=>{
                  const s=b.startDate<dates[0]?dates[0]:b.startDate;
                  const e=b.endDate>dates[days-1]?dates[days-1]:b.endDate;
                  if(e<dates[0]||s>dates[days-1])return null;
                  return(
                    <div key={b.id} className="timeline-bar"
                      style={{left:getLeft(s),width:getWidth(s,e),background:b.color||DEFAULT_COLOR}}
                      onClick={()=>setEditB(b)}
                      title={`${b.name}: ${fmt(b.startDate)} – ${fmt(b.endDate)}`}>
                      {b.note||b.name}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {people.length===0&&(
          <div className="empty-state">
            <div className="empty-icon">🌴</div>
            <div className="empty-title">Nothing scheduled</div>
            <div className="empty-sub">No upcoming stays in the next 90 days.</div>
          </div>
        )}
      </div>
      {(addModal||editB)&&(
        <BookingModal booking={editB} user={user}
          onClose={()=>{setAddModal(false);setEditB(null);}}
          onSave={async(b)=>{await onSave(b);showToast(b.id?"Updated!":"Stay added!");}}
          onDelete={async(id)=>{await onDelete(id);showToast("Removed.");}}/>
      )}
    </div>
  );
}

// ── WHO'S THERE ───────────────────────────────────────────────────────────────
function WhosThereView({bookings,isGuest}){
  const todayS=today();
  const visible=isGuest?bookings.filter(b=>b.visibility==="open"):bookings;
  const upcoming=visible.filter(b=>b.endDate>=todayS).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  return(
    <div className="whos-wrap">
      <div className="section-title">Who's at the House</div>
      <div className="section-sub">Upcoming stays at Casa Kallman</div>
      {upcoming.length===0?(
        <div className="empty-state">
          <div className="empty-icon">🌴</div>
          <div className="empty-title">All clear</div>
          <div className="empty-sub">No upcoming stays scheduled.</div>
        </div>
      ):(
        <div className="whos-list">
          {upcoming.map(b=>{
            const isNow=b.startDate<=todayS&&b.endDate>=todayS;
            return(
              <div key={b.id} className={`whos-card ${isNow?"here-now":""}`}>
                <div className="whos-av" style={{background:b.color||DEFAULT_COLOR}}>{b.name?.[0]?.toUpperCase()}</div>
                <div className="whos-info">
                  <div className="whos-name">
                    {b.name}
                    {isNow&&<span className="here-badge">Here now</span>}
                  </div>
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
  if(loading)return<div className="req-wrap"><div style={{color:"var(--light)",padding:40,fontWeight:300}}>Loading...</div></div>;
  return(
    <div className="req-wrap">
      <div className="section-title">Stay Requests</div>
      <div className="section-sub">Guest requests from the website</div>
      {requests.length===0?(
        <div className="empty-state">
          <div className="empty-icon">📬</div>
          <div className="empty-title">No requests yet</div>
          <div className="empty-sub">Guest stay requests will appear here.</div>
        </div>
      ):requests.map(r=>(
        <div key={r.id} className="req-card">
          <div className="req-top">
            <div>
              <div className="req-name">{r.name}</div>
              <div className="req-email">{r.email}</div>
            </div>
            <span className={`status-badge status-${r.status||"pending"}`}>{r.status||"Pending"}</span>
          </div>
          <div className="req-dates">📅 {fmt(r.checkin)} → {fmt(r.checkout)}</div>
          {r.message&&<div className="req-msg">"{r.message}"</div>}
          <div className="req-actions">
            {(!r.status||r.status==="pending")&&<>
              <button className="btn-approve" onClick={()=>update(r.id,"approved")}>Approve</button>
              <button className="btn-deny" onClick={()=>update(r.id,"denied")}>Deny</button>
            </>}
            {r.status==="approved"&&<span style={{fontSize:13,color:"var(--teal)",fontWeight:300}}>✓ Approved</span>}
            {r.status==="denied"&&<span style={{fontSize:13,color:"#c0392b",fontWeight:300}}>✗ Denied</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FAMILY APP ────────────────────────────────────────────────────────────────
function FamilyApp({user,bookings,onSave,onDelete,showToast,isGuest}){
  const [tab,setTab]=useState("year");
  const [calView,setCalView]=useState("year");

  const tabs=isGuest
    ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"timeline",label:"Timeline"},{id:"whos",label:"Who's There"}]
    :user?.isAdmin
      ?[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"timeline",label:"Timeline"},{id:"whos",label:"Who's There"},{id:"requests",label:"Requests"}]
      :[{id:"year",label:"Year"},{id:"month",label:"Month"},{id:"timeline",label:"Timeline"},{id:"whos",label:"Who's There"}];

  const signOut=()=>{
    localStorage.removeItem("bh_token");
    localStorage.removeItem("bh_user");
    sessionStorage.removeItem("bh_passkey_ok");
    window.location.reload();
  };

  return(
    <div className="app-shell">
      <div className="app-header">
        <div className="app-brand">
          <span className="app-brand-name">Casa Kallman</span>
          <span className="app-brand-badge">{isGuest?"Guest":"Family"}</span>
        </div>
        <div className="app-header-right">
          {user&&<>
            <div className="app-user-dot" style={{background:user.color||DEFAULT_COLOR}}>{user.name?.[0]?.toUpperCase()}</div>
            <span className="app-user">Hi, {user.name}</span>
          </>}
          <button className="btn-signout" onClick={signOut}>{isGuest?"Exit":"Sign out"}</button>
        </div>
      </div>
      <div className="app-nav">
        {tabs.map(t=>(
          <button key={t.id} className={`app-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab==="year"&&<YearView bookings={bookings} user={user} isGuest={isGuest} onSave={onSave} onDelete={onDelete} showToast={showToast}/>}
      {tab==="month"&&<MonthView bookings={bookings} user={user} isGuest={isGuest} onSave={onSave} onDelete={onDelete} showToast={showToast}/>}
      {tab==="timeline"&&<TimelineView bookings={bookings} user={user} isGuest={isGuest} onSave={onSave} onDelete={onDelete} showToast={showToast}/>}
      {tab==="whos"&&<WhosThereView bookings={bookings} isGuest={isGuest}/>}
      {tab==="requests"&&user?.isAdmin&&<RequestsView showToast={showToast}/>}
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
  const fetchBookings=useCallback(async()=>{
    try{const d=await api("bookings");setBookings(d.bookings||[]);}catch{}
  },[]);

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

  const handleDelete=async(id)=>{
    try{await api(`bookings/${id}`,{method:"DELETE"});fetchBookings();}
    catch{showToast("Could not delete.");}
  };

  return(
    <>
      <style>{css}</style>
      {screen==="estate"&&<EstatePage onFamilyAccess={()=>setScreen("auth")}/>}
      {screen==="auth"&&<AuthScreen onBack={()=>setScreen("estate")} onSuccess={(u)=>{setUser(u);setScreen("app");}}/>}
      {screen==="app"&&<FamilyApp user={user} bookings={bookings} isGuest={isGuest} onSave={handleSave} onDelete={handleDelete} showToast={showToast}/>}
      <Toast msg={toast}/>
    </>
  );
}
