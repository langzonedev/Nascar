export const TRACK=240000;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function curveAt(z){const p=((z%TRACK)+TRACK)%TRACK/TRACK;return p<.22||p>.72&&p<.94?0:.68;}
export function drafting(playerX,carX,gap){return gap>250&&gap<2300&&Math.abs(playerX-carX)<.19;}
export function collision(playerX,carX,gap){return Math.abs(gap)<185&&Math.abs(playerX-carX)<.205;}
export function stepCharge(charge,isDraft,dt,boosting){return boosting?0:clamp(charge+(isDraft?dt/1.65:-dt/.95),0,1);}
export function trafficSpeed(kind,pace){return kind==='fast'?pace*.91:kind==='medium'?pace*.76:pace*.59;}
