// Game state singleton, factories, reset, and shared FX/toast/banner primitives.
// Modules import { G, S } from here; G is mutated in place (DECISIONS D2).
import { ROLES, DIFFS, SOLDIER_POSTS } from './data.js';
import { rand, TAU } from './util.js';
import { $ } from './dom.js';
import { AudioSys } from './audio.js';

/* ================= STATE ================= */
/** Mutable run state (mutated in place; see DECISIONS D2). */
export const G = {};
/** UI/flow state. */
export const S = { state: 'menu', pendingDiff: 'penitent' };
let bannerTimeout = null;

export function loadBest(){ try{return JSON.parse(localStorage.getItem('coh_best')||'{}');}catch(e){return{};} }
export function saveBest(b){ try{localStorage.setItem('coh_best',JSON.stringify(b));}catch(e){} }

export function makeHealer(i){
 const r=ROLES[i];
 return {kind:'healer',idx:i,role:r,x:r.x,y:r.y,a:0,r:13,hp:85,max:85,shield:0,shieldTime:0,
  spd:85,fallen:false,move:null,focus:null,revive:null,revP:0,cdLeft:0,cdTotal:1,
  pulseT:1,shieldT:2,flashT:0,ftT:0,beam:null,sear:null,cleanse:null,bob:rand(TAU)};
}
export function makeSoldier(postIdx){
 const [px,py]=SOLDIER_POSTS[postIdx%SOLDIER_POSTS.length];
 return {kind:'soldier',x:px+rand(-8,8),y:py+rand(-8,8),px,py,a:0,r:13,hp:130,max:130,shield:0,shieldTime:0,
  spd:70,atkT:rand(.3,.9),lungeT:0,flashT:0,ftT:0,target:null,bob:rand(TAU)};
}
export function makeChapel(){ return {kind:'chapel',x:295,y:450,r:52,hp:650,max:650,shield:0,shieldTime:0,flashT:0,ftT:0,isChapel:true}; }
export function makeRifts(){ return [[1390,450],[1080,130],[1080,770]].map(([x,y],i)=>({kind:'rift',idx:i,x,y,r:30,hp:220,max:220,sealed:false,flashT:0,spawnFlash:0})); }

export function reset(diffKey){
 const diff=DIFFS[diffKey];
 const prevVt=G.vt||0, prevSpeed=G.speed||1;
 Object.assign(G,{
  diffKey,diff,time:0,vt:prevVt,speed:prevSpeed,endless:false,waveScale:1,novaWave:-1,
  faith:60,faithCap:120,faithRegen:2.4*diff.faith,
  healMult:1,cdMult:1,spdMult:1,boonCounts:{},
  healers:[0,1,2,3].map(makeHealer),
  soldiers:[0,1,2,3,4].map(makeSoldier),nextPost:5,
  enemies:[],rifts:makeRifts(),chapel:makeChapel(),
  projectiles:[],particles:[],floaters:[],fields:[],pools:[],pulses:[],markers:[],
  sel:[],cursor:{x:600,y:450},
  waveIdx:-1,phase:'prep',respiteT:5,waveT:0,queue:[],
  shake:0,bellT:14,sporeT:0,emberT:0,
  stats:{healed:0,kills:0,soldiersLost:0,healersFallen:0,riftsSealed:0},
  endT:0,endWin:false,endReason:'',toastLast:{}
 });
 $('toasts').innerHTML='';
}
/* ================= TOASTS / FLOATERS / PARTICLES ================= */
export function toast(msg,type='',key=null,minGap=0){
 if(key){ const n=performance.now(); if(G.toastLast[key]&&n-G.toastLast[key]<minGap*1000)return; G.toastLast[key]=n; }
 const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
 const box=$('toasts'); box.appendChild(t);
 while(box.children.length>4)box.removeChild(box.firstChild);
 setTimeout(()=>{ if(t.parentNode)t.parentNode.removeChild(t); },3600);
}
export function floater(x,y,txt,color){ G.floaters.push({x,y,txt,color,t:0,life:.95}); if(G.floaters.length>60)G.floaters.shift(); }
export function addPart(p){ G.particles.push(p); if(G.particles.length>380)G.particles.splice(0,G.particles.length-380); }
export function burst(x,y,color,n=8,spd=70,glow=false){
 for(let i=0;i<n;i++){ const a=rand(TAU),s=rand(spd*.3,spd);
  addPart({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:rand(.4,.9),size:rand(1.5,3.5),color,glow,grav:0}); }
}
export function motes(x,y,color,n=3){
 for(let i=0;i<n;i++)addPart({x:x+rand(-10,10),y:y+rand(-8,8),vx:rand(-8,8),vy:rand(-34,-16),t:0,life:rand(.5,1),size:rand(1.2,2.4),color,glow:true,grav:0});
}
export function wisp(x,y,color){ addPart({x,y,vx:rand(-4,4),vy:-22,t:0,life:1.7,size:5,color,glow:true,grav:0,wisp:true}); }
export function showBanner(title,sub,sticky){
 if(bannerTimeout){ clearTimeout(bannerTimeout); bannerTimeout=null; }
 $('bannerTitle').textContent=title; $('bannerSub').textContent=sub;
 $('banner').classList.add('show'); $('banner').classList.toggle('respite',sticky);
 if(!sticky)bannerTimeout=setTimeout(()=>{ $('banner').classList.remove('show','respite'); },3200);
}

// Terminal state transition is shared by combat and wave progression.
export function triggerEnd(win,reason){
 if(S.state==='ending'||S.state==='end')return;
 S.state='ending'; G.endT=1.6; G.endWin=win; G.endReason=reason;
 G.shake=win?8:12;
 if(win){ AudioSys.sfx('victory'); toast('Dawn breaks over Vey.','holy'); }
 else{ AudioSys.sfx('defeat');
  toast(reason==='chapel'?'The Last Chapel has fallen…':'The Company has fallen…','danger'); }
}
