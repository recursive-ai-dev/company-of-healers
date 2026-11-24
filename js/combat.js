// Healing/damage, rites, commands, and reinforcement helpers.
import { G, S, toast, floater, burst, motes, wisp, makeSoldier, triggerEnd } from './state.js';
import { PAL } from './data.js';
import { W, H, clamp, dist, rand, TAU } from './util.js';
import { $ } from './dom.js';
import { AudioSys } from './audio.js';

/* ================= COMBAT MATH ================= */
export function allies(){ return [...G.soldiers,...G.healers.filter(h=>!h.fallen),G.chapel]; }
export function addHeal(u,amt){
 if(u.hp<=0||(u.fallen))return 0;
 const actual=Math.min(amt,u.max-u.hp); if(actual<=0)return 0;
 u.hp+=actual; G.stats.healed+=actual; G.faith=Math.min(G.faithCap,G.faith+actual/12);
 u.ftT-=0; if(u.ftT<=0&&actual>=1){ floater(u.x+rand(-6,6),u.y-u.r-8,'+'+Math.round(actual),PAL.heal); u.ftT=.4; }
 return actual;
}
export function damageAlly(u,amt){
 if(u.fallen||u.hp<=0)return;
 if(u.shield>0){ const ab=Math.min(u.shield,amt); u.shield-=ab; amt-=ab;
  if(ab>0&&u.ftT<=0){ floater(u.x,u.y-u.r-8,'-'+Math.round(ab),PAL.cyan); u.ftT=.35; } }
 if(amt<=0)return;
 u.hp-=amt; u.flashT=.18;
 if(u.ftT<=0){ floater(u.x+rand(-6,6),u.y-u.r-8,'-'+Math.round(amt),PAL.danger); u.ftT=.4; }
 if(u.isChapel){ G.shake=Math.max(G.shake,3); AudioSys.sfx('chapelHit');
  toast('The chapel is under assault!','danger','chapel',6);
  if(u.hp<=0){ u.hp=0; triggerEnd(false,'chapel'); } return; }
 AudioSys.sfx('hit');
 if(u.hp<=0){
  u.hp=0;
  if(u.kind==='soldier'){
   G.stats.soldiersLost++; wisp(u.x,u.y,'#aab4be'); burst(u.x,u.y,'#7d8894',6,60);
   G.soldiers=G.soldiers.filter(s=>s!==u);
   toast('A guardsman has fallen.','warn','soldier',4); AudioSys.sfx('soldierDie');
  }else if(u.kind==='healer'){
   u.fallen=true; u.move=u.focus=u.revive=null; u.revP=0;
   G.stats.healersFallen++; G.sel=G.sel.filter(h=>h!==u);
   wisp(u.x,u.y,u.role.color); burst(u.x,u.y,u.role.color,10,60,true);
   toast(`${u.role.name} has fallen! Right-click ${u.role.pron==='She'?'her':'his'} body with another healer to revive.`,'danger');
   AudioSys.sfx('healerFall'); G.shake=Math.max(G.shake,5);
   if(G.healers.every(h=>h.fallen))triggerEnd(false,'company');
  }
 }
}
export function damageEnemy(e,amt){
 if(e.hp<=0)return;
 e.hp-=amt; e.flashT=.15;
 if(e.ftT<=0&&amt>=2){ floater(e.x+rand(-6,6),e.y-e.r-6,'-'+Math.round(amt),'#e8d8f0'); e.ftT=.35; }
 if(e.hp<=0){
  e.hp=0; G.stats.kills++; G.faith=Math.min(G.faithCap,G.faith+4);
  floater(e.x,e.y-e.r-14,'+4',PAL.gold);
  burst(e.x,e.y,PAL.blight,e.type==='boss'?26:8,e.type==='boss'?160:80,true);
  wisp(e.x,e.y,'#d8b8f0'); AudioSys.sfx('enemyDie');
  if(e.type==='bloated'){ G.pools.push({x:e.x,y:e.y,r:70,t:8,max:8}); G.shake=Math.max(G.shake,4); AudioSys.sfx('pop');
   burst(e.x,e.y,PAL.acid,10,90,true); }
  if(e.type==='boss'){ G.shake=14; toast('The Blightfather is unmade!','holy'); AudioSys.sfx('riftSeal'); }
  G.enemies=G.enemies.filter(x=>x!==e);
 }
}
export function damageRift(r,amt){
 if(r.sealed)return; r.hp-=amt; r.flashT=.12;
 if(r.hp<=0){ r.hp=0; r.sealed=true; G.stats.riftsSealed++;
  G.faith=Math.min(G.faithCap,G.faith+25); floater(r.x,r.y-40,'+25 SEALED',PAL.gold);
  burst(r.x,r.y,PAL.cyan,18,110,true); toast('A rift is sealed. The dark recoils.','holy'); AudioSys.sfx('riftSeal'); }
}
/* ================= ABILITIES ================= */
function allyName(a){
 if(a.isChapel)return 'The chapel';
 if(a.kind==='soldier')return 'A guardsman';
 if(a.kind==='healer')return a.role.name;
 return 'An ally';
}
export function cast(i){
 if(S.state!=='playing')return;
 const h=G.healers[i], r=h.role, card=$('cards').children[i];
 const fail=msg=>{ card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  toast(msg,'warn','castfail',1.2); AudioSys.sfx('error'); };
 if(h.fallen)return fail(`${r.name} has fallen — revive ${r.pron==='She'?'her':'him'} first.`);
 if(h.cdLeft>0)return fail(`${r.ability} is not yet ready.`);
 if(G.faith<r.cost)return fail('Not enough Faith.');
 const cur=G.cursor;
 if(r.id==='mender'){
  const list=allies(); let target=null,bd=140;
  list.forEach(a=>{ const d=Math.hypot(a.x-cur.x,a.y-cur.y); if(d<bd){bd=d;target=a;} });
  if(!target)target=list.reduce((m,a)=>(a.hp/a.max<m.hp/m.max)?a:m,list[0]);
  if(target.hp>=target.max)return fail(`${allyName(target)} is already whole.`);
  G.faith-=r.cost; h.cdTotal=r.cd*G.cdMult; h.cdLeft=h.cdTotal;
  const healed=addHeal(target,55*G.healMult);
  floater(target.x,target.y-target.r-14,'+'+Math.round(healed),PAL.heal);
  motes(target.x,target.y,PAL.heal,8); burst(target.x,target.y,PAL.heal,6,50,true);
  G.markers.push({x:target.x,y:target.y,t:0,type:'heal'}); AudioSys.sfx('mend');
  return;
 }
 G.faith-=r.cost; h.cdTotal=r.cd*G.cdMult; h.cdLeft=h.cdTotal;
 if(r.id==='chanter'){
  allies().forEach(a=>{ if(dist(a,h)<=150){ const healed=addHeal(a,42*G.healMult);
   if(healed>0)motes(a.x,a.y,PAL.gold,4); } });
  G.pulses.push({x:h.x,y:h.y,r:20,max:150,t:0,color:PAL.gold});
  AudioSys.sfx('hymn');
 }else if(r.id==='purifier'){
  const fx=clamp(cur.x,40,W-40),fy=clamp(cur.y,40,H-40);
  G.fields.push({x:fx,y:fy,r:95,t:0,dur:5.5,tick:0});
  burst(fx,fy,PAL.cyan,12,80,true); AudioSys.sfx('consecrate');
 }else if(r.id==='warden'){
  allies().forEach(a=>{ if(dist(a,h)<=170){ a.shield=Math.max(a.shield,Math.min(80,a.shield+55)); a.shieldTime=Math.max(a.shieldTime,7);
   motes(a.x,a.y,PAL.violet,3); } });
  G.pulses.push({x:h.x,y:h.y,r:20,max:170,t:0,color:PAL.violet});
  AudioSys.sfx('aegis');
 }
}
/* ================= COMMAND / SELECTION ================= */
export function command(pos){
 if(S.state!=='playing')return;
 let cmd=G.sel.filter(h=>!h.fallen);
 if(!cmd.length)cmd=G.healers.filter(h=>!h.fallen);
 if(!cmd.length)return;
 // fallen healer → revive
 const fallen=G.healers.find(h=>h.fallen&&Math.hypot(h.x-pos.x,h.y-pos.y)<28);
 if(fallen){
  const reviver=cmd.reduce((m,h)=>dist(h,fallen)<dist(m,fallen)?h:m,cmd[0]);
  reviver.revive=fallen; reviver.move=null; reviver.focus=null; reviver.revP=0;
  cmd.forEach((h,i)=>{ if(h!==reviver){ h.move={x:fallen.x+Math.cos(i*2.4)*40,y:fallen.y+Math.sin(i*2.4)*40}; h.focus=null; h.revive=null; } });
  G.markers.push({x:fallen.x,y:fallen.y,t:0,type:'heal'});
  toast(`${reviver.role.name} kneels to revive ${fallen.role.name}…`,'info','rev',3);
  AudioSys.sfx('move'); return;
 }
 // ally → focus heal
 const ally=allies().find(a=>Math.hypot(a.x-pos.x,a.y-pos.y)<Math.max(24,a.r));
 if(ally){
  cmd.forEach(h=>{ h.focus=ally; h.move=null; h.revive=null; });
  G.markers.push({x:ally.x,y:ally.y,t:0,type:'heal'}); AudioSys.sfx('heal'); return;
 }
 // move in formation
 cmd.forEach((h,i)=>{
  const a=i/cmd.length*TAU, rad=cmd.length>1?26:0;
  h.move={x:clamp(pos.x+Math.cos(a)*rad,24,W-24),y:clamp(pos.y+Math.sin(a)*rad,24,H-24)};
  h.focus=null; h.revive=null;
 });
 G.markers.push({x:pos.x,y:pos.y,t:0,type:'move'}); AudioSys.sfx('move');
}
export function selectAll(){ G.sel=G.healers.filter(h=>!h.fallen); AudioSys.sfx('select'); }
export function addSoldier(){
 if(G.soldiers.length>=12){ G.faith=Math.min(G.faithCap,G.faith+30); toast('The line is full — the faithful send 30 Faith instead.','info'); return; }
 const s=makeSoldier(G.nextPost++); G.soldiers.push(s);
 motes(s.x,s.y,PAL.gold,4); toast('A guardsman joins the vigil.','info','join',2);
}
export function reviveHealer(h,pct){
 h.fallen=false; h.hp=Math.round(h.max*pct); h.revP=0;
 burst(h.x,h.y,h.role.color,14,90,true); motes(h.x,h.y,PAL.gold,6);
 toast(`${h.role.name} rises again!`,'holy'); AudioSys.sfx('revive');
}
