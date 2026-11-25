import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as engine from '../engine.js';
function game(){
 const elements=new Map(),events=new Map();
 const drawing=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
 const get=id=>{if(!elements.has(id))elements.set(id,{hidden:true,textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext(){return drawing},setPointerCapture(){}});return elements.get(id)};
 const context=vm.createContext({...engine,console,Math,innerWidth:390,innerHeight:844,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:get,body:get('body'),hidden:false},navigator:{},performance:{now:()=>100},location:{reload(){}},requestAnimationFrame(){},addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn)}});
 const source=readFileSync(new URL('../game.js',import.meta.url),'utf8').replace(/^import .*?;\n/,'');vm.runInContext(source,context);
 return {run:code=>vm.runInContext(code,context),emit:(type,event)=>events.get(type).forEach(fn=>fn(event)),get};
}
test('holding either screen half steers and release stops lateral movement',()=>{const g=game();g.run('reset();cars=[];world=0');g.emit('pointerdown',{target:{closest:()=>null},preventDefault(){},pointerId:1,clientX:10});g.run('for(let i=0;i<20;i++)tick(1/60)');assert.ok(g.run('x')<-.25);g.emit('pointerup',{pointerId:1});g.run('for(let i=0;i<120;i++)tick(1/60)');assert.ok(Math.abs(g.run('vx'))<.001);g.emit('pointerdown',{target:{closest:()=>null},preventDefault(){},pointerId:2,clientX:380});g.run('for(let i=0;i<40;i++)tick(1/60)');assert.ok(g.run('x')>0)});
test('pause freezes racing and resume continues the same run',()=>{const g=game();g.run('reset();tick(.1);pause()');const distance=g.run('world');g.run('tick(1)');assert.equal(g.run('world'),distance);assert.equal(g.run('mode'),'paused');g.run('resume();tick(.1)');assert.ok(g.run('world')>distance)});
test('touching a car gives a recoverable bump, cancels boost, and preserves the run',()=>{
 const g=game();g.run('reset();cars=cars.slice(0,1);cars[0].progress=140;boost=2;tick(.01)');
 assert.equal(g.run('mode'),'playing');assert.equal(g.run('bumps'),1);assert.equal(g.run('boost'),0);
 assert.equal(g.run('contact.spin'),0);assert.ok(g.run('contact.wobble')>0);assert.equal(g.get('results').hidden,true);
 assert.ok(g.run('trackGap(world,cars[0].progress)')>=219);
 g.run('cars=[];for(let i=0;i<240;i++)tick(1/60)');assert.equal(g.run('contact.wobble'),0);assert.ok(g.run('speed')>5500);
});
test('repeated contact causes a temporary spin, then control recovers without ending the run',()=>{
 const g=game();g.run('reset();cars=cars.slice(0,1);for(let i=0;i<4;i++){contact=advanceContact(contact,.7);cars[0].progress=world+140;speed=6000;touchCar(cars[0],140)}');
 assert.equal(g.run('spins'),1);assert.ok(g.run('contact.spin')>0);assert.equal(g.run('mode'),'playing');
 const before=g.run('spins');g.run('for(let i=0;i<100;i++)touchCar(cars[0],140)');assert.equal(g.run('spins'),before);
 g.run('cars=[];for(let i=0;i<240;i++)tick(1/60)');assert.equal(g.run('contact.spin'),0);assert.ok(g.run('speed')>5500);
 g.get('retry').onclick();assert.equal(g.run('spins'),0);assert.equal(g.run('contact.heat'),0);
});
test('solid bumpers prevent pushing through a rival even during penalty cooldown',()=>{
 const g=game();g.run('reset();cars=cars.slice(0,1);for(let i=0;i<120;i++){cars[0].progress=world+140;touchCar(cars[0],140)}');
 assert.equal(g.run('bumps'),1);assert.ok(g.run('trackGap(world,cars[0].progress)')>=219);assert.equal(g.run('passes'),0);
});
test('ending a paused run closes the pause panel',()=>{const g=game();g.run('reset();pause()');g.get('quit').onclick();assert.equal(g.run('mode'),'results');assert.equal(g.get('paused').hidden,true)});
test('drafting then pulling out can take first place and accumulate lead time',()=>{
 const g=game();g.run("reset();cars=cars.slice(0,1);cars[0].progress=1250;position=2;bestPlace=2;charge=.99;tick(.02)");
 assert.ok(g.run('boost')>0);
 g.run("keys.add('d');for(let i=0;i<40;i++)tick(1/120);keys.clear();for(let i=0;i<480&&mode==='playing';i++)tick(1/120)");
 assert.equal(g.run('mode'),'playing');assert.equal(g.run('position'),1);assert.ok(g.run('leadTime')>0);assert.ok(g.run('passes')>0);
});
