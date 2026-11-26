import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {poseAt,skinPoint,rigidPoint,anchors,sub,rot,add,rad} from './kinematics.mjs';
const rig=JSON.parse(fs.readFileSync(new URL('../assets/cutout/rig.json',import.meta.url)));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('rest pose reconstructs all source coordinates',()=>{
 for(const name of Object.keys(rig.joints))for(const p of anchors(rig,name))assert.ok(dist(skinPoint(rig,p,name,[0,0]),p)<1e-8);
});
test('shoulder and hip roots never translate with limb animation',()=>{
 for(let i=0;i<240;i++)for(const [name,angles] of Object.entries(poseAt(i/30))){const p=anchors(rig,name)[0];assert.ok(dist(skinPoint(rig,p,name,angles),p)<1e-8);}
});
test('hand actually rises by over 100 source pixels, torso fixed',()=>{
 const name='arm_R',chain=anchors(rig,name),pose=poseAt(1.5)[name];
 const hand=skinPoint(rig,chain[2],name,pose);
 assert.ok(hand[1]<chain[2][1]-100);
 assert.ok(dist(hand,chain[2])>150);
});
test('independent elbow angle changes forearm without moving upper shoulder',()=>{
 const [s,e,h]=anchors(rig,'arm_R');
 assert.ok(dist(skinPoint(rig,h,'arm_R',[0,80]),h)>80);
 assert.ok(dist(skinPoint(rig,s,'arm_R',[0,80]),s)<1e-8);
 const expected=add(e,rot(sub(h,e),rad(80)));
 assert.ok(dist(skinPoint(rig,h,'arm_R',[0,80]),expected)<1e-8);
});
test('all generated poses and skin vertices stay finite',()=>{
 for(let i=0;i<240;i++)for(const [name,angles] of Object.entries(poseAt(i/30))){
  for(const p of [...anchors(rig,name),[300,650],[520,950]])assert.ok(skinPoint(rig,p,name,angles).every(Number.isFinite));
 }
});
test('eight second loop is continuous',()=>{
 const a=poseAt(8-1e-7),b=poseAt(0);
 for(const k of Object.keys(a))assert.ok(dist(a[k],b[k])<1e-6);
});
test('jump frames are deterministic and nonfinite time is rejected',()=>{
 const a=poseAt(1.5);poseAt(7);poseAt(.5);assert.deepEqual(poseAt(1.5),a);
 assert.throws(()=>poseAt(NaN));assert.throws(()=>poseAt(Infinity));
});
test('bad or zero length joint chains fail',()=>{
 assert.throws(()=>anchors(rig,'imaginary_arm'));
 const broken={joints:{arm_R:{shoulder:[1,1],elbow:[1,1],hand:[2,2]}}};
 assert.throws(()=>skinPoint(broken,[1,2],'arm_R',[0,0]));
});

test('every rigid bone preserves pairwise distances through all angles',()=>{
 for(let i=0;i<240;i++)for(const [name,angles] of Object.entries(poseAt(i/30)))for(const segment of ['upper','lower']){
  const points=[[285,589],[313,607],[296,632],[330,570]];
  for(const a of points)for(const b of points)assert.ok(Math.abs(dist(a,b)-dist(rigidPoint(rig,a,name,angles,segment),rigidPoint(rig,b,name,angles,segment)))<1e-8);
 }
});
test('frontal soles stay planted and elbows never hyperextend',()=>{
 for(let i=0;i<240;i++){
  const p=poseAt(i/30);assert.deepEqual(p.leg_R,[0,0]);assert.deepEqual(p.leg_L,[0,0]);
  assert.ok(p.arm_R[1]>=0&&p.arm_R[1]<=90);assert.ok(p.arm_L[1]>=-40&&p.arm_L[1]<=0);
 }
});
