// Per-frame simulation: healers, soldiers, enemies, projectiles, fields, FX.
import { G, S, toast, burst, motes, addPart, wisp } from './state.js';
import { allies, addHeal, damageAlly, damageEnemy, damageRift, reviveHealer } from './combat.js';
import { startWave, spawnEnemy, waveCleared } from './waves.js';
import { showEnd } from './ui.js';
import { ENEMY_DEF, PAL, TORCHES } from './data.js';
import { W, H, rand, TAU, clamp, lerp, angLerp, dist } from './util.js';
import { AudioSys } from './audio.js';

/* ================= UPDATE ================= */
export function step(u,tx,ty,spd,dt){
 const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy);
 if(d<5)return true;
 const s=Math.min(spd*dt,d);
 u.x+=dx/d*s; u.y+=dy/d*s;
 u.a=angLerp(u.a,Math.atan2(dy,dx),.18);
 u.x=clamp(u.x,20,W-20); u.y=clamp(u.y,20,H-20);
 return d-s<5;
}
export function lowestAlly(list,cx,cy,range){
 let best=null,bp=1;
 list.forEach(a=>{ if(a.hp>=a.max||a.fallen)return;
  if(Math.hypot(a.x-cx,a.y-cy)>range)return;
  const p=a.hp/a.max; if(p<bp){bp=p;best=a;} });
 return best;
}
export function healerAct(h,dt){
 const r=h.role, list=allies().filter(a=>a!==h);
 h.beam=h.sear=h.cleanse=null;
 if(r.id==='mender'){
  let t=(h.focus&&h.focus.hp<h.focus.max&&dist(h,h.focus)<=r.range)?h.focus:lowestAlly(list,h.x,h.y,r.range);
  if(t){ addHeal(t,(t.isChapel?8:10)*G.healMult*dt); h.beam=t;
   if(Math.random()<dt*6)motes(t.x,t.y,PAL.heal,1); AudioSys.sfx('heal'); }
 }else if(r.id==='chanter'){
  h.pulseT-=dt;
  if(h.pulseT<=0){
   const wounded=list.filter(a=>a.hp<a.max&&dist(a,h)<=r.range);
   if(wounded.length){ wounded.forEach(a=>{addHeal(a,7*G.healMult);motes(a.x,a.y,PAL.gold,1);});
    G.pulses.push({x:h.x,y:h.y,r:14,max:r.range,t:0,color:PAL.gold}); AudioSys.sfx('pulse'); }
   h.pulseT=1.3;
  }
 }else if(r.id==='purifier'){
  let e=null,bd=r.range;
  G.enemies.forEach(en=>{ const d=dist(h,en); if(d<bd){bd=d;e=en;} });
  if(e){ damageEnemy(e,9*dt); h.sear=e; if(Math.random()<dt*8)motes(e.x,e.y,PAL.cyan,1); AudioSys.sfx('sear'); }
  else{
   const rift=G.rifts.find(rf=>!rf.sealed&&dist(h,rf)<=r.range);
   if(rift){ damageRift(rift,9*dt); h.sear=rift; AudioSys.sfx('sear'); }
   else{ const pool=G.pools.find(p=>dist(h,p)<=160);
    if(pool){ pool.t-=3*dt; h.cleanse=pool; if(Math.random()<dt*6)motes(pool.x+rand(-20,20),pool.y+rand(-20,20),PAL.cyan,1); } }
  }
 }else if(r.id==='warden'){
  h.shieldT-=dt;
  if(h.shieldT<=0){
   let t=(h.focus&&dist(h,h.focus)<=r.range&&h.focus.shield<40)?h.focus:lowestAlly(list,h.x,h.y,r.range);
   if(!t)t=list.filter(a=>dist(a,h)<=r.range&&a.shield<40).sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];
   if(t){ t.shield=Math.max(t.shield,Math.min(80,t.shield+30)); t.shieldTime=Math.max(t.shieldTime,7); motes(t.x,t.y,PAL.violet,3);
    G.pulses.push({x:t.x,y:t.y,r:8,max:30,t:0,color:PAL.violet}); }
   h.shieldT=4.5;
  }
 }
}
export function update(dt){
 G.time+=dt;
 G.faith=Math.min(G.faithCap,G.faith+G.faithRegen*dt);
 G.bellT-=dt; if(G.bellT<=0){ AudioSys.sfx('bell'); G.bellT=rand(16,28); }
 const list=allies();
 // chapel aura
 list.forEach(a=>{ if(!a.isChapel&&dist(a,G.chapel)<=175)addHeal(a,5*dt); });
 // respite regen + countdown
 if(G.phase==='respite'||G.phase==='prep'){
  list.forEach(a=>addHeal(a,8*dt));
  G.respiteT-=dt;
  if(G.respiteT<=0)startWave(G.waveIdx+1);
 }
 // wave spawns
 if(G.phase==='combat'){
  G.waveT+=dt;
  while(G.queue.length&&G.queue[0].at<=G.waveT){ const s=G.queue.shift(); spawnEnemy(s.type,s.rift); }
  if(!G.queue.length&&!G.enemies.length)waveCleared();
 }
 // healers
 G.healers.forEach(h=>{
  h.ftT-=dt; h.flashT-=dt;
  if(h.shieldTime>0){ h.shieldTime-=dt; if(h.shieldTime<=0)h.shield=0; }
  if(h.fallen){ if(Math.random()<dt*1.5)wisp(h.x+rand(-6,6),h.y+rand(-6,6),h.role.color); return; }
  h.cdLeft=Math.max(0,h.cdLeft-dt);
  const spd=h.spd*G.spdMult;
  if(h.revive){
   const t=h.revive;
   if(!t.fallen){ h.revive=null; h.revP=0; }
   else if(dist(h,t)>44){ step(h,t.x,t.y,spd,dt); h.revP=0; }
   else{ h.a=angLerp(h.a,Math.atan2(t.y-h.y,t.x-h.x),.2); h.revP+=dt;
    if(Math.random()<dt*10)motes(t.x+rand(-8,8),t.y+rand(-8,8),PAL.gold,1);
    if(h.revP>=3){ reviveHealer(t,.5); h.revive=null; h.revP=0; } }
  }else if(h.move){
   if(step(h,h.move.x,h.move.y,spd,dt))h.move=null;
  }else if(h.focus){
   const f=h.focus;
   if(f.hp<=0||f.fallen||f.hp>=f.max){ h.focus=null; healerAct(h,dt); }
   else if(dist(h,f)>h.role.range*.85)step(h,f.x,f.y,spd,dt);
   else{ h.a=angLerp(h.a,Math.atan2(f.y-h.y,f.x-h.x),.15); healerAct(h,dt); }
  }else healerAct(h,dt);
 });
 // soldiers
 G.soldiers.forEach(s=>{
  s.ftT-=dt; s.flashT-=dt; s.lungeT-=dt;
  if(s.shieldTime>0){ s.shieldTime-=dt; if(s.shieldTime<=0)s.shield=0; }
  let target=null,bd=260;
  G.enemies.forEach(e=>{ const d=Math.hypot(e.x-s.px,e.y-s.py); if(d<bd){bd=d;target=e;} });
  s.target=target;
  if(target){
   const d=dist(s,target);
   if(d>s.r+target.r+8)step(s,target.x,target.y,s.spd,dt);
   else{ s.a=angLerp(s.a,Math.atan2(target.y-s.y,target.x-s.x),.25);
    s.atkT-=dt;
    if(s.atkT<=0){ s.atkT=.9; s.lungeT=.15; damageEnemy(target,12);
     burst(target.x,target.y,'#d8dee6',3,50); AudioSys.sfx('swing'); } }
  }else{ step(s,s.px,s.py,s.spd*.8,dt); s.atkT=Math.max(s.atkT-dt,0); }
 });
 // chapel shield decay
 if(G.chapel.shieldTime>0){ G.chapel.shieldTime-=dt; if(G.chapel.shieldTime<=0)G.chapel.shield=0; }
 // enemies
 G.enemies.forEach(e=>{
  e.ftT-=dt; e.flashT-=dt; e.spawnT-=dt; e.lungeT-=dt;
  if(e.spawnT>0)return;
  let target=null;
  if(e.type==='stalker'){
   const living=G.healers.filter(h=>!h.fallen);
   target=living.length?living.reduce((m,h)=>dist(h,e)<dist(m,e)?h:m,living[0]):G.chapel;
  }else if(e.type==='spitter'){
   const cands=[...G.soldiers,...G.healers.filter(h=>!h.fallen),G.chapel];
   target=cands.reduce((m,a)=>dist(a,e)<dist(m,e)?a:m,cands[0]);
  }else if(e.type==='acolyte'){
   const near=G.soldiers.find(s=>dist(s,e)<130);
   target=near||G.chapel;
  }else if(e.type==='bloated'||e.type==='boss'){
   target=G.chapel;
   const near=[...G.soldiers,...G.healers.filter(h=>!h.fallen)].find(a=>dist(a,e)<(e.type==='boss'?95:65));
   if(near)target=near;
  }else{
   target=G.soldiers.length?G.soldiers.reduce((m,s)=>dist(s,e)<dist(m,e)?s:m,G.soldiers[0]):G.chapel;
   if(dist(e,target)>520)target=G.chapel;
  }
  if(!target)return;
  const d=dist(e,target);
  if(e.type==='spitter'||e.type==='acolyte'){
   const range=e.type==='acolyte'?ENEMY_DEF.acolyte.range:ENEMY_DEF.spitter.range;
   if(d>range)step(e,target.x,target.y,e.spd,dt);
   else{ e.a=angLerp(e.a,Math.atan2(target.y-e.y,target.x-e.x),.15);
    e.atkT-=dt; e.chargeT=e.atkT<.35?.35-e.atkT:0;
    if(e.atkT<=0){ e.atkT=e.cd;
     G.projectiles.push({x:e.x,y:e.y,target,tx:target.x,ty:target.y,spd:e.type==='acolyte'?330:260,dmg:e.dmg,t:0});
     burst(e.x,e.y,PAL.acid,3,40,true); } }
  }else{
   const reach=e.r+target.r+8;
   if(d>reach)step(e,target.x,target.y,e.spd,dt);
   else{ e.a=angLerp(e.a,Math.atan2(target.y-e.y,target.x-e.x),.2);
    e.atkT-=dt;
    if(e.atkT<=0){ e.atkT=e.cd; e.lungeT=.15; damageAlly(target,e.dmg); } }
  }
  if(e.type==='boss'){
   e.auraT-=dt;
   if(e.auraT<=0){ e.auraT=.5;
    [...G.soldiers,...G.healers.filter(h=>!h.fallen)].forEach(a=>{ if(dist(a,e)<=150)damageAlly(a,2.5*G.diff.dmg); });
    G.pulses.push({x:e.x,y:e.y,r:40,max:150,t:0,color:PAL.blight}); }
   e.summonT-=dt;
   if(e.summonT<=0){ e.summonT=9; for(let i=0;i<2;i++){ const d2=ENEMY_DEF.husk;
    G.enemies.push({kind:'enemy',type:'husk',x:e.x+rand(-40,40),y:e.y+rand(-40,40),a:rand(TAU),r:d2.r,
     hp:d2.hp*G.diff.hp*G.waveScale,max:d2.hp*G.diff.hp*G.waveScale,spd:d2.spd,dmg:d2.dmg*G.diff.dmg*G.waveScale,cd:d2.cd,atkT:1,
     flashT:0,ftT:0,spawnT:.4,auraT:0,summonT:0,chargeT:0,bob:rand(TAU),lungeT:0}); }
    burst(e.x,e.y,PAL.blight,10,90,true); toast('The Blightfather births more rot!','warn','summon',5); }
  }
 });
 // separation
 const movers=[...G.soldiers,...G.enemies.filter(e=>e.spawnT<=0),...G.healers.filter(h=>!h.fallen)];
 for(let i=0;i<movers.length;i++)for(let j=i+1;j<movers.length;j++){
  const a=movers[i],b=movers[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.r+b.r)*.85;
  if(d>0&&d<min){ const push=(min-d)/2,px=dx/d*push,py=dy/d*push;
   const aw=a.type==='boss'?.15:1, bw=b.type==='boss'?.15:1;
   a.x-=px*aw; a.y-=py*aw; b.x+=px*bw; b.y+=py*bw; }
 }
 // projectiles
 G.projectiles=G.projectiles.filter(p=>{
  p.t+=dt;
  if(p.target&&p.target.hp>0&&!p.target.fallen){ p.tx=p.target.x; p.ty=p.target.y; }
  const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy);
  if(d<14||p.t>3){
   const hit=[...G.soldiers,...G.healers.filter(h=>!h.fallen),G.chapel].find(a=>Math.hypot(a.x-p.tx,a.y-p.ty)<Math.max(20,a.r));
   if(hit)damageAlly(hit,p.dmg);
   burst(p.tx,p.ty,PAL.acid,5,50,true); return false;
  }
  p.x+=dx/d*p.spd*dt; p.y+=dy/d*p.spd*dt;
  if(Math.random()<dt*20)addPart({x:p.x,y:p.y,vx:0,vy:0,t:0,life:.3,size:2,color:PAL.acid,glow:true,grav:0});
  return true;
 });
 // fields
 G.fields=G.fields.filter(f=>{
  f.t+=dt; f.tick-=dt;
  if(f.tick<=0){ f.tick=.25;
   G.enemies.forEach(e=>{ if(Math.hypot(e.x-f.x,e.y-f.y)<=f.r)damageEnemy(e,3); });
   allies().forEach(a=>{ if(Math.hypot(a.x-f.x,a.y-f.y)<=f.r)addHeal(a,2*G.healMult); });
   G.pools.forEach(p=>{ if(Math.hypot(p.x-f.x,p.y-f.y)<=f.r+p.r)p.t-=.5; });
   motes(f.x+rand(-f.r,f.r)*.7,f.y+rand(-f.r,f.r)*.7,PAL.cyan,1);
  }
  return f.t<f.dur;
 });
 // pools
 G.pools=G.pools.filter(p=>{
  p.t-=dt;
  [...G.soldiers,...G.healers.filter(h=>!h.fallen)].forEach(a=>{ if(Math.hypot(a.x-p.x,a.y-p.y)<=p.r)damageAlly(a,6*G.diff.dmg*dt); });
  if(Math.random()<dt*4)addPart({x:p.x+rand(-p.r,p.r)*.7,y:p.y+rand(-p.r,p.r)*.7,vx:0,vy:-12,t:0,life:.8,size:2.5,color:PAL.blight,glow:true,grav:0});
  return p.t>0;
 });
 // floaters decay timers
 [...G.soldiers,...G.healers,G.enemies,G.chapel].forEach(u=>{ if(u.ftT>0)u.ftT-=dt; });
 updateFx(dt);
 G.shake=Math.max(0,G.shake-dt*14);
 if(S.state==='ending'){ G.endT-=dt; if(G.endT<=0)showEnd(); }
}
export function updateFx(dt){
 G.particles=G.particles.filter(p=>{ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=(p.grav||0)*dt; return p.t<p.life; });
 G.floaters=G.floaters.filter(f=>{ f.t+=dt; f.y-=30*dt; return f.t<f.life; });
 G.pulses=G.pulses.filter(p=>{ p.t+=dt*2.4; p.r=lerp(p.r,p.max,dt*6); return p.t<1; });
 G.markers=G.markers.filter(m=>{ m.t+=dt; return m.t<.8; });
 G.rifts.forEach(r=>{ r.flashT-=dt; r.spawnFlash-=dt; });
}
export function updateAmbient(dt){
 G.sporeT-=dt;
 if(G.sporeT<=0){ G.sporeT=.4;
  addPart({x:rand(W),y:rand(-20,H*.3),vx:rand(-16,-8),vy:rand(6,14),t:0,life:rand(6,10),size:rand(1,2),color:'#7a8f6a',glow:false,grav:0,spore:true}); }
 G.emberT-=dt;
 if(G.emberT<=0){ G.emberT=.3;
  TORCHES.forEach(([tx,ty])=>addPart({x:tx+rand(-2,2),y:ty-8,vx:rand(-6,6),vy:rand(-26,-14),t:0,life:rand(.5,1.1),size:rand(1,2.2),color:PAL.gold,glow:true,grav:0})); }
 if(G.chapel.hp<G.chapel.max*.3&&Math.random()<dt*3)
  addPart({x:G.chapel.x+rand(-30,30),y:G.chapel.y+rand(-20,10),vx:rand(-4,4),vy:-18,t:0,life:1.6,size:rand(3,6),color:'#5a5a5a',glow:false,grav:0});
}
