import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,curveAt,drafting,collision,stepCharge,trafficSpeed} from '../engine.js';
test('the oval repeats across lap boundaries',()=>{for(const z of [0,1000,60000,180000])assert.equal(curveAt(z),curveAt(z+TRACK))});
test('drafting needs alignment and a safe following distance',()=>{assert.equal(drafting(0,.1,1000),true);assert.equal(drafting(0,.3,1000),false);assert.equal(drafting(0,0,2400),false);assert.equal(drafting(0,0,200),false)});
test('collisions allow adjacent lanes and detect front and rear overlap',()=>{assert.equal(collision(0,0,100),true);assert.equal(collision(0,.33,100),false);assert.equal(collision(0,0,-100),true);assert.equal(collision(0,0,300),false)});
test('a fast rival permits a full charge before collision range',()=>{const pace=6000,relative=pace-trafficSpeed('fast',pace);let gap=2290,charge=0;for(let t=0;t<1.7;t+=1/120){charge=stepCharge(charge,drafting(0,0,gap),1/120,false);gap-=relative/120}assert.equal(charge,1);assert.ok(gap>250)});
test('charge decays outside the draft and cannot accumulate during boost',()=>{assert.equal(stepCharge(.5,false,1,false),0);assert.equal(stepCharge(.9,true,1,true),0);assert.equal(stepCharge(.99,true,1,false),1)});
test('all traffic remains slower than the player with distinct closing rates',()=>{const speeds=['slow','medium','fast'].map(k=>trafficSpeed(k,6000));assert.ok(speeds[0]<speeds[1]&&speeds[1]<speeds[2]&&speeds[2]<6000)});
