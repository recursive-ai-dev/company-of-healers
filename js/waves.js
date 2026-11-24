// Wave spawning, boons, and end-of-run trigger.
import { G, S, toast, showBanner, burst, motes, triggerEnd } from './state.js';
import { BOONS, ENEMY_DEF, PAL, CAMPAIGN_WAVES, waveFor, waveScale, waveCompText } from './data.js';
import { rand, TAU, choice, roman } from './util.js';
import { $ } from './dom.js';
import { AudioSys } from './audio.js';
import { addSoldier, reviveHealer, damageEnemy } from './combat.js';

/* ================= WAVES ================= */
export function startWave(i){
 G.waveIdx=i; G.phase='combat'; G.waveT=0; G.queue=[];
 const w=waveFor(i); G.waveScale=waveScale(i);
 w.spawns.forEach(s=>{
  const n=s.type==='boss'?1:Math.max(1,Math.round(s.n*G.diff.count));
  for(let k=0;k<n;k++)G.queue.push({at:s.at+(s.spread?rand(0,s.spread):0)+k*.15,type:s.type,rift:s.rift});
 });
 G.queue.sort((a,b)=>a.at-b.at);
 const isBoss=w.spawns.some(s=>s.type==='boss');
 showBanner('WAVE '+roman(i+1)+' — '+w.name.toUpperCase(),w.sub,false);
 AudioSys.sfx(isBoss?'roar':'horn');
 if(isBoss){ G.shake=10; toast('The Blightfather stirs in the eastern rift…','danger'); }
}
export function spawnEnemy(type,riftIdx){
 const alive=G.rifts.filter(r=>!r.sealed);
 let x,y;
 if(alive.length){ const r=alive.find(r=>r.idx===riftIdx)||choice(alive);
  x=r.x+rand(-26,26); y=r.y+rand(-26,26); r.spawnFlash=.5; }
 else { x=1560; y=rand(100,800); }
 const d=ENEMY_DEF[type];
 const e={kind:'enemy',type,x,y,a:Math.PI,r:d.r,hp:d.hp*G.diff.hp*G.waveScale,max:d.hp*G.diff.hp*G.waveScale,
  spd:d.spd,dmg:d.dmg*G.diff.dmg*G.waveScale,cd:d.cd,atkT:rand(.4,1),flashT:0,ftT:0,spawnT:.4,
  auraT:0,summonT:8,chargeT:0,bob:rand(TAU),lungeT:0};
 G.enemies.push(e);
 burst(x,y,PAL.blight,5,50,true); AudioSys.sfx('spawn');
 if(G.novaWave===G.waveIdx){ damageEnemy(e,60); burst(x,y,PAL.gold,6,65,true); }
}
export function waveCleared(){
 if(G.waveIdx>=CAMPAIGN_WAVES-1&&!G.endless){ triggerEnd(true,''); return; }
 G.phase='boon'; openBoon();
}
export function openBoon(){
 S.state='boon';
 const pool=[...BOONS].sort(()=>Math.random()-.5).slice(0,3);
 const row=$('boonRow'); row.innerHTML='';
 pool.forEach(b=>{
  const btn=document.createElement('button'); btn.className='boonCard';
  btn.innerHTML=`<div class="bi"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${b.icon}</svg></div><div class="bn">${b.n}</div><div class="bd">${b.d}</div>`;
  btn.onclick=()=>{ applyBoon(b.id); };
  row.appendChild(btn);
 });
 const next=waveFor(G.waveIdx+1);
 $('boonNext').innerHTML=`NEXT — WAVE ${roman(G.waveIdx+2)} · ${next.name.toUpperCase()}<span>${next.sub}</span><span>${waveCompText(next)}</span>`;
 $('boon').classList.remove('hidden');
 AudioSys.sfx('boon');
}
export function applyBoon(id){
 G.boonCounts[id]=(G.boonCounts[id]||0)+1;
 switch(id){
  case 'bread': for(let i=0;i<2;i++)addSoldier(); break;
  case 'vigor': G.healMult*=1.25; break;
  case 'alms': G.faithRegen+=1.2; break;
  case 'swift': G.spdMult*=1.2; break;
  case 'rites': G.cdMult*=.8; break;
  case 'corner': G.chapel.max+=120; G.chapel.hp=G.chapel.max; burst(G.chapel.x,G.chapel.y,PAL.gold,16,100,true); break;
  case 'candle': { const f=G.healers.find(h=>h.fallen);
   if(f){ reviveHealer(f,.6); } else { G.healers.forEach(h=>{h.max+=30;h.hp=h.max;motes(h.x,h.y,h.role.color,5);}); } break; }
  case 'tithe': G.faith=Math.min(G.faithCap+25,G.faith+40); G.faithCap+=25; break;
  case 'nova': G.novaWave=G.waveIdx+1; burst(G.chapel.x,G.chapel.y,PAL.gold,20,140,true); break;
  case 'secondwind': G.healers.forEach(h=>{ if(!h.fallen){ h.max+=25; h.hp=h.max; motes(h.x,h.y,h.role.color,5); } }); break;
  case 'aegis': G.chapel.shield=150; G.chapel.shieldTime=25; burst(G.chapel.x,G.chapel.y,PAL.violet,14,90,true); break;
 }
 $('boon').classList.add('hidden');
 S.state='playing'; G.phase='respite'; G.respiteT=7;
 showBanner('THE BLIGHT STIRS','The next assault gathers — prepare your company',true);
 AudioSys.sfx('boon');
}
