// HUD/cards, overlays, input, and run flow.
import { G, S, toast, floater, showBanner, reset, loadBest, saveBest } from './state.js';
import { cast, command, selectAll } from './combat.js';
import { ROLES, DIFFS, PAL, waveFor, waveCompText, computeScore, rankFor } from './data.js';
import { clamp, roman } from './util.js';
import { $, canvas, V, drag } from './dom.js';
import { AudioSys } from './audio.js';

/* ================= UI SYNC ================= */
const UIprev={};
export function setTxt(id,v){ if(UIprev[id]!==v){ UIprev[id]=v; $(id).textContent=v; } }
export function buildCards(){
 const box=$('cards'); box.innerHTML='';
 ROLES.forEach((r,i)=>{
  const card=document.createElement('button'); card.className='card'; card.style.setProperty('--rc',r.color);
  card.title=`${r.name} — ${r.role}. ${r.ability} (${r.key}): click to invoke at cursor.`;
  card.innerHTML=`
   <div class="portrait"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${r.icon}</svg></div>
   <div class="cinfo"><div class="cname">${r.name}</div><div class="crole">${r.role}</div>
    <div class="hpbar"><i style="width:100%"></i><b style="width:0%"></b></div>
    <div class="fallenTag">FALLEN — RIGHT-CLICK TO REVIVE</div></div>
   <div class="ability"><div class="cd"></div><div class="akey">${r.key}</div><div class="aname">${r.ability}</div><div class="acost">✦ ${r.cost}</div><div class="cdsec"></div></div>`;
  card.addEventListener('click',()=>{
   const h=G.healers[i];
   if(h.fallen){ toast(`${r.name} has fallen — right-click ${r.pron==='She'?'her':'him'} with another healer.`,'warn'); return; }
   G.sel=[h]; AudioSys.sfx('select');
  });
  card.querySelector('.ability').addEventListener('click',ev=>{ ev.stopPropagation(); cast(i); });
  box.appendChild(card);
 });
}
export function uiSync(){
 setTxt('faithVal',String(Math.floor(G.faith)));
 setTxt('faithRegen','+'+G.faithRegen.toFixed(1)+'/s');
 setTxt('soldierVal',String(G.soldiers.length));
 const cp=clamp(G.chapel.hp/G.chapel.max,0,1);
 const cw=Math.round(cp*100)+'%';
 if(UIprev.cw!==cw){ UIprev.cw=cw; const f=$('chapelFill'); f.style.width=cw;
  f.style.background=cp>.5?'linear-gradient(90deg,#3ddc84,#5fe3a1)':cp>.25?'linear-gradient(90deg,#ffb454,#ffc857)':'linear-gradient(90deg,#ff5f5f,#ff8a7a)'; }
 setTxt('chapelVal',String(Math.ceil(G.chapel.hp)));
 if(G.waveIdx>=0&&G.phase==='combat'){
  setTxt('waveLabel','WAVE '+roman(G.waveIdx+1)+' — '+waveFor(G.waveIdx).name.toUpperCase());
  setTxt('objLabel','Blight remaining: '+(G.queue.length+G.enemies.length)+' · keep the chapel standing');
 }else if(G.phase==='respite'||G.phase==='prep'){
  setTxt('waveLabel',G.waveIdx<0?'THE VIGIL BEGINS':'RESPITE');
  setTxt('objLabel','Next: '+waveFor(G.waveIdx+1).name+' · '+Math.ceil(Math.max(0,G.respiteT))+'s · '+waveCompText(waveFor(G.waveIdx+1)));
 }else{ setTxt('waveLabel','THE LAST CHAPEL OF VEY'); setTxt('objLabel','Keep the chapel standing · preserve the garrison'); }
 // banner countdown
 if((G.phase==='respite'||G.phase==='prep')&&S.state==='playing'){
  $('banner').classList.add('show','respite');
  setTxt('bannerTitle',G.waveIdx<0?'THE VIGIL BEGINS':'A MOMENT TO BREATHE');
  setTxt('bannerSub','The blight stirs — '+Math.ceil(Math.max(0,G.respiteT))+'s');
 }
 // cards
 const cards=$('cards').children;
 G.healers.forEach((h,i)=>{
  const card=cards[i]; if(!card)return;
  card.classList.toggle('selected',G.sel.includes(h));
  card.classList.toggle('fallen',h.fallen);
  const hp=card.querySelector('.hpbar i'), sh=card.querySelector('.hpbar b');
  const hw=Math.round(clamp(h.hp/h.max,0,1)*100)+'%';
  if(hp.style.width!==hw)hp.style.width=hw;
  const sw=Math.round(clamp(h.shield/80,0,1)*100)+'%';
  if(sh.style.width!==sw)sh.style.width=sw;
  const ab=card.querySelector('.ability'), cd=card.querySelector('.cd'), sec=card.querySelector('.cdsec');
  const pct=h.cdLeft>0?h.cdLeft/h.cdTotal:0;
  cd.style.height=Math.round(pct*100)+'%';
  const st=h.cdLeft>0?Math.ceil(h.cdLeft)+'':'';
  if(sec.textContent!==st)sec.textContent=st;
  ab.classList.toggle('nofaith',G.faith<h.role.cost&&h.cdLeft<=0&&!h.fallen);
 });
 // hint
 let hint;
 if(G.healers.every(h=>h.fallen))hint='The company has fallen…';
 else if(G.sel.length)hint=`<b>${G.sel.length}</b> healer${G.sel.length>1?'s':''} selected — right-click to move, heal, or revive. Healers channel while stationary.`;
 else hint='<b>Drag</b> select · <b>Right-click</b> move / heal / revive · <b>Q W E R</b> rites · <b>Space</b> pause';
 if(UIprev.hint!==hint){ UIprev.hint=hint; $('hint').innerHTML=hint; }
}

/* ================= INPUT ================= */
let lpTimer=null, lpFired=false, downPos=null;
export function toWorld(e){
 const r=canvas.getBoundingClientRect();
 return {x:(e.clientX-r.left-V.ox)/V.s,y:(e.clientY-r.top-V.oy)/V.s};
}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 AudioSys.resume();
 const p=toWorld(e); G.cursor=p;
 if(e.button===2){ command(p); return; }
 if(e.button!==0)return;
 canvas.setPointerCapture(e.pointerId);
 drag.active=true; drag.moved=false; drag.id=e.pointerId;
 drag.sx=drag.cx=p.x; drag.sy=drag.cy=p.y;
 downPos=p; lpFired=false;
 if(e.pointerType!=='mouse'){
  lpTimer=setTimeout(()=>{ if(drag.active&&!drag.moved){ lpFired=true; command(p); } },380);
 }
});
canvas.addEventListener('pointermove',e=>{
 const p=toWorld(e); G.cursor=p;
 if(drag.active&&e.pointerId===drag.id){
  drag.cx=p.x; drag.cy=p.y;
  if(Math.hypot(drag.cx-drag.sx,drag.cy-drag.sy)>10){ drag.moved=true; if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} }
 }else{
  const hov=G.healers.some(h=>Math.hypot(h.x-p.x,h.y-p.y)<24);
  canvas.style.cursor=hov?'pointer':'crosshair';
 }
});
canvas.addEventListener('pointerup',e=>{
 if(lpTimer){ clearTimeout(lpTimer); lpTimer=null; }
 if(e.button!==0||!drag.active||e.pointerId!==drag.id)return;
 drag.active=false;
 if(lpFired)return;
 const p=toWorld(e);
 if(drag.moved&&e.pointerType==='mouse'){
  const x=Math.min(drag.sx,p.x),y=Math.min(drag.sy,p.y),w2=Math.abs(p.x-drag.sx),h2=Math.abs(p.y-drag.sy);
  G.sel=G.healers.filter(h=>!h.fallen&&h.x>=x&&h.x<=x+w2&&h.y>=y&&h.y<=y+h2);
  if(G.sel.length)AudioSys.sfx('select');
  return;
 }
 // click / tap
 const h=G.healers.find(h2=>Math.hypot(h2.x-p.x,h2.y-p.y)<26);
 if(h){
  if(h.fallen){ toast(`${h.role.name} has fallen — right-click (or hold) with another healer to revive.`,'warn'); }
  else{ G.sel=[h]; AudioSys.sfx('select'); }
  return;
 }
 if(e.pointerType!=='mouse'&&G.sel.length){ command(p); return; }
 G.sel=[];
});
canvas.addEventListener('pointercancel',()=>{ drag.active=false; if(lpTimer){clearTimeout(lpTimer);lpTimer=null;} });

window.addEventListener('keydown',e=>{
 if(e.repeat)return;
 const k=e.key.toLowerCase();
 if(k===' '){ e.preventDefault();
  if(S.state==='playing')pauseGame(true); else if(S.state==='paused')pauseGame(false); return; }
 if(k==='escape'){ if(S.state==='playing')pauseGame(true); else if(S.state==='paused')pauseGame(false); return; }
 if(k==='m'){ toggleMute(); return; }
 if(k==='f'){ toggleSpeed(); return; }
 if(S.state!=='playing')return;
 if(k==='q')cast(0); else if(k==='w')cast(1); else if(k==='e')cast(2); else if(k==='r')cast(3);
 else if(k==='a')selectAll();
 else if(k>='1'&&k<='4'){ const h=G.healers[+k-1];
  if(h.fallen)toast(`${h.role.name} has fallen.`,'warn'); else{ G.sel=[h]; AudioSys.sfx('select'); } }
});
window.addEventListener('blur',()=>{ if(S.state==='playing')pauseGame(true); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&S.state==='playing')pauseGame(true); else AudioSys.resume(); });
/* ================= FLOW ================= */
export function pauseGame(p){
 if(p&&S.state==='playing'){ S.state='paused'; $('pause').classList.remove('hidden'); }
 else if(!p&&S.state==='paused'){ S.state='playing'; $('pause').classList.add('hidden'); }
 $('icoPause').style.display=p?'none':'block'; $('icoPlay').style.display=p?'block':'none';
 $('btnPause').classList.toggle('on',p);
}
export function toggleMute(){
 AudioSys.setMuted(!AudioSys.muted);
 $('icoSndOn').style.display=AudioSys.muted?'none':'block';
 $('icoSndOff').style.display=AudioSys.muted?'block':'none';
 $('btnAudio').classList.toggle('on',!AudioSys.muted);
 try{localStorage.setItem('coh_mute',AudioSys.muted?'1':'0');}catch(e){}
}
export function toggleSpeed(){ G.speed=G.speed===1?2:1; $('btnSpeed').textContent=G.speed+'×'; $('btnSpeed').classList.toggle('on',G.speed===2); }
export function startRun(diffKey){
 reset(diffKey); buildCards(); S.state='playing';
 ['menu','pause','boon','end'].forEach(id=>$(id).classList.add('hidden'));
 $('icoPause').style.display='block'; $('icoPlay').style.display='none'; $('btnPause').classList.remove('on');
 $('banner').classList.remove('show','respite');
 toast('Keep the chapel standing. Keep the garrison alive.','holy');
 setTimeout(()=>{ if(S.state==='playing')toast('Right-click to move your healers — they mend while stationary.','info'); },1600);
 AudioSys.sfx('bell');
}
export function toMenu(){
 reset('penitent'); buildCards(); S.state='menu';
 ['pause','boon','end'].forEach(id=>$(id).classList.add('hidden'));
 $('banner').classList.remove('show','respite');
 $('menu').classList.remove('hidden');
 refreshBestLine();
}
export function refreshBestLine(){
 const best=loadBest(), parts=[];
 Object.keys(DIFFS).forEach(k=>{ if(best[k])parts.push(`${DIFFS[k].label}: ${best[k].score} — ${best[k].rank}`); });
 $('bestLine').textContent=parts.length?'HIGHEST VIGILS · '+parts.join('  ·  '):'';
}

document.querySelectorAll('.diffBtn').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.diffBtn').forEach(x=>x.classList.remove('sel'));
 b.classList.add('sel'); S.pendingDiff=b.dataset.diff; AudioSys.resume(); AudioSys.sfx('select');
}));
$('btnBegin').addEventListener('click',()=>{ AudioSys.init(); AudioSys.resume(); startRun(S.pendingDiff); });
$('btnResume').addEventListener('click',()=>pauseGame(false));
$('btnPauseRestart').addEventListener('click',()=>startRun(G.diffKey));
$('btnQuit').addEventListener('click',toMenu);
$('btnAgain').addEventListener('click',()=>startRun(G.diffKey));
$('btnTitle').addEventListener('click',toMenu);
$('btnRestart').addEventListener('click',()=>{ if(S.state!=='menu')startRun(G.diffKey); });
$('btnPause').addEventListener('click',()=>{ if(S.state==='playing')pauseGame(true); else if(S.state==='paused')pauseGame(false); });
$('btnAudio').addEventListener('click',()=>{ AudioSys.init(); toggleMute(); });
$('btnSpeed').addEventListener('click',toggleSpeed);
$('btnAll').addEventListener('click',selectAll);
$('hornBtn').addEventListener('click',()=>{
 if(S.state==='playing'&&(G.phase==='respite'||G.phase==='prep')){
  G.respiteT=0; G.faith=Math.min(G.faithCap,G.faith+10);
  floater(G.chapel.x,G.chapel.y-80,'+10 FAITH',PAL.gold); AudioSys.sfx('horn');
 }
});
export function continueEndless(){
 if(S.state!=='end'||!G.endWin||G.endless)return;
 G.endless=true; S.state='playing'; G.phase='respite'; G.respiteT=8;
 $('end').classList.add('hidden');
 showBanner('THE VIGIL CONTINUES','Endless waves gather — how long can mercy hold?',true);
 toast('The vigil deepens. The Blight does not rest.','warn');
 AudioSys.sfx('horn');
}
$('btnEndless').addEventListener('click',continueEndless);

export function showEnd(){
 S.state='end';
 const score=computeScore(G.stats,G.soldiers.length,G.chapel.hp/G.chapel.max,G.waveIdx), rank=rankFor(score,G.endWin);
 const t=$('endTitle');
 t.textContent=G.endWin?'Dawn Breaks Over Vey':(G.endReason==='chapel'?'The Chapel Falls':'The Lantern Gutters Out');
 t.className=G.endWin?'win':'lose';
 $('endRank').textContent=rank;
 const s=G.stats, mins=Math.floor(G.time/60), secs=Math.floor(G.time%60);
 const cells=[
  [Math.round(s.healed),'Mercy Poured','heal'],[s.kills,'Souls Released','blight'],
  [G.soldiers.length,'Garrison Saved','gold'],[Math.round(G.chapel.hp/G.chapel.max*100)+'%','Chapel Integrity','cyan'],
  [s.riftsSealed+'/3','Rifts Sealed','violet'],[mins+':'+String(secs).padStart(2,'0'),'Vigil Kept','warn']
 ];
 $('endStats').innerHTML=cells.map(([v,l,c])=>`<div class="stat ${c}"><div class="sv">${v}</div><div class="sl">${l}</div></div>`).join('');
 const best=loadBest(), prev=best[G.diffKey];
 let bestMsg=`Vigil score: ${score} · ${G.diff.label}`;
 if(!prev||score>prev.score){ best[G.diffKey]={score,rank}; saveBest(best); bestMsg+=' — NEW BEST'; }
 else bestMsg+=` · Best: ${prev.score}`;
 $('endBest').textContent=bestMsg;
 $('btnEndless').style.display=(G.endWin&&!G.endless)?'':'none';
 $('end').classList.remove('hidden');
}
