import {TRACK,FIELD_SIZE,clamp,curveAt,bankAt,racePace,linePace,trackGap,racePosition,createField,stepRivals,drafting,collision,stepCharge,freshContact,advanceContact,registerContact,racingLineAt,cornerPull,trackSection,freshLap,updateLap} from './engine.js?v=1.3.0';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=0,H=0,dpr=1,mode='menu',time=0,last=0,world=TRACK*.2,x=0,vx=0,speed=0,charge=0,boost=0,elapsed=0,score=0,passes=0,boosts=0,position=12,bestPlace=12,leadTime=0,bumps=0,spins=0,shake=0,toastTime=0,best=0,carId=0;
let contact=freshContact(),laps=freshLap(),savedLap=null,showLine=true;
try{const v=Number(localStorage.getItem('redline-best-lap'));if(Number.isFinite(v)&&v>0)savedLap=v;showLine=localStorage.getItem('redline-line')!=='off';}catch{}
let cars=[],pointers=new Map(),keys=new Set(),soundOn=false,audio,osc,gain;
try{best=Number(localStorage.getItem('redline-best'))||0}catch{}$('best').textContent=best.toLocaleString();
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
function tone(f,d=.15,type='sine',vol=.06){if(!soundOn||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,f*.4),audio.currentTime+d);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
function initAudio(){if(audio){audio.resume();return}try{audio=new AudioContext();osc=audio.createOscillator();gain=audio.createGain();osc.type='sawtooth';gain.gain.value=0;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;osc.connect(filter).connect(gain).connect(audio.destination);osc.start()}catch{soundOn=false}}
$('sound').onclick=()=>{soundOn=!soundOn;if(soundOn)initAudio();$('sound').textContent=soundOn?'♫':'♪';$('sound').setAttribute('aria-label',soundOn?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(soundOn));};
function toast(text){$('toast').textContent=text;toastTime=1.5}
function formatLap(value){return value===null?'—':value.toFixed(2)+'s';}
function setLineButton(){ $('line').setAttribute('aria-pressed',String(showLine));$('line').setAttribute('aria-label',showLine?'Hide racing line':'Show racing line');}
$('line').onclick=()=>{showLine=!showLine;setLineButton();try{localStorage.setItem('redline-line',showLine?'on':'off')}catch{}};setLineButton();
function reset(){
  world=0;x=0;vx=0;speed=6000;charge=0;boost=0;elapsed=0;score=0;passes=0;boosts=0;
  position=FIELD_SIZE;bestPlace=FIELD_SIZE;leadTime=0;cars=createField();contact=freshContact();laps=freshLap(savedLap);bumps=0;spins=0;
  for(const c of cars){c.color=colors[c.id%colors.length];c.z=1100+c.progress;}
  mode='playing';pointers.clear();keys.clear();
  for(const id of ['menu','paused','results','footer'])$(id).hidden=true;
  $('hud').hidden=false;document.body.classList.add('playing');if(soundOn)initAudio();
  updateRaceHud();toast('P12 — CATCH THE DRAFT');
}
$('start').onclick=reset;$('retry').onclick=reset;
function pause(){if(mode!=='playing')return;mode='paused';$('paused').hidden=false;pointers.clear();keys.clear()}
function resume(){if(mode!=='paused')return;mode='playing';$('paused').hidden=true;last=performance.now()}
$('pause').onclick=()=>mode==='paused'?resume():pause();$('resume').onclick=resume;$('quit').onclick=finish;
addEventListener('visibilitychange',()=>{if(document.hidden)pause()});addEventListener('blur',pause);
addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(['Escape','p','P'].includes(e.key)&&!e.repeat){mode==='paused'?resume():pause();return}keys.add(e.key.toLowerCase())});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('pointerdown',e=>{if(e.target.closest('button,a')||mode!=='playing')return;e.preventDefault();pointers.set(e.pointerId,e.clientX<W/2?-1:1);canvas.setPointerCapture?.(e.pointerId)});addEventListener('pointermove',e=>{if(pointers.has(e.pointerId))pointers.set(e.pointerId,e.clientX<W/2?-1:1)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])addEventListener(ev,e=>pointers.delete(e.pointerId));addEventListener('contextmenu',e=>e.preventDefault());
const colors=['#50b8c4','#eeb742','#8898da','#f1e6cc','#76aa74','#db7246'];
function touchCar(c,gap){
  const next=registerContact(contact,speed-c.speed);contact=next;
  if(next.event){
    boost=0;charge=0;shake=next.event==='spin'?.32:.12;
    if(next.event==='spin'){spins++;speed*=.5;toast('SPIN — EASY, YOU’LL RECOVER');tone(180,.6,'triangle',.09);}
    else{bumps++;speed*=.88;toast('BUMP — GIVE THEM ROOM');tone(95,.12,'triangle',.08);}
    if(Math.abs(x-c.x)>.025)x=clamp(x+Math.sign(x-c.x)*.025,-.81,.81);
  }
  // Solid bumpers still apply during the effect cooldown: never ghost through a car.
  if(gap>=0){world-=220-gap;speed=Math.min(speed,c.speed*.98);}
  else{c.progress-=220+gap;c.speed=Math.min(c.speed,speed*.98);}
  c.z=1100+trackGap(world,c.progress);
}
function finish(){mode='results';$('paused').hidden=true;document.body.classList.remove('playing','boosting');$('hud').hidden=true;$('results').hidden=false;const n=Math.floor(score);let record=n>best;if(record){best=n;try{localStorage.setItem('redline-best',String(best))}catch{}}$('resultlabel').textContent=record?'NEW PERSONAL BEST!':'THAT WAS A WILD RIDE';$('finalscore').textContent=n.toLocaleString();$('passes').textContent=passes;$('boosts').textContent=boosts;$('distance').textContent=(world/86400).toFixed(2)+' km';$('bestplace').textContent='P'+bestPlace;$('leadtime').textContent=leadTime.toFixed(1)+'s';$('spins').textContent=spins;$('lapresult').textContent='LAST '+formatLap(laps.last)+' · BEST '+formatLap(laps.best);}
function tick(dt){time+=dt;toastTime=Math.max(0,toastTime-dt);$('toast').style.opacity=toastTime>0?1:0;shake=Math.max(0,shake-dt*2);if(mode==='menu'){world+=dt*1300;return}if(mode!=='playing')return;
const beforeWorld=world;
elapsed+=dt;contact=advanceContact(contact,dt);
let steer=0;for(const d of pointers.values())steer+=d;
if(keys.has('arrowleft')||keys.has('a'))steer--;
if(keys.has('arrowright')||keys.has('d'))steer++;
steer=clamp(steer,-1,1);vx+=(steer*1.3*(contact.spin>0?.35:1)-vx)*Math.min(1,dt*9);
const outward=cornerPull(world,speed,racePace(elapsed));
x=clamp(x+(vx+outward)*dt,-.81,.81);
const onWall=Math.abs(x)>.80&&Math.sign(steer+outward)===Math.sign(x);
const recovery=contact.spin>0?.42:contact.wobble>0?.84:1;
const target=linePace(racePace(elapsed),x,world)*(onWall?.88:1)*recovery+(boost>0?3400:0);
speed+=(target-speed)*Math.min(1,dt*2);boost=Math.max(0,boost-dt);
stepRivals(cars,{x,progress:world,speed},dt,elapsed);
world+=speed*dt;score+=dt*speed/150;
let isDraft=false;
for(const c of cars){
  const gap=trackGap(world,c.progress);c.z=1100+gap;
  if(drafting(x,c.x,gap))isDraft=true;
  if(collision(x,c.x,gap))touchCar(c,gap);
  const ahead=c.progress>world;
  if(c.wasAhead&&!ahead){passes++;score+=100;tone(650,.12,'sine');}
  c.wasAhead=ahead;
}
const previous=position;position=racePosition(world,cars);bestPlace=Math.min(bestPlace,position);
if(position<previous){toast(position===1?'P1 — DEFEND YOUR LEAD!':'P'+position+' — POSITION GAINED');}
else if(position>previous)toast('P'+position+' — FIGHT BACK');
if(position===1){leadTime+=dt;score+=dt*30;}
charge=stepCharge(charge,isDraft&&contact.wobble<=0&&contact.spin<=0,dt,boost>0);
if(charge>=1){boost=2.8;boosts++;score+=150;charge=0;toast('SLINGSHOT — PULL OUT!');tone(380,.5,'triangle',.12);}
// Interpolate the crossing within this simulation step; collisions cannot double-count it.
const advance=world-beforeWorld;
const crossing=elapsed-(advance>0?dt*clamp((world%TRACK)/advance,0,1):0);
laps=updateLap(laps,world,crossing);
if(laps.crossed){
  toast('LAP '+(laps.completed+1)+' · '+formatLap(laps.last)+(laps.personalBest?' · PB!':''));toastTime=2.6;tone(820,.22,'sine',.07);
  if(laps.personalBest){savedLap=laps.best;try{localStorage.setItem('redline-best-lap',String(savedLap))}catch{}}
}
updateRaceHud(isDraft,onWall);drawMap();
}
function updateRaceHud(isDraft=false,onWall=false){
  $('contactfeedback').hidden=contact.heat<.05&&contact.spin<=0&&contact.wobble<=0;
  $('contactfeedback').textContent=contact.spin>0?'SPIN · RECOVERING':contact.wobble>0?'BUMP · SETTLING':'CONTACT HEAT '+Math.round(contact.heat*100)+'% · GIVE THEM ROOM';
  $('score').textContent=String(Math.floor(score)).padStart(5,'0');
  $('speed').textContent=Math.round(speed/24);$('lap').textContent=String(laps.completed+1).padStart(2,'0');$('laptimer').textContent=Math.max(0,elapsed-laps.started).toFixed(1)+'s';$('laphistory').textContent='LAST '+formatLap(laps.last)+' · PB '+formatLap(laps.best);
  $('position').textContent=position;$('fieldsize').textContent='/ '+FIELD_SIZE;
  const ahead=cars.filter(c=>c.progress>world).sort((a,b)=>a.progress-b.progress)[0];
  const behind=cars.filter(c=>c.progress<=world).sort((a,b)=>b.progress-a.progress)[0];
  const next=position===1?behind:ahead;
  $('racegap').textContent=next?(position===1?'CHASER ':'NEXT +')+(Math.abs(next.progress-world)/Math.max(1,speed)).toFixed(1)+'s':'CLEAR TRACK';
  const section=trackSection(world),line=racingLineAt(world+1800),error=x-line;
  $('racestatus').textContent=onWall?'WALL SCRUB — TURN IN':bankAt(world)>.04?section+' · '+(error>.22?'TURN IN':error<-.22?'OPEN YOUR LINE':'HOLD THE APEX'):section+' · '+(position===1?'CHASE A CLEAN LAP':'DRAFT & OVERTAKE');
  const nearby=cars.filter(c=>c.z<1400&&c.z> -1800).sort((a,b)=>Math.abs(a.z-1100)-Math.abs(b.z-1100))[0];
  $('radar').hidden=!nearby;
  if(nearby)$('radar').textContent=Math.abs(nearby.x-x)<.18?'RIVAL ON YOUR TAIL':Math.abs(nearby.z-1100)<650?(nearby.x<x?'CAR LEFT':'CAR RIGHT'):'RIVAL CLOSING · '+(nearby.x<x?'LEFT':'RIGHT');
  $('charge').style.width=(boost>0?boost/2.8*100:charge*100)+'%';
  $('draftpercent').textContent=boost>0?'BOOST!':Math.round(charge*100)+'%';
  $('draftlabel').textContent=boost>0?'PULL OUT & OVERTAKE':isDraft?'IN THE SLIPSTREAM':'CATCH THE SLIPSTREAM';
  document.body.classList.toggle('boosting',boost>0);
}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill()}
function rr(a,b,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(a,b,w,h,r);ctx.fill()}
function road(z){let offset=0;for(let i=0;i<z;i+=600)offset+=curveAt(world+i)*Math.min(600,z-i)*(i/z);return offset*.66;}
const projectionCache=new Map();let cameraRoadOffset=0;
function project(z,lane=0){
  let center=projectionCache.get(z);
  if(!center){const scale=.9/Math.max(1,z);center={x:W/2+scale*(road(z)-cameraRoadOffset-x*1900)*W/2,y:H*.42+scale*900*H/2,w:scale*1900*W/2,s:scale,bank:bankAt(world+z-1100)};projectionCache.set(z,center);}
  return {...center,x:center.x+center.w*lane,y:center.y-center.w*center.bank*((lane-x)*.65+(lane*lane-x*x)*.12)};
}
function background(){const g=ctx.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'#577f9b');g.addColorStop(.55,'#ecaa8d');g.addColorStop(1,'#ffe4a2');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffe6ad';ctx.beginPath();ctx.arc(W*.76,H*.25,Math.min(W,H)*.085,0,Math.PI*2);ctx.fill();poly([[0,H*.41],[0,H*.34],[W*.08,H*.29],[W*.15,H*.35],[W*.29,H*.25],[W*.4,H*.36],[W*.52,H*.29],[W*.64,H*.36],[W*.8,H*.3],[W,H*.36],[W,H*.44]],'#9f8690');poly([[0,H*.45],[0,H*.39],[W*.17,H*.36],[W*.29,H*.42],[W*.44,H*.35],[W*.56,H*.4],[W*.77,H*.36],[W,H*.41],[W,H*.48]],'#647b7c');ctx.fillStyle='#8a9c72';ctx.fillRect(0,H*.43,W,H*.57);
// Distant grandstands, warm crowd bands and light towers.
for(let side=0;side<2;side++){let bx=side?W*.74:-W*.06,bw=W*.34;poly([[bx,H*.4],[bx+bw,H*.4],[bx+bw*.91,H*.32],[bx+bw*.1,H*.32]],'#525e6b');for(let r=0;r<5;r++){ctx.fillStyle=['#caaa91','#f1c98d','#a97f77'][r%3];ctx.fillRect(bx,H*(.335+r*.012),bw,H*.005);for(let n=0;n<30;n++){ctx.fillStyle=n%3?'#d4d2b5':'#e77d5f';ctx.fillRect(bx+n*bw/30,H*(.33+r*.012),2,2)}}ctx.fillStyle='#3c5363';ctx.fillRect(bx-5,H*.315,bw+10,5)}for(let n=0;n<4;n++){let a=W*(.08+n*.29);ctx.strokeStyle='#536372';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a,H*.4);ctx.lineTo(a,H*.21);ctx.stroke();rr(a-16,H*.21,32,5,1,'#fff1ca')}
}
function drawRoad(){
  const depths=[];for(let z=35000;z>350;z-=220)depths.push(z);depths.push(350);
  // Fill continuous ribbons once. Per-segment road fills expose horizontal seams.
  const ribbon=(left,right,color)=>{
    const points=depths.map(z=>{const p=project(z,left);return [p.x,p.y];});
    for(const z of [...depths].reverse()){const p=project(z,right);points.push([p.x,p.y]);}
    poly(points,color);
  };
  const strip=(far,near,left,right,color)=>{
    const a=project(far,left),b=project(far,right),c=project(near,right),d=project(near,left);
    poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],color);
  };
  ribbon(-1.045,-1,'#fff2d8');ribbon(1,1.045,'#fff2d8');
  ribbon(-1,1,'#505965');
  for(const lane of [-.96,.96])ribbon(lane-.006,lane+.006,'#ecd7a1');
  for(let i=0;i<depths.length-1;i++){
    const z=depths[i],near=depths[i+1],stripe=Math.floor((world+z)/1400)%2;
    if(stripe){strip(z,near,-1.045,-1,'#d86f58');strip(z,near,1,1.045,'#d86f58');}
    if(Math.floor((world+z)/650)%3!==0)for(const lane of [-.6,-.2,.2,.6])strip(z,near,lane-.004,lane+.004,'#d0c9b4');
    for(const side of [-1,1]){
      const a=project(z,side*1.17),b=project(near,side*1.17);
      poly([[a.x,a.y],[b.x,b.y],[b.x,b.y-b.w*.08],[a.x,a.y-a.w*.08]],stripe?'#d8d8c9':'#c6cbbf');
      if(Math.floor((world+z)/220)%4===0){ctx.strokeStyle='#8c9a99a0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x,b.y-b.w*.08);ctx.lineTo(b.x,b.y-b.w*.23);ctx.stroke();}
    }
  }
}
function drawCircuitDetails(){
  // A discreet ribbon of short markers follows entry, apex and exit, never across the road.
  if(showLine)for(let z=12500-world%1200;z>1500;z-=1200){
    const lane=racingLineAt(world+z-1100),a=project(z+120,lane-.018),b=project(z+120,lane+.018),c=project(z-120,lane+.018),d=project(z-120,lane-.018);
    poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],'#8fe6c57a');
  }
  // One unmistakable start/finish stripe per physical circuit.
  const finishDistance=trackGap(world,0)+1100;
  if(finishDistance>360&&finishDistance<35000){
    for(let row=0;row<2;row++)for(let col=0;col<16;col++){
      const near=finishDistance+row*150,far=near+150,left=-1+col/8,right=left+.125;
      const a=project(far,left),b=project(far,right),c=project(near,right),d=project(near,left);
      poly([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],(row+col)%2?'#21313c':'#fff0cf');
    }
    const l=project(finishDistance,-1.12),r=project(finishDistance,1.12),height=l.w*.36;
    ctx.strokeStyle='#c9d5d7';ctx.lineWidth=Math.max(1,l.w*.012);ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(l.x,l.y-height);ctx.lineTo(r.x,r.y-height);ctx.lineTo(r.x,r.y);ctx.stroke();
    poly([[l.x,l.y-height],[r.x,r.y-height],[r.x,r.y-height-l.w*.09],[l.x,l.y-height-l.w*.09]],'#203c4c');
    ctx.save();ctx.translate((l.x+r.x)/2,(l.y+r.y)/2-height-l.w*.03);ctx.rotate(Math.atan2(r.y-l.y,r.x-l.x));ctx.textAlign='center';ctx.fillStyle='#ffe2a0';ctx.font='italic 900 '+Math.max(7,l.w*.053)+'px Arial';ctx.fillText('SUNSET SPEEDWAY  /  START · FINISH',0,0);ctx.restore();
  }
  const markers=[{p:.06,label:'TURN 1',color:'#f0c578'},{p:.25,label:'TURN 2',color:'#f0c578'},{p:.56,label:'TURN 3',color:'#8fd5d0'},{p:.75,label:'TURN 4',color:'#8fd5d0'},{p:.50,label:'BACK STRAIGHT',color:'#8fd5d0'}];
  for(const marker of markers){
    const z=((marker.p*TRACK-world)%TRACK+TRACK)%TRACK+1100;if(z<800||z>30000)continue;
    const p=project(z,1.3),w=p.w*.42,h=p.w*.16;
    ctx.strokeStyle='#405568';ctx.lineWidth=Math.max(1,p.w*.015);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-h*2);ctx.stroke();
    rr(p.x-w/2,p.y-h*2,w,h,Math.max(1,w*.04),'#203747');ctx.fillStyle=marker.color;ctx.textAlign='center';ctx.font='900 '+Math.max(6,h*.36)+'px Arial';ctx.fillText(marker.label,p.x,p.y-h*1.36);
  }
}
function car(px,py,size,color,hero=false,turn=0,number=64,flames=false) {ctx.save();ctx.translate(px,py);ctx.rotate(turn);const w=size,h=size*.68;ctx.globalAlpha=.24;ctx.fillStyle='#111d28';ctx.beginPath();ctx.ellipse(0,3,w*.62,h*.22,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
rr(-w*.55,-h*.55,w*.15,h*.6,w*.035,'#172333');rr(w*.4,-h*.55,w*.15,h*.6,w*.035,'#172333');
const body=ctx.createLinearGradient(-w/2,0,w/2,0);body.addColorStop(0,hero?'#ad252d':color);body.addColorStop(.24,color);body.addColorStop(.6,color);body.addColorStop(1,hero?'#a71c30':'#334857');
ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-w*.48,0);ctx.quadraticCurveTo(-w*.58,-h*.55,-w*.39,-h*.74);ctx.lineTo(-w*.3,-h*1.1);ctx.quadraticCurveTo(0,-h*1.21,w*.3,-h*1.1);ctx.lineTo(w*.39,-h*.74);ctx.quadraticCurveTo(w*.58,-h*.55,w*.48,0);ctx.closePath();ctx.fill();
poly([[-w*.29,-h*1.04],[w*.29,-h*1.04],[w*.35,-h*.7],[-w*.35,-h*.7]],'#203849');poly([[-w*.23,-h*.99],[w*.23,-h*.99],[w*.27,-h*.76],[-w*.27,-h*.76]],'#5a899a');poly([[-w*.18,-h*.98],[-w*.08,-h*.98],[-w*.2,-h*.76],[-w*.3,-h*.76]],'#9cd0d345');
rr(-w*.43,-h*.64,w*.86,h*.37,w*.05,color);ctx.fillStyle='#ffffff30';ctx.fillRect(-w*.39,-h*.62,w*.78,h*.025);rr(-w*.46,-h*.29,w*.92,h*.2,w*.025,hero?'#b92b32':'#324351');rr(-w*.43,-h*.27,w*.21,h*.07,w*.015,'#ff694c');rr(w*.22,-h*.27,w*.21,h*.07,w*.015,'#ff694c');rr(-w*.18,-h*.22,w*.36,h*.08,w*.015,'#1a2b38');rr(-w*.51,-h*.58,w*1.02,h*.07,w*.02,'#1b2a38');ctx.fillStyle='#ffdd83';ctx.font=`italic 900 ${w*.18}px Arial`;ctx.textAlign='center';ctx.fillText(hero?'27':String(number).padStart(2,'0'),0,-h*.34);if(hero){poly([[-w*.33,-h*.42],[-w*.17,-h*.51],[-w*.22,-h*.41],[-w*.1,-h*.42],[-w*.3,-h*.3],[-w*.26,-h*.4]],'#ffdc65');}if((hero&&boost>0)||flames){for(let i of [-1,1]){poly([[i*w*.32,-h*.07],[i*w*.22,-h*.07],[i*w*.27,h*(.3+Math.random()*.25)]],'#8cecf4');poly([[i*w*.3,-h*.07],[i*w*.24,-h*.07],[i*w*.27,h*.28]],'#fff4c3')}}ctx.restore()}
function drawMap(){
  const c=$('map').getContext('2d');c.clearRect(0,0,160,100);
  c.strokeStyle='#ffffff60';c.lineWidth=9;c.beginPath();c.ellipse(80,50,60,30,0,0,Math.PI*2);c.stroke();
  for(const rival of [...cars,{progress:world,id:-1}]){
    const angle=rival.progress/TRACK*Math.PI*2-Math.PI/2;
    c.fillStyle=rival.id===-1?'#ffce69':'#e0edf2';c.beginPath();c.arc(80+60*Math.cos(angle),50+30*Math.sin(angle),rival.id===-1?5:2.5,0,Math.PI*2);c.fill();
  }
}
function render(){projectionCache.clear();cameraRoadOffset=road(1100);ctx.save();if(shake&&!reduce)ctx.translate((Math.random()-.5)*shake*18,(Math.random()-.5)*shake*12);background();ctx.save();if(!reduce){ctx.translate(W/2,H*.55);ctx.rotate(-bankAt(world)*.075);ctx.translate(-W/2,-H*.55);}drawRoad();drawCircuitDetails();if(mode==='menu'){// A rolling pack behind the title.
for(let i=3;i>=0;i--){let p=project(2500+i*1800,.45+Math.sin(i)*.35);car(p.x,p.y,p.w*.25,colors[i],false,-Math.atan(p.bank*.65),i%2?8:64)}}else {for(const c of [...cars].sort((a,b)=>b.z-a.z)){if(c.z<430||c.z>35000)continue;const p=project(c.z,c.x);if(p.y>H*1.3)continue;if(mode==='playing'&&drafting(x,c.x,c.z-1100)){ctx.fillStyle='#ffda7525';ctx.beginPath();ctx.moveTo(p.x-p.w*.11,p.y);ctx.lineTo(W/2-W*.12,H*.83);ctx.lineTo(W/2+W*.12,H*.83);ctx.lineTo(p.x+p.w*.11,p.y);ctx.fill()}car(p.x,p.y,p.w*.255,c.color,false,-Math.atan(p.bank*(.65+c.x*.24)),c.number,c.boost>0)}}
if(mode!=='results'){let heroX=mode==='menu'?W*.72:W/2,heroY=mode==='menu'?H*.88:H*.835;let size=Math.min(W*.26,H*.29);if(mode==='menu')size=Math.min(W*.3,H*.37);const spinAngle=(mode==='playing'||mode==='paused')&&contact.spin>0&&!reduce?(1-contact.spin/1.6)*Math.PI*2:0;const wobble=(mode==='playing'||mode==='paused')&&contact.wobble>0&&!reduce?Math.sin(elapsed*32)*contact.wobble*.10:0;
if((mode==='playing'||mode==='paused')&&contact.spin>0){ctx.fillStyle='#d9dedc50';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(heroX+(i-1.5)*size*.3,heroY+size*.07,size*(.13+i*.035),size*.12,0,0,Math.PI*2);ctx.fill();}}
car(heroX,heroY,size,'#ec493f',true,(mode==='playing'?vx*.055:0)-Math.atan(bankAt(world)*(.65+x*.24))+spinAngle+wobble);}ctx.restore();
if(boost>0&&!reduce&&mode==='playing'){ctx.strokeStyle='#fff2bf55';ctx.lineWidth=2;for(let i=0;i<20;i++){let angle=i/20*Math.PI*2,dist=(time*1.5+i*.13)%1;ctx.beginPath();ctx.moveTo(W/2+Math.cos(angle)*W*dist,H*.43+Math.sin(angle)*H*dist);ctx.lineTo(W/2+Math.cos(angle)*W*(dist+.1),H*.43+Math.sin(angle)*H*(dist+.1));ctx.stroke()}}
ctx.globalAlpha=1;const vignette=ctx.createLinearGradient(0,0,0,H);vignette.addColorStop(0,'#111f3040');vignette.addColorStop(.4,'#111f3000');vignette.addColorStop(1,'#111f3070');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);if(mode==='menu'){const shade=ctx.createLinearGradient(0,0,W,0);shade.addColorStop(0,'#101f33e8');shade.addColorStop(.5,'#14253990');shade.addColorStop(1,'#14253900');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H)}ctx.restore();}
function frame(now){const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;tick(dt);render();if(gain){gain.gain.setTargetAtTime(soundOn&&mode==='playing'?.035:0,audio.currentTime,.08);osc.frequency.setTargetAtTime(45+speed/65,audio.currentTime,.06)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{const offer=()=>{if(reg.waiting){$('update').hidden=false;$('update').onclick=()=>{if(mode==='playing')pause();reg.waiting.postMessage('ACTIVATE')}}};offer();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(navigator.serviceWorker.controller)offer()})})}).catch(()=>{});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload()}})}
