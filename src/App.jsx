import { useState, useEffect, useCallback } from "react";
import { pool_exterior, veranda, kitchen, living, living2, sunset_pool, underwater } from "./photos.js";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MEMBER_COLORS = [
  { id:"teal", hex:"#1A7A6B", label:"Deep Teal" },
  { id:"sunset", hex:"#E8894A", label:"Sunset" },
  { id:"pool", hex:"#5BA4CF", label:"Pool Blue" },
  { id:"terra", hex:"#C17B5C", label:"Terracotta" },
  { id:"seafoam", hex:"#6BB89A", label:"Seafoam" },
  { id:"golden", hex:"#D4A843", label:"Golden" },
  { id:"orchid", hex:"#9B7BA8", label:"Orchid" },
  { id:"coral", hex:"#E06B6B", label:"Coral" },
];
const DEFAULT_COLOR = "#1A7A6B";

const api = async (path, opts={}) => {
  const token = localStorage.getItem("bh_token");
  const res = await fetch(`/api/${path}`, {
    headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},
    ...opts,
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const dateStr = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const todayStr = () => { const n=new Date(); return dateStr(n.getFullYear(),n.getMonth(),n.getDate()); };
const daysInMonth = (y,m) => new Date(y,m+1,0).getDate();
const isInRange = (ds,s,e) => ds>=s && ds<=e;
const fmt = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
const fmtFull = (d) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
const dayDiffInclusive = (s,e) => Math.max(1, Math.round((new Date(e+"T12:00:00")-new Date(s+"T12:00:00"))/(1000*60*60*24))+1);

const weatherLabel = (code) => {
  if ([0].includes(code)) return {emoji:"☀️", label:"Sunny"};
  if ([1,2].includes(code)) return {emoji:"🌤️", label:"Partly sunny"};
  if ([3].includes(code)) return {emoji:"☁️", label:"Cloudy"};
  if ([45,48].includes(code)) return {emoji:"🌫️", label:"Foggy"};
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return {emoji:"🌦️", label:"Rain possible"};
  if ([95,96,99].includes(code)) return {emoji:"⛈️", label:"Storms possible"};
  return {emoji:"🌴", label:"Key West"};
};

function useKeyWestWeather(){
  const [current,setCurrent]=useState(null);
  const [daily,setDaily]=useState({});
  useEffect(()=>{
    let live=true;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=24.5551&longitude=-81.7800&current=temperature_2m,weather_code,windspeed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/New_York")
      .then(r=>r.json())
      .then(data=>{
        if(!live) return;
        const c=data.current||{};
        const now=weatherLabel(c.weather_code);
        setCurrent({temp:Math.round(c.temperature_2m), wind:Math.round(c.windspeed_10m||0), ...now});
        const d={};
        const dailyData=data.daily||{};
        (dailyData.time||[]).forEach((t,i)=>{
          const meta=weatherLabel(dailyData.weather_code?.[i]);
          d[t]={
            high:Math.round(dailyData.temperature_2m_max?.[i]||0),
            low:Math.round(dailyData.temperature_2m_min?.[i]||0),
            rain:dailyData.precipitation_probability_max?.[i],
            ...meta,
          };
        });
        setDaily(d);
      })
      .catch(()=>{});
    return()=>{live=false;};
  },[]);
  return {current,daily};
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap');
:root{--ink:#0E1A16;--teal:#1A6B5A;--teal-mid:#2E9B7F;--teal-light:#5BBFA3;--seafoam:#A8DDD0;--seafoam-pale:#EEF8F5;--sand:#F5EFE3;--sand-mid:#E8DCC8;--sand-dark:#C8B898;--sunset:#E8894A;--white:#FDFAF6;--mid:#5A7068;--light:#96B0A8;}
*{box-sizing:border-box;margin:0;padding:0} body{font-family:'Jost',sans-serif;background:var(--sand);color:var(--ink);min-height:100vh;overflow-x:hidden} button,input,textarea{font-family:'Jost',sans-serif}

.unlock-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;position:relative;overflow:hidden;background:linear-gradient(135deg,#eef8f5 0%,#fbf6ec 56%,#ead8b9 100%)}
.unlock-screen:before{content:'';position:absolute;inset:-20%;background:radial-gradient(circle at 18% 18%,rgba(91,191,163,.22),transparent 28%),radial-gradient(circle at 88% 78%,rgba(232,137,74,.18),transparent 30%);animation:atmosphere 22s ease-in-out infinite alternate;}
.unlock-screen:after{content:'🌴';position:absolute;font-size:46vw;line-height:1;left:-12vw;bottom:-22vw;color:rgba(26,107,90,.09);filter:blur(.2px);transform:rotate(-10deg)}
@keyframes atmosphere{0%{filter:hue-rotate(0deg);transform:scale(1)}100%{filter:hue-rotate(-12deg);transform:scale(1.04)}}
.unlock-card{width:min(1050px,96vw);display:grid;grid-template-columns:1.05fr .95fr;border-radius:30px;overflow:hidden;background:rgba(253,250,246,.88);box-shadow:0 30px 90px rgba(14,26,22,.18);position:relative;z-index:2;border:1px solid rgba(255,255,255,.65)}
.unlock-photo{min-height:620px;position:relative;background-size:cover;background-position:center}.unlock-photo:after{content:'';position:absolute;inset:0;background:linear-gradient(160deg,rgba(7,38,32,.25),rgba(7,38,32,.76))}.unlock-photo-content{position:absolute;inset:0;z-index:2;padding:48px;display:flex;flex-direction:column;justify-content:space-between;color:white}.unlock-logo{font-family:'Cormorant Garamond',serif;font-size:54px;font-weight:300}.unlock-sub{font-size:15px;color:rgba(255,255,255,.72);font-weight:300;margin-top:4px}.unlock-note{max-width:380px;background:rgba(14,26,22,.70);border:1px solid rgba(255,255,255,.20);border-radius:22px;padding:30px;backdrop-filter:blur(12px);box-shadow:0 18px 50px rgba(0,0,0,.22)}.unlock-note-k{font-size:10px;text-transform:uppercase;letter-spacing:4px;color:var(--seafoam);margin-bottom:14px}.unlock-note-h{font-family:'Cormorant Garamond',serif;font-size:34px;line-height:1.05;font-weight:300;margin-bottom:18px}.unlock-note-p{font-size:14px;line-height:1.8;color:rgba(255,255,255,.78);font-weight:300}.unlock-quote{font-family:'Cormorant Garamond',serif;font-style:italic;color:rgba(255,255,255,.65);font-size:17px}
.unlock-form{padding:70px 56px;display:flex;flex-direction:column;justify-content:center}.unlock-title{font-family:'Cormorant Garamond',serif;font-size:48px;line-height:1.05;color:var(--teal);font-weight:400;margin-bottom:10px}.unlock-copy{font-size:15px;color:var(--light);font-weight:300;line-height:1.7;margin-bottom:34px}.field-label{display:block;font-size:10px;font-weight:400;letter-spacing:1.8px;text-transform:uppercase;color:var(--mid);margin-bottom:8px}.field-input{width:100%;padding:15px 16px;border:1.5px solid var(--sand-mid);border-radius:12px;font-size:15px;color:var(--ink);background:rgba(255,255,255,.78);outline:none;transition:border-color .2s,box-shadow .2s;font-weight:300}.field-input:focus{border-color:var(--teal-mid);box-shadow:0 0 0 4px rgba(46,155,127,.08)}.btn-primary{width:100%;padding:15px;background:linear-gradient(135deg,var(--teal),var(--teal-mid));color:white;border:none;border-radius:12px;font-size:12px;font-weight:400;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;margin-top:14px}.btn-primary:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(26,107,90,.22)}.err{color:#b84836;font-size:13px;margin-top:12px;font-weight:300}.tiny-help{font-size:12px;color:var(--light);margin-top:16px;text-align:center;font-weight:300;line-height:1.6}

.app-shell{min-height:100vh;position:relative;background:linear-gradient(135deg,#f8f1e3 0%,#fdfaf6 45%,#eef8f5 100%);animation:slowSky 240s ease-in-out infinite alternate}.app-shell:before{content:'';position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 8% 12%,rgba(91,191,163,.14),transparent 28%),radial-gradient(circle at 92% 0%,rgba(232,137,74,.13),transparent 28%),linear-gradient(120deg,transparent 0%,rgba(255,255,255,.36) 50%,transparent 100%);z-index:0}.app-shell:after{content:'';position:fixed;inset:0;pointer-events:none;opacity:.032;background-image:linear-gradient(rgba(26,107,90,.65) 1px,transparent 1px),linear-gradient(90deg,rgba(26,107,90,.65) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 50% 45%,black,transparent 68%);z-index:0}@keyframes slowSky{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(-8deg)}}
.app-header{height:64px;background:rgba(14,26,22,.97);display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,.08)}.app-brand{display:flex;align-items:baseline;gap:12px}.app-brand-name{font-family:'Cormorant Garamond',serif;font-size:24px;color:white;font-weight:400}.app-brand-badge{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);border:1px solid rgba(91,191,163,.3);padding:3px 8px;border-radius:50px}.app-actions{display:flex;align-items:center;gap:10px}.btn-ghost{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.75);padding:8px 14px;border-radius:10px;font-size:11px;letter-spacing:1px;cursor:pointer}.btn-ghost:hover{background:rgba(255,255,255,.12);color:white}.app-nav{height:48px;background:rgba(14,26,22,.97);display:flex;gap:6px;padding:0 32px;position:sticky;top:64px;z-index:19;border-bottom:1px solid rgba(255,255,255,.07)}.app-tab{padding:0 18px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,.42);font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer}.app-tab.active{color:var(--teal-light);border-bottom-color:var(--teal-light)}
.page{position:relative;z-index:1;padding:34px;}.calendar-layout{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:24px}.main-card{background:rgba(253,250,246,.72);border:1px solid rgba(200,184,152,.42);border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(80,61,32,.08);backdrop-filter:blur(14px)}
.month-header{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:20px}.month-left{display:flex;align-items:center;gap:14px}.btn-nav{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--sand-dark);background:rgba(253,250,246,.8);color:var(--teal);cursor:pointer;font-size:18px}.btn-nav:hover{background:var(--teal);color:white;border-color:var(--teal)}.cal-title{font-family:'Cormorant Garamond',serif;font-size:44px;color:var(--teal);font-weight:400;white-space:nowrap}.month-weather{display:flex;align-items:center;gap:10px;color:var(--mid);font-size:13px;font-weight:300}.weather-badge{font-size:24px}.btn-add{padding:12px 22px;background:var(--sunset);color:white;border:none;border-radius:14px;font-size:11px;font-weight:400;letter-spacing:1.8px;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 28px rgba(232,137,74,.22)}.btn-add:hover{transform:translateY(-1px)}
.house-strip{display:grid;grid-template-columns:1.3fr .7fr;gap:14px;margin-bottom:18px}.house-card{border-radius:18px;background:linear-gradient(135deg,rgba(26,107,90,.94),rgba(46,155,127,.82));padding:20px;color:white;position:relative;overflow:hidden}.house-card:after{content:'🌴';position:absolute;right:18px;bottom:-16px;font-size:96px;opacity:.08}.house-k{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:8px}.house-main{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400}.house-sub{font-size:13px;color:rgba(255,255,255,.74);font-weight:300;margin-top:4px;line-height:1.6}.weather-card{border-radius:18px;background:rgba(255,255,255,.65);border:1px solid var(--sand-mid);padding:18px;color:var(--teal);display:flex;align-items:center;justify-content:space-between}.weather-temp{font-family:'Cormorant Garamond',serif;font-size:38px}.weather-label{font-size:12px;color:var(--mid);font-weight:300}.weather-icon{font-size:34px}
.month-grid-header{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:5px}.month-day-label{text-align:center;font-size:10px;font-weight:400;letter-spacing:2px;text-transform:uppercase;color:var(--light);padding:8px 0}.month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.month-cell{min-height:122px;background:rgba(255,255,255,.66);border-radius:14px;padding:12px 10px 8px;border:1px solid rgba(232,220,200,.75);position:relative;overflow:visible;display:flex;flex-direction:column;transition:box-shadow .2s,transform .2s}.month-cell:hover{box-shadow:0 8px 24px rgba(14,26,22,.08);transform:translateY(-1px)}.month-cell.other-month{opacity:.35}.month-cell.today-cell{border-color:var(--teal-mid);box-shadow:0 0 0 2px rgba(46,155,127,.08)}.month-cell.is-empty:after{content:'🌴';position:absolute;right:8px;bottom:8px;font-size:22px;opacity:.055}.month-date-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.month-date-num{font-size:15px;color:var(--mid);font-weight:400}.today-cell .month-date-num{background:var(--teal-mid);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px}.mobile-day-name{display:none;color:var(--light);font-size:11px;text-transform:uppercase;letter-spacing:1.5px}.stay-stack{display:flex;flex-direction:column;gap:4px;position:relative;z-index:3}.stay-bar{min-height:26px;display:flex;align-items:center;padding:5px 9px;color:white;font-size:12px;font-weight:500;line-height:1.2;box-shadow:0 4px 10px rgba(0,0,0,.12);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stay-bar.single{border-radius:22px}.stay-bar.start{border-radius:22px 7px 7px 22px;margin-right:-13px}.stay-bar.middle{border-radius:7px;margin-left:-13px;margin-right:-13px;justify-content:center;opacity:.92}.stay-bar.end{border-radius:7px 22px 22px 7px;margin-left:-13px;justify-content:center;opacity:.94}.stay-bar:hover{filter:brightness(1.03)}.stay-muted{opacity:.9;font-size:11px}.more-chip{font-size:10px;color:var(--light);padding:3px 4px}.day-weather{margin-top:auto;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--mid);font-weight:400}.day-weather-emoji{font-size:16px}.day-weather-temp{font-size:12px;color:var(--mid)}
.sidebar{display:flex;flex-direction:column;gap:16px}.side-card{background:rgba(253,250,246,.82);border:1px solid rgba(200,184,152,.45);border-radius:24px;padding:22px;box-shadow:0 18px 50px rgba(80,61,32,.07);backdrop-filter:blur(12px)}.side-title{font-family:'Cormorant Garamond',serif;font-size:27px;color:var(--teal);font-weight:400;margin-bottom:4px}.side-sub{font-size:12px;color:var(--light);font-weight:300;margin-bottom:18px}.side-booking{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--sand-mid)}.side-booking:last-child{border-bottom:none}.dot{width:10px;height:10px;border-radius:50%;margin-top:5px;flex-shrink:0}.side-name{font-size:14px;font-weight:500}.side-date{font-size:12px;color:var(--light);font-weight:300}.side-note{font-size:12px;color:var(--mid);font-style:italic;margin-top:3px}.empty{color:var(--light);font-size:13px;font-weight:300;line-height:1.7;text-align:center;padding:24px 0}.empty-icon{font-size:38px;margin-bottom:8px}
.section-wrap{position:relative;z-index:1;padding:34px;max-width:980px}.section-title{font-family:'Cormorant Garamond',serif;font-size:42px;color:var(--teal);font-weight:400;margin-bottom:6px}.section-sub{font-size:14px;color:var(--light);font-weight:300;margin-bottom:28px}.list{display:flex;flex-direction:column;gap:12px}.person-card,.memory-card{background:rgba(253,250,246,.78);border:1px solid rgba(200,184,152,.42);border-radius:22px;padding:22px;box-shadow:0 14px 45px rgba(80,61,32,.06);display:flex;align-items:center;gap:16px}.avatar{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:500;flex-shrink:0}.person-name{font-size:18px;font-weight:500;color:var(--ink)}.person-meta{font-size:13px;color:var(--light);font-weight:300;margin-top:3px}.pill-soft{font-size:11px;color:var(--teal);background:rgba(46,155,127,.1);border-radius:50px;padding:5px 10px;margin-left:auto}.upload-box{border:1.5px dashed rgba(46,155,127,.32);background:rgba(255,255,255,.46);border-radius:26px;padding:52px 24px;text-align:center}.upload-icon{font-size:48px;margin-bottom:12px}.upload-title{font-family:'Cormorant Garamond',serif;font-size:34px;color:var(--teal);font-weight:400}.upload-copy{font-size:14px;color:var(--light);font-weight:300;line-height:1.7;margin:8px auto 20px;max-width:460px}.file-btn{display:inline-block;padding:12px 24px;background:var(--teal);color:white;border-radius:50px;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;cursor:pointer}.photo-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:24px}.photo-preview img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;box-shadow:0 10px 28px rgba(0,0,0,.12)}
.modal-overlay{position:fixed;inset:0;background:rgba(14,26,22,.62);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;padding:18px}.modal{background:var(--white);border-radius:24px;padding:34px;max-width:520px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.22)}.modal-title{font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--teal);font-weight:400;margin-bottom:20px}.field-group{margin-bottom:16px}.form-split{display:grid;grid-template-columns:1fr 1fr;gap:12px}.color-picker{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.color-swatch{width:30px;height:30px;border-radius:50%;border:3px solid transparent;cursor:pointer}.color-swatch.selected{border-color:var(--ink);transform:scale(1.12)}.modal-actions{display:flex;gap:10px;margin-top:24px;justify-content:flex-end}.btn-cancel{padding:11px 18px;background:none;border:1.5px solid var(--sand-dark);border-radius:10px;color:var(--mid);font-size:11px;text-transform:uppercase;letter-spacing:1px;cursor:pointer}.btn-save{padding:11px 22px;background:var(--teal);border:none;border-radius:10px;color:white;font-size:11px;text-transform:uppercase;letter-spacing:1px;cursor:pointer}.btn-remove{padding:11px 18px;background:none;border:1.5px solid #ffb3b3;border-radius:10px;color:#c0392b;font-size:11px;text-transform:uppercase;letter-spacing:1px;cursor:pointer;margin-right:auto}.toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(80px);background:var(--teal);color:white;padding:12px 28px;border-radius:50px;font-size:13px;z-index:200;transition:transform .3s}.toast.show{transform:translateX(-50%) translateY(0)}

@media(max-width:980px){.unlock-card{grid-template-columns:1fr}.unlock-photo{display:none}.unlock-form{padding:54px 30px}.calendar-layout{grid-template-columns:1fr}.sidebar{display:none}.house-strip{grid-template-columns:1fr}.app-header{padding:0 16px}.app-nav{padding:0 12px;overflow-x:auto}.app-tab{padding:0 12px;white-space:nowrap}.page{padding:18px}.main-card{padding:18px;border-radius:22px}.month-header{align-items:flex-start;flex-direction:column}.cal-title{font-size:36px}.month-grid-header{display:none}.month-grid{display:flex;flex-direction:column;gap:10px}.month-cell{min-height:auto;border-radius:18px;padding:14px}.month-cell.other-month{display:none}.mobile-day-name{display:block}.stay-bar,.stay-bar.start,.stay-bar.middle,.stay-bar.end{border-radius:22px;margin-left:0;margin-right:0;justify-content:flex-start}.day-weather{margin-top:12px;padding-top:10px;border-top:1px solid var(--sand-mid)}.form-split{grid-template-columns:1fr}.modal{padding:26px 22px}.section-wrap{padding:22px}.person-card,.memory-card{align-items:flex-start}.pill-soft{display:none}}
@media(max-width:560px){.unlock-title{font-size:40px}.unlock-form{padding:42px 22px}.app-brand-badge{display:none}.btn-ghost{padding:7px 10px}.month-left{width:100%;justify-content:space-between}.btn-add{width:100%}.weather-card{padding:14px}.house-main{font-size:26px}.section-title{font-size:36px}.modal-actions{flex-wrap:wrap}.btn-remove{width:100%;margin-right:0}.btn-cancel,.btn-save{flex:1}}
`;

function Toast({msg}){return <div className={`toast ${msg?"show":""}`}>{msg}</div>;}

function UnlockScreen({onUnlock}){
  const [passkey,setPasskey]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!passkey.trim()){setErr("Enter the house password.");return;}
    setLoading(true);setErr("");
    try{
      const data=await api("passkey",{method:"POST",body:JSON.stringify({passkey:passkey.trim()})});
      if(data.token)localStorage.setItem("bh_token",data.token);
      localStorage.setItem("bh_family_ok","true");
      localStorage.setItem("bh_user",JSON.stringify(data.user||{name:"Family",isAdmin:true,color:DEFAULT_COLOR}));
      onUnlock(data.user||{name:"Family",isAdmin:true,color:DEFAULT_COLOR});
    }catch(e){setErr("That password didn't work. Try again.");}
    finally{setLoading(false);}
  };
  return <div className="unlock-screen">
    <div className="unlock-card">
      <div className="unlock-photo" style={{backgroundImage:`url(${pool_exterior})`}}>
        <div className="unlock-photo-content">
          <div><div className="unlock-logo">Casa Kallman</div><div className="unlock-sub">Sunset Key · Key West</div></div>
          <div className="unlock-note"><div className="unlock-note-k">For family and friends</div><div className="unlock-note-h">Where every visit starts.</div><div className="unlock-note-p">Check availability, add dates, and see who's home.</div></div>
          <div className="unlock-quote">"Where every visit becomes a memory."</div>
        </div>
      </div>
      <div className="unlock-form">
        <div className="unlock-title">Welcome back</div>
        <div className="unlock-copy">Enter the shared house password to open the Casa Kallman calendar.</div>
        <label className="field-label">House password</label>
        <input className="field-input" type="password" value={passkey} onChange={e=>setPasskey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus />
        {err&&<div className="err">{err}</div>}
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading?"Opening...":"Enter"}</button>
        <div className="tiny-help">One simple password. No separate accounts.</div>
      </div>
    </div>
  </div>;
}

function BookingModal({booking,onClose,onSave,onDelete}){
  const isEdit=!!booking?.id;
  const ts=todayStr();
  const [name,setName]=useState(booking?.name||"");
  const [startDate,setStartDate]=useState(booking?.startDate||ts);
  const [endDate,setEndDate]=useState(booking?.endDate||ts);
  const [note,setNote]=useState(booking?.note||"");
  const [color,setColor]=useState(booking?.color||DEFAULT_COLOR);
  const [loading,setLoading]=useState(false);
  const save=async()=>{
    if(!name.trim()||!startDate||!endDate)return;
    if(endDate<startDate){alert("End date must be after start.");return;}
    setLoading(true);
    try{await onSave({id:booking?.id,name:name.trim(),startDate,endDate,note,visibility:"open",color});onClose();}
    finally{setLoading(false);}
  };
  return <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-title">{isEdit?"Edit stay":"Add stay"}</div>
      <div className="field-group"><label className="field-label">Who is coming?</label><input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Jake, Jacob, Mom, Dad..." /></div>
      <div className="form-split field-group"><div><label className="field-label">Arrive</label><input className="field-input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} /></div><div><label className="field-label">Leave</label><input className="field-input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} /></div></div>
      <div className="field-group"><label className="field-label">Note</label><input className="field-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional: bringing friends, late arrival, etc." /></div>
      <div className="field-group"><label className="field-label">Color</label><div className="color-picker">{MEMBER_COLORS.map(c=><button key={c.id} type="button" className={`color-swatch ${color===c.hex?"selected":""}`} style={{background:c.hex}} onClick={()=>setColor(c.hex)} title={c.label}/>)}</div></div>
      <div className="modal-actions">{isEdit&&<button className="btn-remove" onClick={async()=>{if(window.confirm("Remove this stay?")){await onDelete(booking.id);onClose();}}}>Remove</button>}<button className="btn-cancel" onClick={onClose}>Cancel</button><button className="btn-save" onClick={save} disabled={loading}>{loading?"Saving...":"Save"}</button></div>
    </div>
  </div>;
}

function MonthCalendar({bookings,onSave,onDelete,showToast}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [modal,setModal]=useState(null);
  const {current,daily}=useKeyWestWeather();
  const ts=todayStr();
  const firstDay=new Date(year,month,1).getDay();
  const dim=daysInMonth(year,month);
  const prevDim=daysInMonth(year,month===0?11:month-1);
  const cells=[];
  for(let i=firstDay-1;i>=0;i--) cells.push({day:prevDim-i,current:false});
  for(let i=1;i<=dim;i++) cells.push({day:i,current:true});
  while(cells.length%7!==0) cells.push({day:cells.length-dim-firstDay+1,current:false});
  const visible=bookings.filter(b=>b.endDate>=dateStr(year,month,1) && b.startDate<=dateStr(year,month,dim));
  const upcoming=bookings.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  const nowStays=bookings.filter(b=>isInRange(ts,b.startDate,b.endDate));
  const nextStay=upcoming[0];
  const dayBookings=(d,c)=>{if(!c)return[];const ds=dateStr(year,month,d);return bookings.filter(b=>isInRange(ds,b.startDate,b.endDate));};
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  return <div className="page"><div className="calendar-layout"><div className="main-card">
    <div className="month-header"><div className="month-left"><button className="btn-nav" onClick={prev}>‹</button><div><div className="cal-title">{MONTH_NAMES[month]} {year}</div>{current&&<div className="month-weather"><span className="weather-badge">{current.emoji}</span><span>{current.temp}° · {current.label} in Key West</span></div>}</div><button className="btn-nav" onClick={next}>›</button></div><button className="btn-add" onClick={()=>setModal({})}>+ Add stay</button></div>
    <div className="house-strip"><div className="house-card"><div className="house-k">Who's home</div><div className="house-main">{nowStays.length?nowStays.map(b=>b.name).join(", "):"House is open"}</div><div className="house-sub">{nowStays.length?nowStays.map(b=>`${fmt(b.startDate)} — ${fmt(b.endDate)}`).join(" · "):nextStay?`Next up: ${nextStay.name}, ${fmt(nextStay.startDate)} — ${fmt(nextStay.endDate)}`:"No upcoming stays added yet."}</div></div><div className="weather-card">{current?<><div><div className="weather-temp">{current.temp}°</div><div className="weather-label">{current.label}<br/>Wind {current.wind} mph</div></div><div className="weather-icon">{current.emoji}</div></>:<div className="weather-label">Loading Key West weather...</div>}</div></div>
    <div className="month-grid-header">{DAY_NAMES.map(d=><div key={d} className="month-day-label">{d}</div>)}</div><div className="month-grid">{cells.map((cell,i)=>{const ds=cell.current?dateStr(year,month,cell.day):null;const bs=dayBookings(cell.day,cell.current);const isToday=ds===ts;const dayWeather=ds?daily[ds]:null;const weekday=ds?DAY_NAMES[new Date(ds+"T12:00:00").getDay()]:"";return <div key={i} className={`month-cell ${!cell.current?"other-month":""} ${isToday?"today-cell":""} ${cell.current&&!bs.length?"is-empty":""}`}><div className="month-date-row"><div className="month-date-num">{cell.day}</div><div className="mobile-day-name">{weekday}</div></div><div className="stay-stack">{bs.slice(0,3).map(b=>{const start=ds===b.startDate;const end=ds===b.endDate;const cls=start&&end?"single":start?"start":end?"end":"middle";return <div key={b.id} className={`stay-bar ${cls}`} style={{background:b.color||DEFAULT_COLOR}} onClick={()=>setModal(b)} title={`${b.name}: ${fmtFull(b.startDate)} — ${fmtFull(b.endDate)}`}>{start||cls==="single"?b.name:<span className="stay-muted">{b.name}</span>}</div>})}{bs.length>3&&<div className="more-chip">+{bs.length-3} more</div>}</div>{dayWeather&&<div className="day-weather"><span className="day-weather-emoji">{dayWeather.emoji}</span><span className="day-weather-temp">{dayWeather.high}°/{dayWeather.low}°</span></div>}</div>})}</div>
    {modal&&<BookingModal booking={modal.id?modal:null} onClose={()=>setModal(null)} onSave={async(b)=>{await onSave(b);showToast(b.id?"Stay updated.":"Stay added.");}} onDelete={async(id)=>{await onDelete(id);showToast("Stay removed.");}}/>}
  </div><CalendarSidebar bookings={bookings} current={current}/></div></div>;
}

function CalendarSidebar({bookings,current}){
  const ts=todayStr();
  const upcoming=bookings.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate)).slice(0,8);
  return <aside className="sidebar"><div className="side-card"><div className="side-title">Coming up</div><div className="side-sub">A simple view of who's planning to be there.</div>{upcoming.length?upcoming.map(b=><div className="side-booking" key={b.id}><div className="dot" style={{background:b.color||DEFAULT_COLOR}}/><div><div className="side-name">{b.name}</div><div className="side-date">{fmt(b.startDate)} — {fmt(b.endDate)} · {dayDiffInclusive(b.startDate,b.endDate)} days</div>{b.note&&<div className="side-note">{b.note}</div>}</div></div>):<div className="empty"><div className="empty-icon">🌴</div>No stays added yet.</div>}</div><div className="side-card"><div className="side-title">Key West</div>{current?<div className="weather-card" style={{boxShadow:'none',border:'none',padding:0,background:'transparent'}}><div><div className="weather-temp">{current.temp}°</div><div className="weather-label">{current.label}<br/>Wind {current.wind} mph</div></div><div className="weather-icon">{current.emoji}</div></div>:<div className="empty">Loading weather...</div>}</div></aside>;
}

function WhosHome({bookings}){
  const ts=todayStr();
  const upcoming=bookings.filter(b=>b.endDate>=ts).sort((a,b)=>a.startDate.localeCompare(b.startDate));
  return <div className="section-wrap"><div className="section-title">Who's home</div><div className="section-sub">Current and upcoming stays.</div><div className="list">{upcoming.length?upcoming.map(b=><div className="person-card" key={b.id}><div className="avatar" style={{background:b.color||DEFAULT_COLOR}}>{b.name?.[0]?.toUpperCase()}</div><div><div className="person-name">{b.name}</div><div className="person-meta">{fmtFull(b.startDate)} — {fmtFull(b.endDate)}{b.note?` · ${b.note}`:""}</div></div>{isInRange(ts,b.startDate,b.endDate)&&<span className="pill-soft">Here now</span>}</div>):<div className="upload-box"><div className="upload-icon">🌴</div><div className="upload-title">No one has added dates yet.</div><div className="upload-copy">Use Add stay on the calendar when someone knows their dates.</div></div>}</div></div>;
}

function FamilyProfiles({bookings}){
  const people=new Map();
  bookings.forEach(b=>{if(!b.name||b.name.toLowerCase()==="maahi")return;const key=b.name.trim().toLowerCase();const p=people.get(key)||{name:b.name,color:b.color||DEFAULT_COLOR,stays:0,days:0,next:null};p.stays+=1;p.days+=dayDiffInclusive(b.startDate,b.endDate);if(!p.next && b.endDate>=todayStr())p.next=b;people.set(key,p);});
  if(!people.size) people.set("jake",{name:"Jake",color:DEFAULT_COLOR,stays:0,days:0,next:null});
  return <div className="section-wrap"><div className="section-title">Family</div><div className="section-sub">Profiles are created automatically when someone adds a stay.</div><div className="list">{Array.from(people.values()).map(p=><div className="person-card" key={p.name}><div className="avatar" style={{background:p.color}}>{p.name[0]?.toUpperCase()}</div><div><div className="person-name">{p.name}</div><div className="person-meta">{p.next?`Next stay: ${fmt(p.next.startDate)} — ${fmt(p.next.endDate)}`:"No upcoming stay"} · {p.stays} stay{p.stays===1?"":"s"} added</div></div></div>)}</div></div>;
}

function FamilyPhotos(){
  const [photos,setPhotos]=useState([]);
  const onFiles=(files)=>{Array.from(files||[]).slice(0,12).forEach(file=>{const reader=new FileReader();reader.onload=e=>setPhotos(p=>[...p,{name:file.name,src:e.target.result}]);reader.readAsDataURL(file);});};
  return <div className="section-wrap"><div className="section-title">Family photos</div><div className="section-sub">A quiet place for house memories. Uploads preview here for now; permanent saving can come later.</div><div className="upload-box"><div className="upload-icon">＋</div><div className="upload-title">Add the first memory</div><div className="upload-copy">Photos stay low-effort: pick a few images from a visit and preview them here.</div><label className="file-btn">Upload photos<input type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>onFiles(e.target.files)} /></label></div>{photos.length>0&&<div className="photo-preview">{photos.map((p,i)=><img key={`${p.name}-${i}`} src={p.src} alt={p.name}/>)}</div>}</div>;
}

function AppShell({bookings,onSave,onDelete,showToast,onLock}){
  const [tab,setTab]=useState("calendar");
  const tabs=[{id:"calendar",label:"Calendar"},{id:"whos",label:"Who's Home"},{id:"family",label:"Family"},{id:"photos",label:"Photos"}];
  return <div className="app-shell"><header className="app-header"><div className="app-brand"><span className="app-brand-name">Casa Kallman</span><span className="app-brand-badge">Private</span></div><div className="app-actions"><button className="btn-ghost" onClick={onLock}>Lock</button></div></header><nav className="app-nav">{tabs.map(t=><button key={t.id} className={`app-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</nav>{tab==="calendar"&&<MonthCalendar bookings={bookings} onSave={onSave} onDelete={onDelete} showToast={showToast}/>} {tab==="whos"&&<WhosHome bookings={bookings}/>} {tab==="family"&&<FamilyProfiles bookings={bookings}/>} {tab==="photos"&&<FamilyPhotos/>}</div>;
}

export default function App(){
  const [unlocked,setUnlocked]=useState(false);
  const [bookings,setBookings]=useState([]);
  const [toast,setToast]=useState("");
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const fetchBookings=useCallback(async()=>{try{const d=await api("bookings");setBookings(d.bookings||[]);}catch(e){showToast("Could not load the calendar.");}},[]);
  useEffect(()=>{const ok=localStorage.getItem("bh_family_ok")==="true";const token=localStorage.getItem("bh_token");if(ok&&token)setUnlocked(true);},[]);
  useEffect(()=>{if(unlocked)fetchBookings();},[unlocked,fetchBookings]);
  const handleSave=async(booking)=>{try{if(booking.id)await api(`bookings/${booking.id}`,{method:"PUT",body:JSON.stringify(booking)});else await api("bookings",{method:"POST",body:JSON.stringify(booking)});fetchBookings();}catch(e){showToast("Could not save. Try again.");}};
  const handleDelete=async(id)=>{try{await api(`bookings/${id}`,{method:"DELETE"});fetchBookings();}catch(e){showToast("Could not remove it.");}};
  const lock=()=>{localStorage.removeItem("bh_family_ok");localStorage.removeItem("bh_token");localStorage.removeItem("bh_user");setUnlocked(false);};
  return <><style>{css}</style>{unlocked?<AppShell bookings={bookings} onSave={handleSave} onDelete={handleDelete} showToast={showToast} onLock={lock}/>:<UnlockScreen onUnlock={()=>setUnlocked(true)}/>}<Toast msg={toast}/></>;
}
