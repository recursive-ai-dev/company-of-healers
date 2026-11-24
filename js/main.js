// Init + main loop.
import { G, S, reset } from './state.js';
import { buildGround, render } from './render.js';
import { uiSync, refreshBestLine, buildCards } from './ui.js';
import { update, updateFx, updateAmbient } from './update.js';
import { $, canvas, V } from './dom.js';
import { W, H } from './util.js';
import { AudioSys } from './audio.js';

/* ================= RESIZE / LOOP ================= */
function resize(){
 const stage=$('stage'), r=stage.getBoundingClientRect();
 V.dpr=Math.min(2,window.devicePixelRatio||1);
 V.w=r.width; V.h=r.height;
 canvas.width=Math.round(r.width*V.dpr); canvas.height=Math.round(r.height*V.dpr);
 V.s=Math.min(V.w/W,V.h/H); V.ox=(V.w-W*V.s)/2; V.oy=(V.h-H*V.s)/2;
}
window.addEventListener('resize',resize);

let last=performance.now();
function loop(now){
 // Limit long tab-suspension jumps, but don't tie game speed to render FPS.
 // Small simulation steps keep movement, spawning, and damage stable on slow devices.
 const raw=Math.max(0,Math.min(.25,(now-last)/1000)); last=now;
 G.vt+=raw;
 if(S.state==='playing'||S.state==='ending'){
  let remaining=raw*G.speed;
  while(remaining>0){ const dt=Math.min(.05,remaining); update(dt); updateAmbient(dt); remaining-=dt; }
 }else if(S.state==='menu'||S.state==='end'){ updateFx(raw); updateAmbient(raw); }
 render(); uiSync();
 requestAnimationFrame(loop);
}

/* ================= INIT ================= */
try{ AudioSys.muted=localStorage.getItem('coh_mute')==='1'; }catch(e){}
if(AudioSys.muted){ $('icoSndOn').style.display='none'; $('icoSndOff').style.display='block'; $('btnAudio').classList.remove('on'); }
buildGround();
reset('penitent'); buildCards();
refreshBestLine();
resize();
requestAnimationFrame(loop);
