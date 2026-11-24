// Baked ground + all canvas drawing.
import { G } from './state.js';
import { PAL, TORCHES } from './data.js';
import { TAU, W, H, rand, randi, choice, hexA, clamp, lerp } from './util.js';
import { canvas, ctx, V, drag } from './dom.js';

/* ================= SPRITES / BAKED ART ================= */
const glowCache={};
export function makeGlow(color,r){
 const key=color+r; if(glowCache[key])return glowCache[key];
 const c=document.createElement('canvas'); c.width=c.height=r*2;
 const x=c.getContext('2d'); const g=x.createRadialGradient(r,r,0,r,r,r);
 g.addColorStop(0,hexA(color,.85)); g.addColorStop(.35,hexA(color,.32)); g.addColorStop(1,hexA(color,0));
 x.fillStyle=g; x.fillRect(0,0,r*2,r*2); glowCache[key]=c; return c;
}
export function drawGlow(ctx,x,y,r,color,alpha=1){
 ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=alpha;
 ctx.drawImage(makeGlow(color,64),x-r,y-r,r*2,r*2); ctx.restore();
}
export function rr(ctx,x,y,w,h,r){
 ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
 ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

let ground=null, vignette=null;
export function buildGround(){
 const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
 const bg=x.createLinearGradient(0,0,W,H);
 bg.addColorStop(0,'#111b12'); bg.addColorStop(.5,'#0d150f'); bg.addColorStop(1,'#0f1710');
 x.fillStyle=bg; x.fillRect(0,0,W,H);
 for(let i=0;i<70;i++){ const gx=rand(W),gy=rand(H),gr=rand(60,220);
  const g=x.createRadialGradient(gx,gy,0,gx,gy,gr);
  const col=choice(['#16241a','#0a120c','#1a2a1c','#122016']);
  g.addColorStop(0,hexA(col,.35)); g.addColorStop(1,hexA(col,0));
  x.fillStyle=g; x.beginPath(); x.arc(gx,gy,gr,0,TAU); x.fill(); }
 // blight stains near rifts
 [[1390,450],[1080,130],[1080,770]].forEach(([rx,ry])=>{
  for(let i=0;i<4;i++){ const g=x.createRadialGradient(rx+rand(-40,40),ry+rand(-40,40),0,rx,ry,rand(90,170));
   g.addColorStop(0,'rgba(42,16,56,.55)'); g.addColorStop(.6,'rgba(30,12,42,.28)'); g.addColorStop(1,'rgba(30,12,42,0)');
   x.fillStyle=g; x.fillRect(rx-200,ry-200,400,400); }
  x.strokeStyle='rgba(90,40,110,.3)'; x.lineWidth=1.5;
  for(let i=0;i<8;i++){ x.beginPath(); let px=rx+rand(-30,30),py=ry+rand(-30,30); x.moveTo(px,py);
   for(let j=0;j<4;j++){ px+=rand(-45,45); py+=rand(-45,45); x.lineTo(px,py);} x.stroke(); }
 });
 // paths
 const path=(pts,w2)=>{ x.strokeStyle='#221d13'; x.lineWidth=w2; x.lineCap='round'; x.lineJoin='round';
  x.beginPath(); x.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++)x.lineTo(pts[i][0],pts[i][1]); x.stroke();
  x.strokeStyle='rgba(60,50,32,.5)'; x.lineWidth=w2-10; x.stroke(); };
 path([[340,450],[700,446],[1000,452],[1400,450]],48);
 path([[950,450],[1030,300],[1080,140]],30);
 path([[950,452],[1030,610],[1080,760]],30);
 // chapel plaza
 x.fillStyle='#1a221c'; x.beginPath(); x.arc(295,450,95,0,TAU); x.fill();
 x.strokeStyle='rgba(86,96,88,.4)'; x.lineWidth=2; x.beginPath(); x.arc(295,450,95,0,TAU); x.stroke();
 x.strokeStyle='rgba(86,96,88,.2)'; x.beginPath(); x.arc(295,450,78,0,TAU); x.stroke();
 for(let i=0;i<14;i++){ const a=i/14*TAU; x.strokeStyle='rgba(70,80,72,.25)';
  x.beginPath(); x.moveTo(295+Math.cos(a)*78,450+Math.sin(a)*78); x.lineTo(295+Math.cos(a)*95,450+Math.sin(a)*95); x.stroke(); }
 // fence posts
 x.fillStyle='#241d12';
 for(let fx=640;fx<=1240;fx+=95){ x.fillRect(fx,412,5,12); x.fillRect(fx,478,5,12); }
 x.strokeStyle='rgba(52,42,26,.7)'; x.lineWidth=2;
 x.beginPath(); x.moveTo(640,417); x.lineTo(1245,417); x.moveTo(640,483); x.lineTo(1245,483); x.stroke();
 // graves
 for(let i=0;i<8;i++){ const gx=340+rand(0,190),gy=640+rand(0,130);
  x.save(); x.translate(gx,gy); x.rotate(rand(-.14,.14));
  x.fillStyle='#39433d'; rr(x,-7,-14,14,22,4); x.fill();
  x.strokeStyle='#222a25'; x.lineWidth=1.5; x.stroke();
  x.strokeStyle='rgba(20,26,22,.8)'; x.beginPath(); x.moveTo(0,-9); x.lineTo(0,-1); x.moveTo(-3.5,-6); x.lineTo(3.5,-6); x.stroke();
  x.restore(); }
 // dead trees
 const tree=(tx,ty,s)=>{ x.strokeStyle='#1b241e'; x.lineCap='round';
  const branch=(bx,by,a,len,w2,d)=>{ if(d<=0||len<5)return;
   const ex=bx+Math.cos(a)*len, ey=by+Math.sin(a)*len;
   x.lineWidth=w2; x.beginPath(); x.moveTo(bx,by); x.lineTo(ex,ey); x.stroke();
   branch(ex,ey,a+rand(.3,.7),len*.68,w2*.65,d-1); branch(ex,ey,a-rand(.3,.7),len*.68,w2*.65,d-1); };
  branch(tx,ty,-Math.PI/2+rand(-.2,.2),34*s,6*s,4); };
 tree(120,200,1.2); tree(200,820,1); tree(1480,120,1.1); tree(1520,830,1.3); tree(860,90,.8); tree(700,850,.9);
 // ruins NW
 x.fillStyle='#2b342e';
 [[130,110,90,16],[130,110,16,70],[210,150,16,50],[150,180,60,12]].forEach(([rx,ry,rw,rh])=>{
  x.fillRect(rx,ry,rw,rh); x.strokeStyle='#1a211c'; x.lineWidth=1.5; x.strokeRect(rx,ry,rw,rh); });
 x.fillStyle='rgba(46,70,50,.5)'; x.fillRect(130,110,90,5); x.fillRect(150,180,60,4);
 // rocks & tufts & speckle
 for(let i=0;i<14;i++){ const rx=rand(60,W-60),ry=rand(60,H-60);
  x.fillStyle=choice(['#242e28','#2a342e','#202a24']); x.beginPath();
  x.moveTo(rx,ry); x.lineTo(rx+rand(6,14),ry+rand(-4,2)); x.lineTo(rx+rand(8,16),ry+rand(5,10)); x.lineTo(rx-rand(2,6),ry+rand(5,9));
  x.closePath(); x.fill(); }
 x.strokeStyle='rgba(40,58,38,.55)'; x.lineWidth=1;
 for(let i=0;i<260;i++){ const gx=rand(W),gy=rand(H);
  x.beginPath(); x.moveTo(gx,gy); x.lineTo(gx+rand(-3,3),gy-rand(3,7));
  x.moveTo(gx+2,gy); x.lineTo(gx+rand(1,5),gy-rand(2,6)); x.stroke(); }
 for(let i=0;i<1500;i++){ x.fillStyle=`rgba(${randi(120,190)},${randi(150,200)},${randi(110,150)},${rand(.02,.08)})`;
  x.fillRect(rand(W),rand(H),1.4,1.4); }
 // torch poles
 TORCHES.forEach(([tx,ty])=>{ x.fillStyle='#241d12'; x.fillRect(tx-2.5,ty-4,5,20);
  x.fillStyle='#3a2f1c'; x.fillRect(tx-5,ty-7,10,6); });
 ground=c;
 // vignette
 const v=document.createElement('canvas'); v.width=W; v.height=H; const vx=v.getContext('2d');
 const vg=vx.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,H*.85);
 vg.addColorStop(0,'rgba(4,7,5,0)'); vg.addColorStop(1,'rgba(3,6,4,.62)');
 vx.fillStyle=vg; vx.fillRect(0,0,W,H);
 const tg=vx.createLinearGradient(0,0,0,120); tg.addColorStop(0,'rgba(3,6,4,.5)'); tg.addColorStop(1,'rgba(3,6,4,0)');
 vx.fillStyle=tg; vx.fillRect(0,0,W,120);
 vignette=v;
}
/* ================= RENDER ================= */
export function drawShadow(x,y,r){ ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y+r*.55,r*.95,r*.42,0,0,TAU); ctx.fill(); }
export function drawHpBar(u,w2,yOff,color){
 if(u.hp>=u.max&&u.shield<=0)return;
 const pct=clamp(u.hp/u.max,0,1), x=u.x-w2/2, y=u.y-u.r-yOff;
 ctx.fillStyle='rgba(5,9,6,.8)'; rr(ctx,x-1,y-1,w2+2,5,2); ctx.fill();
 ctx.fillStyle=color|| (pct>.5?PAL.heal:pct>.25?PAL.warn:PAL.danger);
 if(pct>0){ rr(ctx,x,y,w2*pct,3,1.5); ctx.fill(); }
 if(u.shield>0){ ctx.fillStyle=PAL.cyan; const sw=Math.min(w2,u.shield/80*w2);
  if(sw>0){ rr(ctx,x,y-3.5,sw,2,1); ctx.fill(); } }
}
export function drawHealer(h){
 const vt=G.vt, bob=Math.sin(vt*3+h.bob)*1.5, c=h.role.color;
 ctx.save(); ctx.translate(h.x,h.y);
 if(h.fallen){
  drawShadow(0,4,14);
  ctx.rotate(h.a+Math.PI/2);
  ctx.globalAlpha=.75;
  ctx.fillStyle=h.role.dark; ctx.beginPath(); ctx.ellipse(0,0,16,9,0,0,TAU); ctx.fill();
  ctx.strokeStyle=hexA(c,.5); ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#2a332c'; ctx.beginPath(); ctx.arc(-12,0,5.5,0,TAU); ctx.fill();
  ctx.globalAlpha=1; ctx.rotate(-(h.a+Math.PI/2));
  const pulse=.5+Math.sin(vt*4)*.3;
  drawGlow(ctx,0,-6,22,c,.35*pulse);
  if(h.revP>0){ ctx.strokeStyle=PAL.gold; ctx.lineWidth=3;
   ctx.beginPath(); ctx.arc(0,0,22,-Math.PI/2,-Math.PI/2+h.revP/3*TAU); ctx.stroke();
   ctx.strokeStyle=hexA(PAL.gold,.25); ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,22,0,TAU); ctx.stroke(); }
  ctx.restore(); return;
 }
 drawShadow(0,4,13);
 if(G.sel.includes(h)){
  ctx.strokeStyle=hexA(c,.9); ctx.lineWidth=1.6; ctx.setLineDash([5,4]); ctx.lineDashOffset=-vt*20;
  ctx.beginPath(); ctx.arc(0,2,19,0,TAU); ctx.stroke(); ctx.setLineDash([]);
 }
 ctx.translate(0,bob);
 // cloak
 ctx.fillStyle=h.role.dark;
 ctx.beginPath(); ctx.moveTo(0,-11); ctx.quadraticCurveTo(11,-6,9,9); ctx.quadraticCurveTo(0,13,-9,9); ctx.quadraticCurveTo(-11,-6,0,-11); ctx.fill();
 ctx.strokeStyle=hexA(c,.85); ctx.lineWidth=1.6; ctx.stroke();
 // trim cross
 ctx.strokeStyle=hexA(c,.9); ctx.lineWidth=1.4;
 ctx.beginPath(); ctx.moveTo(0,-2); ctx.lineTo(0,6); ctx.moveTo(-3,1.5); ctx.lineTo(3,1.5); ctx.stroke();
 // hood
 ctx.fillStyle='#141c16'; ctx.beginPath(); ctx.arc(0,-9,6.5,0,TAU); ctx.fill();
 ctx.strokeStyle=hexA(c,.6); ctx.lineWidth=1.2; ctx.stroke();
 ctx.fillStyle='#d9cfb4'; ctx.beginPath(); ctx.arc(Math.cos(h.a)*2,-9+Math.sin(h.a)*1.5,3,0,TAU); ctx.fill();
 // staff
 const sx=Math.cos(h.a)*13, sy=Math.sin(h.a)*13-4;
 ctx.strokeStyle='#4a3b22'; ctx.lineWidth=2.4;
 ctx.beginPath(); ctx.moveTo(sx*.3,sy*.3+4); ctx.lineTo(sx,sy-6); ctx.stroke();
 drawGlow(ctx,sx,sy-7,12,c,.8);
 ctx.fillStyle=c; ctx.beginPath(); ctx.arc(sx,sy-7,3,0,TAU); ctx.fill();
 if(h.flashT>0){ ctx.globalAlpha=h.flashT*3; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,-2,13,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
 if(h.shield>0)drawShieldBubble(0,0,19);
 ctx.restore();
 drawHpBar(h,26,12);
}
export function drawShieldBubble(x,y,r){
 const vt=G.vt;
 ctx.strokeStyle=hexA(PAL.cyan,.65); ctx.lineWidth=1.6;
 ctx.beginPath(); ctx.arc(x,y,r,vt*1.5,vt*1.5+TAU*.8); ctx.stroke();
 ctx.strokeStyle=hexA(PAL.violet,.5); ctx.lineWidth=1;
 ctx.beginPath(); ctx.arc(x,y,r-3,-vt*2,-vt*2+TAU*.6); ctx.stroke();
}
export function drawSoldier(s){
 const bob=Math.sin(G.vt*4+s.bob)*1, lunge=s.lungeT>0?5:0;
 ctx.save(); ctx.translate(s.x+Math.cos(s.a)*lunge,s.y+Math.sin(s.a)*lunge);
 drawShadow(0,4,13);
 ctx.translate(0,bob);
 ctx.fillStyle='#3d4650';
 ctx.beginPath(); ctx.moveTo(0,-10); ctx.quadraticCurveTo(10,-5,8,9); ctx.quadraticCurveTo(0,12,-8,9); ctx.quadraticCurveTo(-10,-5,0,-10); ctx.fill();
 ctx.strokeStyle='#6b7684'; ctx.lineWidth=1.4; ctx.stroke();
 // tabard
 ctx.fillStyle='#c9bfa4'; ctx.fillRect(-2.5,-4,5,10);
 ctx.strokeStyle='#8a2f2f'; ctx.lineWidth=1.2;
 ctx.beginPath(); ctx.moveTo(0,-2); ctx.lineTo(0,4); ctx.moveTo(-2,0); ctx.lineTo(2,0); ctx.stroke();
 // helmet
 ctx.fillStyle='#8a94a0'; ctx.beginPath(); ctx.arc(0,-8,5.5,0,TAU); ctx.fill();
 ctx.strokeStyle='#525c66'; ctx.lineWidth=1.2; ctx.stroke();
 ctx.strokeStyle='#2a3138'; ctx.beginPath(); ctx.moveTo(Math.cos(s.a)*2-2,-8+Math.sin(s.a)*2); ctx.lineTo(Math.cos(s.a)*2+2,-8+Math.sin(s.a)*2); ctx.stroke();
 // sword & shield
 const ca=Math.cos(s.a),sa=Math.sin(s.a);
 ctx.strokeStyle='#c8d2dc'; ctx.lineWidth=2.2;
 ctx.beginPath(); ctx.moveTo(ca*8-sa*6,sa*8+ca*6); ctx.lineTo(ca*17-sa*6,sa*17+ca*6); ctx.stroke();
 ctx.strokeStyle='#7d8894'; ctx.lineWidth=3.4;
 ctx.beginPath(); ctx.arc(ca*6+sa*7,sa*6-ca*7,5,s.a-1.2,s.a+1.2); ctx.stroke();
 if(s.flashT>0){ ctx.globalAlpha=s.flashT*3; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,-2,12,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
 if(s.shield>0)drawShieldBubble(0,0,18);
 ctx.restore();
 drawHpBar(s,26,12);
}
export function blobPath(r,wob,seed){
 ctx.beginPath();
 for(let i=0;i<=10;i++){ const a=i/10*TAU, rr2=r*(1+Math.sin(G.vt*3+seed+i*2.1)*wob);
  const px=Math.cos(a)*rr2, py=Math.sin(a)*rr2*.85;
  i===0?ctx.moveTo(px,py):ctx.lineTo(px,py); }
 ctx.closePath();
}
export function drawEnemy(e){
 const scale=e.spawnT>0?1-e.spawnT/.4:1, lunge=e.lungeT>0?4:0;
 ctx.save(); ctx.translate(e.x+Math.cos(e.a)*lunge,e.y+Math.sin(e.a)*lunge); ctx.scale(scale,scale);
 drawShadow(0,4,e.r);
 const vt=G.vt;
 if(e.type==='husk'){
  ctx.fillStyle='#4a3355'; blobPath(e.r,.1,e.bob); ctx.fill();
  ctx.strokeStyle='#7a4a8a'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.strokeStyle='#3a2745'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(-e.r*.7,2); ctx.lineTo(-e.r-5,6+Math.sin(vt*5+e.bob)*3);
  ctx.moveTo(e.r*.7,2); ctx.lineTo(e.r+5,6+Math.cos(vt*5+e.bob)*3); ctx.stroke();
  ctx.fillStyle=PAL.acid;
  ctx.beginPath(); ctx.arc(Math.cos(e.a)*4-3,Math.sin(e.a)*3-3,1.8,0,TAU); ctx.arc(Math.cos(e.a)*4+3,Math.sin(e.a)*3-3,1.8,0,TAU); ctx.fill();
 }else if(e.type==='stalker'){
  ctx.strokeStyle='#5e2a70'; ctx.lineWidth=2;
  for(let i=0;i<4;i++){ const a=e.a+Math.PI/2+(i-1.5)*.5, ext=Math.sin(vt*14+i*1.7+e.bob)*4;
   ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*(e.r+4+ext),Math.sin(a)*(e.r+4+ext));
   ctx.moveTo(0,0); ctx.lineTo(-Math.cos(a)*(e.r+4-ext),-Math.sin(a)*(e.r+4-ext)); ctx.stroke(); }
  ctx.fillStyle='#5e2a70'; ctx.beginPath(); ctx.ellipse(0,0,e.r,e.r*.65,e.a,0,TAU); ctx.fill();
  ctx.strokeStyle=PAL.blight; ctx.lineWidth=1.4; ctx.stroke();
  drawGlow(ctx,Math.cos(e.a)*5,Math.sin(e.a)*5,8,PAL.blight,.7);
  ctx.fillStyle=PAL.blight; ctx.beginPath(); ctx.arc(Math.cos(e.a)*5,Math.sin(e.a)*5,2.2,0,TAU); ctx.fill();
 }else if(e.type==='spitter'){
  ctx.fillStyle='#3e4a2a'; blobPath(e.r,.08,e.bob); ctx.fill();
  ctx.strokeStyle='#6a7a3a'; ctx.lineWidth=1.6; ctx.stroke();
  const mx=Math.cos(e.a)*6,my=Math.sin(e.a)*6;
  if(e.chargeT>0)drawGlow(ctx,mx,my,14+e.chargeT*20,PAL.acid,.8);
  ctx.fillStyle='#1c2410'; ctx.beginPath(); ctx.arc(mx,my,4.5+e.chargeT*4,0,TAU); ctx.fill();
  ctx.strokeStyle=PAL.acid; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle=hexA(PAL.acid,.7);
  ctx.beginPath(); ctx.arc(-4,-5,2,0,TAU); ctx.arc(3,-7,1.5,0,TAU); ctx.fill();
 }else if(e.type==='bloated'){
  const pulse=1+Math.sin(vt*2.5+e.bob)*.05;
  ctx.scale(pulse,pulse);
  ctx.fillStyle='#4e3a5e'; blobPath(e.r,.06,e.bob); ctx.fill();
  ctx.strokeStyle='#8a5a9a'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle=hexA(PAL.acid,.75);
  [[-7,-4,3],[5,-8,2.5],[8,4,3],[-3,7,2]].forEach(([bx,by,br])=>{ ctx.beginPath(); ctx.arc(bx,by,br,0,TAU); ctx.fill(); });
  drawGlow(ctx,0,0,e.r*1.1,PAL.acid,.15);
  ctx.fillStyle='#2a1c35'; ctx.beginPath(); ctx.arc(Math.cos(e.a)*6,Math.sin(e.a)*6,3.5,0,TAU); ctx.fill();
 }else if(e.type==='acolyte'){
  // hooded hex-caster: violet cloak, glowing eyes, staff
  ctx.fillStyle='#3a2a52'; blobPath(e.r,.07,e.bob); ctx.fill();
  ctx.strokeStyle='#7a5aa8'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.fillStyle='#241a38'; ctx.beginPath(); ctx.arc(0,-4,6,0,TAU); ctx.fill();
  drawGlow(ctx,Math.cos(e.a)*3,-4+Math.sin(e.a)*2,9,PAL.blight,.8);
  ctx.fillStyle=PAL.blight;
  ctx.beginPath(); ctx.arc(Math.cos(e.a)*3-2.5,-4+Math.sin(e.a)*2,1.6,0,TAU); ctx.arc(Math.cos(e.a)*3+2.5,-4+Math.sin(e.a)*2,1.6,0,TAU); ctx.fill();
  const sx2=Math.cos(e.a)*10, sy2=Math.sin(e.a)*10;
  ctx.strokeStyle='#4a3b22'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(sx2*.4,sy2*.4+4); ctx.lineTo(sx2,sy2-6); ctx.stroke();
  drawGlow(ctx,sx2,sy2-7,10,PAL.blight,.7);
  ctx.fillStyle=PAL.blight; ctx.beginPath(); ctx.arc(sx2,sy2-7,2.4,0,TAU); ctx.fill();
 }else if(e.type==='boss'){
  drawGlow(ctx,0,0,90,PAL.blight,.3);
  ctx.fillStyle='#3a2048'; blobPath(e.r,.08,e.bob); ctx.fill();
  ctx.strokeStyle=PAL.blight; ctx.lineWidth=2.5; ctx.stroke();
  // horns
  ctx.fillStyle='#241430';
  for(let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*.45;
   ctx.beginPath(); ctx.moveTo(Math.cos(a)*e.r*.8,Math.sin(a)*e.r*.8);
   ctx.lineTo(Math.cos(a)*(e.r+14),Math.sin(a)*(e.r+14)-6);
   ctx.lineTo(Math.cos(a+.2)*e.r*.8,Math.sin(a+.2)*e.r*.8); ctx.closePath(); ctx.fill(); }
  // tendrils
  ctx.strokeStyle=hexA(PAL.blight,.6); ctx.lineWidth=2.5;
  for(let i=0;i<6;i++){ const a=i/6*TAU+vt*.4;
   ctx.beginPath(); ctx.moveTo(Math.cos(a)*e.r*.7,Math.sin(a)*e.r*.7);
   ctx.quadraticCurveTo(Math.cos(a)*(e.r+12),Math.sin(a)*(e.r+12)+Math.sin(vt*3+i)*6,
    Math.cos(a)*(e.r+22),Math.sin(a)*(e.r+22)); ctx.stroke(); }
  // eyes
  [[-10,-6],[0,-10],[10,-6]].forEach(([ex,ey],i)=>{
   drawGlow(ctx,ex,ey,9,PAL.acid,.8);
   ctx.fillStyle=PAL.acid; ctx.beginPath(); ctx.arc(ex,ey,3+Math.sin(vt*4+i)*.7,0,TAU); ctx.fill();
   ctx.fillStyle='#1c2410'; ctx.beginPath(); ctx.arc(ex+Math.cos(e.a)*1.4,ey+Math.sin(e.a)*1.4,1.3,0,TAU); ctx.fill(); });
  ctx.fillStyle='#1c0f26'; ctx.beginPath(); ctx.arc(Math.cos(e.a)*10,Math.sin(e.a)*10+6,6,0,TAU); ctx.fill();
  ctx.strokeStyle=PAL.acid; ctx.lineWidth=1.4; ctx.stroke();
 }
 if(e.flashT>0){ ctx.globalAlpha=e.flashT*3.5; ctx.fillStyle='#fff'; blobPath(e.r,.05,e.bob); ctx.fill(); ctx.globalAlpha=1; }
 ctx.restore();
 if(e.type==='boss'){
  ctx.font='800 11px Cinzel,serif'; ctx.textAlign='center'; ctx.fillStyle=hexA(PAL.blight,.95);
  ctx.fillText('THE BLIGHTFATHER',e.x,e.y-e.r-24);
  drawHpBar(e,64,16,PAL.blight);
  ctx.strokeStyle=hexA(PAL.blight,.12); ctx.lineWidth=1; ctx.setLineDash([4,6]);
  ctx.beginPath(); ctx.arc(e.x,e.y,150,0,TAU); ctx.stroke(); ctx.setLineDash([]);
 }else drawHpBar(e,26,10,PAL.blight);
}
export function drawChapel(){
 const c=G.chapel, flick=.85+Math.sin(G.vt*7)*.08+Math.sin(G.vt*13.7)*.05;
 drawGlow(ctx,c.x,c.y,190,PAL.gold,.4*flick);
 drawGlow(ctx,c.x,c.y,90,'#ffdf9a',.3*flick);
 ctx.save(); ctx.translate(c.x,c.y);
 drawShadow(0,10,52);
 // nave
 ctx.fillStyle='#39423c'; rr(ctx,-46,-34,92,68,7); ctx.fill();
 ctx.strokeStyle='#566058'; ctx.lineWidth=2; ctx.stroke();
 // roof
 ctx.fillStyle='#2b332e'; rr(ctx,-40,-28,80,56,5); ctx.fill();
 ctx.strokeStyle='#454f48'; ctx.lineWidth=1.5; ctx.stroke();
 ctx.beginPath(); ctx.moveTo(-40,0); ctx.lineTo(40,0); ctx.stroke();
 // apse (west)
 ctx.fillStyle='#39423c'; ctx.beginPath(); ctx.arc(-46,0,22,Math.PI/2,Math.PI*1.5); ctx.fill();
 ctx.strokeStyle='#566058'; ctx.stroke();
 ctx.fillStyle='#2b332e'; ctx.beginPath(); ctx.arc(-46,0,16,Math.PI/2,Math.PI*1.5); ctx.fill();
 // cross
 ctx.strokeStyle=PAL.gold; ctx.lineWidth=3; ctx.lineCap='round';
 ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(0,4); ctx.moveTo(-7,-9); ctx.lineTo(7,-9); ctx.stroke();
 drawGlow(ctx,0,-8,16,PAL.gold,.6*flick);
 // windows
 ctx.fillStyle=hexA('#ffcf7a',.9*flick);
 [[-24,-16],[24,-16],[-24,14],[24,14]].forEach(([wx,wy])=>{ rr(ctx,wx-3,wy-5,6,10,2.5); ctx.fill(); });
 // door east + light spill
 ctx.fillStyle='#1a211c'; rr(ctx,40,-9,8,18,3); ctx.fill();
 ctx.fillStyle=hexA('#ffcf7a',.16*flick);
 ctx.beginPath(); ctx.moveTo(48,-8); ctx.lineTo(95,-20); ctx.lineTo(95,20); ctx.lineTo(48,8); ctx.closePath(); ctx.fill();
 if(c.flashT>0){ ctx.globalAlpha=c.flashT*2.5; ctx.fillStyle='#fff'; rr(ctx,-46,-34,92,68,7); ctx.fill(); ctx.globalAlpha=1; }
 ctx.restore();
 // hp ring
 if(c.hp<c.max){ const pct=c.hp/c.max;
  ctx.strokeStyle='rgba(5,9,6,.7)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(c.x,c.y,62,0,TAU); ctx.stroke();
  ctx.strokeStyle=pct>.5?PAL.heal:pct>.25?PAL.warn:PAL.danger; ctx.lineWidth=4;
  ctx.beginPath(); ctx.arc(c.x,c.y,62,-Math.PI/2,-Math.PI/2+pct*TAU); ctx.stroke(); }
 ctx.font='800 9px Cinzel,serif'; ctx.textAlign='center'; ctx.fillStyle=hexA(PAL.bone,.4);
 ctx.fillText('THE LAST CHAPEL',c.x,c.y-72);
}
export function drawRift(r){
 ctx.save(); ctx.translate(r.x,r.y);
 if(r.sealed){
  ctx.fillStyle='rgba(30,34,30,.8)'; ctx.beginPath(); ctx.ellipse(0,0,26,18,0,0,TAU); ctx.fill();
  ctx.strokeStyle='rgba(95,214,255,.3)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font='800 9px Cinzel,serif'; ctx.textAlign='center'; ctx.fillStyle=hexA(PAL.cyan,.5);
  ctx.fillText('SEALED',0,-26);
  ctx.restore(); return;
 }
 const pulse=.8+Math.sin(G.vt*2.2+r.idx*2)*.2;
 drawGlow(ctx,0,0,75*pulse,PAL.blight,.55);
 if(r.spawnFlash>0)drawGlow(ctx,0,0,110,PAL.blight,r.spawnFlash);
 ctx.fillStyle='#1c0f26'; ctx.beginPath(); ctx.ellipse(0,0,24,17,0,0,TAU); ctx.fill();
 for(let i=0;i<3;i++){
  ctx.strokeStyle=hexA(i===1?'#e08aff':PAL.blight,.8-i*.2); ctx.lineWidth=2.5-i*.6;
  const rot=G.vt*(1.2+i*.5)*(i%2?-1:1)+r.idx;
  ctx.beginPath(); ctx.ellipse(0,0,20-i*5,14-i*3.5,rot,0,TAU*.75); ctx.stroke();
 }
 ctx.strokeStyle=hexA(PAL.blight,.5); ctx.lineWidth=1.8;
 for(let i=0;i<5;i++){ const a=i/5*TAU+G.vt*.3;
  ctx.beginPath(); ctx.moveTo(Math.cos(a)*22,Math.sin(a)*16);
  ctx.quadraticCurveTo(Math.cos(a)*38,Math.sin(a)*30+Math.sin(G.vt*2+i)*5,Math.cos(a)*48,Math.sin(a)*36); ctx.stroke(); }
 drawGlow(ctx,0,0,14,'#e08aff',.9*pulse);
 if(r.flashT>0){ ctx.globalAlpha=r.flashT*4; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(0,0,24,17,0,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
 ctx.restore();
 if(r.hp<r.max){ const pct=r.hp/r.max;
  ctx.fillStyle='rgba(5,9,6,.8)'; rr(ctx,r.x-21,r.y-34,42,5,2); ctx.fill();
  ctx.fillStyle=PAL.cyan; if(pct>0){ rr(ctx,r.x-20,r.y-33,40*pct,3,1.5); ctx.fill(); } }
}
export function render(){
 const dpr=V.dpr;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.clearRect(0,0,V.w,V.h);
 const shx=G.shake>0?rand(-G.shake,G.shake):0, shy=G.shake>0?rand(-G.shake,G.shake):0;
 ctx.translate(V.ox+shx*V.s,V.oy+shy*V.s); ctx.scale(V.s,V.s);
 ctx.drawImage(ground,0,0);
 // world frame
 ctx.strokeStyle='rgba(233,223,198,.1)'; ctx.lineWidth=2; ctx.strokeRect(3,3,W-6,H-6);
 ctx.strokeStyle='rgba(95,227,161,.06)'; ctx.lineWidth=6; ctx.strokeRect(6,6,W-12,H-12);
 // pools
 G.pools.forEach(p=>{ const a=Math.min(1,p.t/2);
  ctx.fillStyle=hexA('#2a1038',.55*a); ctx.beginPath(); ctx.ellipse(p.x,p.y,p.r,p.r*.75,0,0,TAU); ctx.fill();
  ctx.strokeStyle=hexA(PAL.blight,.4*a); ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.lineDashOffset=-G.vt*12;
  ctx.beginPath(); ctx.ellipse(p.x,p.y,p.r,p.r*.75,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  drawGlow(ctx,p.x,p.y,p.r*.8,PAL.blight,.12*a); });
 // fields
 G.fields.forEach(f=>{ const a=f.t>f.dur-1?(f.dur-f.t):1;
  drawGlow(ctx,f.x,f.y,f.r*1.15,PAL.cyan,.22*a);
  ctx.fillStyle=hexA(PAL.cyan,.06*a); ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,TAU); ctx.fill();
  ctx.strokeStyle=hexA(PAL.cyan,.7*a); ctx.lineWidth=2; ctx.setLineDash([10,7]); ctx.lineDashOffset=-G.vt*30;
  ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle=hexA(PAL.cyan,.35*a); ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(f.x,f.y,f.r*.6,G.vt,G.vt+TAU*.8); ctx.stroke();
  ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(G.vt*.8);
  ctx.strokeStyle=hexA(PAL.cyan,.5*a); ctx.lineWidth=1.4;
  for(let i=0;i<4;i++){ ctx.rotate(TAU/4); ctx.beginPath(); ctx.moveTo(f.r*.75,0); ctx.lineTo(f.r*.9,0); ctx.stroke(); }
  ctx.restore(); });
 // selection ranges
 G.sel.forEach(h=>{ if(h.fallen)return;
  ctx.fillStyle=hexA(h.role.color,.03); ctx.beginPath(); ctx.arc(h.x,h.y,h.role.range,0,TAU); ctx.fill();
  ctx.strokeStyle=hexA(h.role.color,.16); ctx.lineWidth=1.2; ctx.setLineDash([4,7]);
  ctx.beginPath(); ctx.arc(h.x,h.y,h.role.range,0,TAU); ctx.stroke(); ctx.setLineDash([]); });
 // torch glows
 TORCHES.forEach(([tx,ty])=>{ const fl=.8+Math.sin(G.vt*9+tx)*.15;
  drawGlow(ctx,tx,ty-8,55,PAL.gold,.4*fl); drawGlow(ctx,tx,ty-8,14,'#ffe9b8',.9*fl);
  ctx.fillStyle='#ffdf9a'; ctx.beginPath(); ctx.arc(tx,ty-8,3+Math.sin(G.vt*11+tx)*.8,0,TAU); ctx.fill(); });
 // y-sorted entities
 const ents=[{y:G.chapel.y+30,d:drawChapel},...G.rifts.map(r=>({y:r.y+10,d:()=>drawRift(r)})),
  ...G.soldiers.map(s=>({y:s.y,d:()=>drawSoldier(s)})),
  ...G.healers.map(h=>({y:h.y,d:()=>drawHealer(h)})),
  ...G.enemies.map(e=>({y:e.y,d:()=>drawEnemy(e)}))];
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
 // beams
 G.healers.forEach(h=>{
  if(h.fallen)return;
  const sx=h.x+Math.cos(h.a)*13, sy=h.y+Math.sin(h.a)*13-11;
  if(h.beam){ const t=h.beam, mx=(sx+t.x)/2+Math.sin(G.vt*6)*6, my=(sy+t.y)/2-10;
   ctx.strokeStyle=hexA(PAL.heal,.28); ctx.lineWidth=6;
   ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(mx,my,t.x,t.y-4); ctx.stroke();
   ctx.strokeStyle=hexA(PAL.heal,.9); ctx.lineWidth=2.2;
   ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(mx,my,t.x,t.y-4); ctx.stroke();
   drawGlow(ctx,t.x,t.y-4,20,PAL.heal,.5); }
  if(h.sear){ const t=h.sear;
   ctx.strokeStyle=hexA(PAL.cyan,.35); ctx.lineWidth=5;
   ctx.beginPath(); ctx.moveTo(sx,sy);
   for(let i=1;i<=4;i++){ const p=i/4; ctx.lineTo(lerp(sx,t.x,p)+rand(-4,4),lerp(sy,t.y,p)+rand(-4,4)); }
   ctx.stroke();
   ctx.strokeStyle='rgba(230,250,255,.9)'; ctx.lineWidth=1.6;
   ctx.beginPath(); ctx.moveTo(sx,sy);
   for(let i=1;i<=4;i++){ const p=i/4; ctx.lineTo(lerp(sx,t.x,p)+rand(-3,3),lerp(sy,t.y,p)+rand(-3,3)); }
   ctx.stroke();
   drawGlow(ctx,t.x,t.y,18,PAL.cyan,.55); }
  if(h.cleanse){ const t=h.cleanse;
   ctx.strokeStyle=hexA(PAL.cyan,.5); ctx.lineWidth=2; ctx.setLineDash([5,5]); ctx.lineDashOffset=-G.vt*24;
   ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(t.x,t.y); ctx.stroke(); ctx.setLineDash([]);
   drawGlow(ctx,t.x,t.y,24,PAL.cyan,.3); }
 });
 // pulses
 G.pulses.forEach(p=>{ ctx.strokeStyle=hexA(p.color,(1-p.t)*.8); ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,TAU); ctx.stroke(); });
 // projectiles
 G.projectiles.forEach(p=>{ const arc=Math.sin(Math.min(1,p.t)*Math.PI)*14;
  drawGlow(ctx,p.x,p.y-arc,12,PAL.acid,.8);
  ctx.fillStyle=PAL.acid; ctx.beginPath(); ctx.arc(p.x,p.y-arc,3.5,0,TAU); ctx.fill(); });
 // markers
 G.markers.forEach(m=>{ const a=1-m.t/.8;
  if(m.type==='move'){ ctx.strokeStyle=hexA(PAL.heal,a*.9); ctx.lineWidth=2;
   ctx.beginPath(); ctx.arc(m.x,m.y,10+m.t*22,0,TAU); ctx.stroke();
   ctx.beginPath(); ctx.arc(m.x,m.y,4,0,TAU); ctx.stroke(); }
  else{ ctx.strokeStyle=hexA(PAL.gold,a*.95); ctx.lineWidth=2.5;
   const s=8+m.t*6; ctx.beginPath(); ctx.moveTo(m.x-s,m.y); ctx.lineTo(m.x+s,m.y);
   ctx.moveTo(m.x,m.y-s); ctx.lineTo(m.x,m.y+s); ctx.stroke(); } });
 // particles
 G.particles.forEach(p=>{ const a=1-p.t/p.life;
  if(p.glow){ drawGlow(ctx,p.x,p.y,p.size*(p.wisp?4:3),p.color,a*.8);
   ctx.fillStyle=hexA(p.color,a); ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(p.wisp?.6:1),0,TAU); ctx.fill(); }
  else{ ctx.fillStyle=hexA(p.color,a*(p.spore?.3:.85)); ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,TAU); ctx.fill(); } });
 // floaters
 ctx.textAlign='center'; ctx.font='700 13px "Alegreya Sans",sans-serif';
 G.floaters.forEach(f=>{ const a=1-f.t/f.life;
  ctx.lineWidth=3; ctx.strokeStyle=`rgba(5,9,6,${a*.8})`; ctx.strokeText(f.txt,f.x,f.y);
  ctx.fillStyle=hexA(f.color,a); ctx.fillText(f.txt,f.x,f.y); });
 // drifting fog
 for(let i=0;i<3;i++){
  const fx=(W*.3+i*W*.3+Math.sin(G.vt*.05+i*2.2)*180+W)%W;
  const fy=H*.25+i*H*.28+Math.cos(G.vt*.04+i*1.7)*90;
  drawGlow(ctx,fx,fy,260,'#3a4a3e',.05); }
 ctx.drawImage(vignette,0,0);
 // drag box (screen-space → world)
 if(drag.active&&drag.moved){
  const x=Math.min(drag.sx,drag.cx),y=Math.min(drag.sy,drag.cy),w2=Math.abs(drag.cx-drag.sx),h2=Math.abs(drag.cy-drag.sy);
  ctx.fillStyle='rgba(233,223,198,.07)'; ctx.fillRect(x,y,w2,h2);
  ctx.strokeStyle='rgba(233,223,198,.7)'; ctx.lineWidth=1.2; ctx.setLineDash([5,4]); ctx.strokeRect(x,y,w2,h2); ctx.setLineDash([]);
 }
}
