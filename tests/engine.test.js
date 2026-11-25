import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,FIELD_SIZE,curveAt,bankAt,drafting,collision,stepCharge,createField,stepRivals,racePosition,trackGap,racePace,freshContact,advanceContact,registerContact,racingLineAt,linePace,cornerPull,trackSection,freshLap,updateLap} from '../engine.js';
test('oval and banking are continuous and repeat with two left turns',()=>{
 for(let z=0;z<TRACK;z+=100){assert.ok(Math.abs(curveAt(z)-curveAt(z+TRACK))<1e-10);assert.ok(Math.abs(curveAt(z)-curveAt(z+1))<.001);assert.ok(bankAt(z)>=0&&bankAt(z)<=.34)}
 assert.equal(curveAt(0),0);assert.equal(curveAt(TRACK/2),0);assert.ok(curveAt(TRACK/4)<-1);assert.ok(curveAt(TRACK*3/4)<-1);
});
test('drafting requires alignment and safe following distance',()=>{assert.ok(drafting(0,.1,1000));assert.equal(drafting(0,.3,1000),false);assert.equal(drafting(0,0,2500),false);assert.equal(drafting(0,0,200),false)});
test('collision allows adjacent lanes but detects front and rear overlap',()=>{assert.ok(collision(0,0,100));assert.equal(collision(0,.33,100),false);assert.ok(collision(0,0,-100));assert.equal(collision(0,0,300),false)});
test('draft meter fills, drains, and locks during boost',()=>{assert.equal(stepCharge(0,true,1.7,false),1);assert.equal(stepCharge(.5,false,1,false),0);assert.equal(stepCharge(.9,true,1,true),0)});
test('the fixed field has eleven unique rivals near player pace',()=>{const cars=createField();assert.equal(cars.length,FIELD_SIZE-1);assert.equal(new Set(cars.map(c=>c.id)).size,11);assert.ok(cars.every(c=>Math.abs(c.engine-1)<.01));assert.equal(racePosition(0,cars),12)});
test('rank uses total progress, including regained places and laps',()=>{const cars=[{progress:1000},{progress:2000},{progress:TRACK+100}];assert.equal(racePosition(500,cars),4);assert.equal(racePosition(1500,cars),3);assert.equal(racePosition(TRACK+200,cars),1);assert.equal(racePosition(0,cars),4);assert.equal(trackGap(TRACK-50,50),100)});
test('rivals use drafting to gain boost, without adding or removing cars',()=>{
 const cars=createField().slice(0,1);cars[0].progress=0;cars[0].x=0;cars[0].target=0;
 let player={x:0,progress:1400,speed:6000},boosted=false;
 for(let i=0;i<500;i++){stepRivals(cars,player,.01,0);player.progress+=60;if(cars[0].boost>0)boosted=true}
 assert.ok(boosted);assert.equal(cars.length,1);
});
test('AI brakes behind player and cannot rear-end an occupied line',()=>{
 const cars=createField().slice(0,1);cars[0].progress=0;cars[0].x=0;cars[0].target=0;cars[0].boost=2;cars[0].decision=100;
 let player={x:0,progress:450,speed:5000};
 for(let i=0;i<300;i++){stepRivals(cars,player,.01,0);player.progress+=50;assert.ok(player.progress-cars[0].progress>185)}
});
test('boost gains ground that matching pace alone cannot',()=>{
 const rival=createField()[0];rival.engine=1;let player=0;const initial=rival.progress;
 for(let i=0;i<300;i++){rival.progress+=racePace(0)*.01;player+=racePace(0)*.01}
 assert.equal(Math.round(rival.progress-player),initial);
 for(let i=0;i<280;i++){rival.progress+=racePace(0)*.01;player+=(racePace(0)+3400)*.01}
 assert.ok(player>rival.progress);
});
test('a boosted rival can pull out around the player instead of remaining stuck',()=>{
 const cars=createField().slice(0,1);Object.assign(cars[0],{progress:0,x:0,target:0,boost:2.5,decision:0});
 const player={x:0,progress:900,speed:6000};
 for(let i=0;i<150;i++){stepRivals(cars,player,.01,0);player.progress+=60}
 assert.ok(Math.abs(cars[0].x)>.25);assert.ok(cars[0].progress>player.progress);
});
test('the full field seeks slipstreams and generates its own overtaking boosts',()=>{
 const cars=createField();let boosted=false;
 const player={x:.81,progress:-8000,speed:6000};
 for(let i=0;i<1800;i++){stepRivals(cars,player,1/60,i/60);player.progress+=100;if(cars.some(c=>c.boost>0))boosted=true}
 assert.ok(boosted);assert.equal(cars.length,11);assert.ok(cars.every(c=>Number.isFinite(c.progress)&&Math.abs(c.x)<=.66));
});

test('one nudge, even at boost speed, never triggers a spin',()=>{
 for(const closing of [0,1000,5000,12000]){const s=registerContact(freshContact(),closing);assert.equal(s.event,'bump');assert.equal(s.spin,0);assert.ok(s.heat<1)}
});
test('contact has a cooldown, repeated hits escalate and clear running cools heat',()=>{
 let state=registerContact(freshContact(),3000);const heat=state.heat;
 for(let i=0;i<120;i++)state=registerContact(state,3000);assert.equal(state.heat,heat);assert.equal(state.spin,0);
 state=advanceContact(state,.7);state=registerContact(state,3000);assert.equal(state.event,'spin');
 state=advanceContact(state,3);assert.equal(state.spin,0);assert.equal(state.heat,0);assert.equal(state.cooldown,0);
});

test('the racing line moves from wide entry to inside apex and wide exit',()=>{
 assert.ok(racingLineAt(TRACK*.065)>.2);assert.ok(racingLineAt(TRACK*.25)<-.4);assert.ok(racingLineAt(TRACK*.435)>.2);
 for(let z=0;z<TRACK;z+=100){assert.ok(Math.abs(racingLineAt(z)-racingLineAt(z+1))<.001);assert.ok(Math.abs(racingLineAt(z)-racingLineAt(z+TRACK))<1e-10)}
 assert.equal(trackSection(0),'HOME STRAIGHT');assert.equal(trackSection(TRACK*.1),'TURN 1');assert.equal(trackSection(TRACK*.3),'TURN 2');assert.equal(trackSection(TRACK*.6),'TURN 3');assert.equal(trackSection(TRACK*.8),'TURN 4');
});
test('carrying the apex line saves speed; straights do not impose a line penalty',()=>{
 const z=TRACK*.25,pace=6000,ideal=linePace(pace,racingLineAt(z),z),wide=linePace(pace,.8,z);
 assert.ok(ideal>wide*1.15);assert.ok(ideal<pace);assert.equal(linePace(pace,-.8,0),pace);assert.equal(linePace(pace,.8,0),pace);
 assert.equal(cornerPull(0,pace,pace),0);assert.ok(cornerPull(z,9000,pace)>cornerPull(z,pace,pace));
});
test('lap crossings record time and PB once, even if contact moves back over the stripe',()=>{
 let lap=updateLap(freshLap(),TRACK+5,40);assert.equal(lap.completed,1);assert.equal(lap.last,40);assert.equal(lap.best,40);assert.ok(lap.personalBest);
 lap=updateLap(lap,TRACK-10,40.1);assert.equal(lap.crossed,false);lap=updateLap(lap,TRACK+5,40.2);assert.equal(lap.crossed,false);assert.equal(lap.started,40);
 lap=updateLap(lap,TRACK*2+1,85);assert.equal(lap.last,45);assert.equal(lap.best,40);assert.equal(lap.personalBest,false);
 lap=updateLap(lap,TRACK*3+1,123);assert.equal(lap.best,38);assert.ok(lap.personalBest);
});
