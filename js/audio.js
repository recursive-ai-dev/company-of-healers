// WebAudio synth SFX + ambience. No game-state access.
/* ================= AUDIO ================= */
export const AudioSys={
 ctx:null,master:null,started:false,muted:false,last:{},noiseBuf:null,
 init(){
  if(this.started)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
   this.ctx=new AC(); this.master=this.ctx.createGain();
   this.master.gain.value=this.muted?0:.5; this.master.connect(this.ctx.destination);
   const len=this.ctx.sampleRate*2; this.noiseBuf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
   const d=this.noiseBuf.getChannelData(0); for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
   this.ambience(); this.started=true;
  }catch(e){}
 },
 resume(){ if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume(); },
 setMuted(m){ this.muted=m; if(this.master)this.master.gain.linearRampToValueAtTime(m?0:.5,(this.ctx?this.ctx.currentTime:0)+.08); },
 ambience(){
  const c=this.ctx;
  const g=c.createGain(); g.gain.value=.05; g.connect(this.master);
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=210; lp.connect(g);
  [55,55.6,110.4].forEach((f,i)=>{const o=c.createOscillator();o.type=i<2?'sawtooth':'sine';o.frequency.value=f;
   const og=c.createGain();og.gain.value=i<2?.5:.22;o.connect(og);og.connect(lp);o.start();});
  const n=c.createBufferSource(); n.buffer=this.noiseBuf; n.loop=true;
  const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=480; bp.Q.value=.6;
  const ng=c.createGain(); ng.gain.value=.028;
  const lfo=c.createOscillator(); lfo.frequency.value=.07; const lg=c.createGain(); lg.gain.value=.018;
  lfo.connect(lg); lg.connect(ng.gain); lfo.start();
  n.connect(bp); bp.connect(ng); ng.connect(this.master); n.start();
 },
 tone(f,d,type='sine',g=.15,slide=0,delay=0){
  if(!this.started)return; const c=this.ctx,t=c.currentTime+delay;
  const o=c.createOscillator(),gn=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);
  gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+.012);
  gn.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(gn); gn.connect(this.master); o.start(t); o.stop(t+d+.05);
 },
 noise(d,fc,g=.15,type='lowpass',delay=0){
  if(!this.started)return; const c=this.ctx,t=c.currentTime+delay;
  const s=c.createBufferSource(); s.buffer=this.noiseBuf; s.loop=true;
  const f=c.createBiquadFilter(); f.type=type; f.frequency.value=fc;
  const gn=c.createGain(); gn.gain.setValueAtTime(0,t); gn.gain.linearRampToValueAtTime(g,t+.015);
  gn.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(f); f.connect(gn); gn.connect(this.master); s.start(t); s.stop(t+d+.05);
 },
 ok(name,min){ const n=performance.now(); if(this.last[name]&&n-this.last[name]<min*1000)return false; this.last[name]=n; return true; },
 sfx(name){
  if(!this.started||this.muted)return;
  switch(name){
   case 'select': if(this.ok(name,.08))this.tone(660,.06,'sine',.05); break;
   case 'move': if(this.ok(name,.1))this.tone(440,.07,'sine',.045); break;
   case 'heal': if(this.ok(name,.35)){this.tone(880,.14,'sine',.04);this.tone(1320,.1,'sine',.02,.0,.03);} break;
   case 'pulse': if(this.ok(name,.5))this.tone(784,.2,'sine',.03); break;
   case 'hymn': [523,659,784].forEach((f,i)=>this.tone(f,.55,'sine',.06,0,i*.05)); this.noise(.4,3000,.02,'highpass'); break;
   case 'consecrate': this.noise(.45,2400,.06,'highpass'); this.tone(1568,.35,'sine',.05); this.tone(1046,.4,'sine',.04,0,.06); break;
   case 'aegis': this.tone(392,.3,'triangle',.09); this.tone(587,.25,'triangle',.06,0,.05); break;
   case 'mend': this.tone(1046,.18,'sine',.07); this.tone(1568,.22,'sine',.05,0,.05); break;
   case 'sear': if(this.ok(name,.5))this.tone(1200,.05,'sawtooth',.015); break;
   case 'hit': if(this.ok(name,.14))this.noise(.08,320,.07); break;
   case 'swing': if(this.ok(name,.18))this.noise(.06,1400,.03,'highpass'); break;
   case 'enemyDie': if(this.ok(name,.1)){this.noise(.18,260,.08);this.tone(180,.22,'sawtooth',.045,-120);} break;
   case 'soldierDie': if(this.ok(name,.3)){this.tone(220,.6,'sine',.1,-110);this.noise(.25,500,.06);} break;
   case 'healerFall': this.tone(440,.8,'sine',.12,-220); this.tone(349,.9,'sine',.08,-175,.1); this.noise(.5,300,.08); break;
   case 'chapelHit': if(this.ok(name,.8)){this.noise(.3,130,.24);this.tone(60,.4,'sine',.2,-20);} break;
   case 'horn': this.tone(98,1.4,'sawtooth',.09); this.tone(147,1.2,'sawtooth',.05,0,.1); this.noise(1.1,600,.03); break;
   case 'boon': [659,830,988].forEach((f,i)=>this.tone(f,.5,'sine',.06,0,i*.07)); break;
   case 'revive': [523,659,784,1046].forEach((f,i)=>this.tone(f,.4,'sine',.06,0,i*.09)); break;
   case 'victory': [392,523,659,784,1046].forEach((f,i)=>this.tone(f,.9,'sine',.08,0,i*.14)); this.noise(1.4,4000,.02,'highpass',.3); break;
   case 'defeat': this.tone(110,2.2,'sawtooth',.12,-55); this.tone(165,2,'sine',.08,-82,.15); this.noise(1.6,200,.1); break;
   case 'error': if(this.ok(name,.2))this.tone(160,.12,'square',.05); break;
   case 'pop': this.noise(.25,420,.14); this.tone(90,.3,'sine',.14,-40); break;
   case 'roar': this.noise(.9,220,.26); this.tone(70,1.1,'sawtooth',.18,-28); this.tone(52,1.3,'sine',.2,-15,.1); break;
   case 'spawn': if(this.ok(name,.25))this.noise(.12,650,.03); break;
   case 'bell': this.tone(523,2.4,'sine',.05); this.tone(1046,1.5,'sine',.018,.02); break;
   case 'riftSeal': [784,988,1175].forEach((f,i)=>this.tone(f,.6,'sine',.06,0,i*.08)); break;
  }
 }
};
