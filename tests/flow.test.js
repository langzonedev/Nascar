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
test('holding either screen half steers and release stops lateral movement',()=>{const g=game();g.run('reset();cars=[];spawn=100');g.emit('pointerdown',{target:{closest:()=>null},preventDefault(){},pointerId:1,clientX:10});g.run('for(let i=0;i<20;i++)tick(1/60)');assert.ok(g.run('x')<-.25);g.emit('pointerup',{pointerId:1});g.run('for(let i=0;i<120;i++)tick(1/60)');assert.ok(Math.abs(g.run('vx'))<.001);g.emit('pointerdown',{target:{closest:()=>null},preventDefault(){},pointerId:2,clientX:380});g.run('for(let i=0;i<40;i++)tick(1/60)');assert.ok(g.run('x')>0)});
test('pause freezes racing and resume continues the same run',()=>{const g=game();g.run('reset();tick(.1);pause()');const distance=g.run('world');g.run('tick(1)');assert.equal(g.run('world'),distance);assert.equal(g.run('mode'),'paused');g.run('resume();tick(.1)');assert.ok(g.run('world')>distance)});
test('crash aftermath lasts three seconds before results, then retry clears the run',()=>{const g=game();g.run('reset();wreck();tick(2.9)');assert.equal(g.run('mode'),'crashing');assert.equal(g.get('results').hidden,true);g.run('tick(.2)');assert.equal(g.run('mode'),'results');assert.equal(g.get('results').hidden,false);g.get('retry').onclick();assert.equal(g.run('mode'),'playing');assert.equal(g.run('score'),0);assert.equal(g.get('results').hidden,true)});
test('ending a paused run closes the pause panel',()=>{const g=game();g.run('reset();pause()');g.get('quit').onclick();assert.equal(g.run('mode'),'results');assert.equal(g.get('paused').hidden,true)});
