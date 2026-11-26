import test from 'node:test';
import assert from 'node:assert/strict';
import './tpl-loader.mjs';
import fs from 'node:fs';
const {rigidPose,solveIK,validateBind,drawLink,faceChannels,EMOTIONS,LIMBS}=await import('../engine/rigid-character.ts');
const bind=JSON.parse(fs.readFileSync(new URL('../engine/assets/rigid/whale/bind.json',import.meta.url)));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('all four chains have shoulder/hip, elbow/knee, wrist/ankle, palm/shoe bindings',()=>{
 validateBind(bind);for(const name of LIMBS)for(const part of ['upper','lower','end'])assert.ok(bind.files[name+'_'+part]);
});
test('bone lengths are fixed in every walk frame, INCLUDING swing and foot joints',()=>{
 for(let i=-60;i<360;i++){
  const pose=rigidPose(bind,{action:'walk',time:i/60});
  for(const name of LIMBS){const a=bind.chains[name],b=pose.chains[name];
   for(const [u,v] of [['root','joint'],['joint','end'],['end','tip']])near(dist(a[u],a[v]),dist(b[u],b[v]));
  }
 }
});
test('elbow zero is collinear, manual joint freeze is exactly honored',()=>{
 const pose=rigidPose(bind,{action:'walk',time:.2,joints:{arm_R:[0,0],arm_L:[0,0]}});
 for(const name of ['arm_R','arm_L']){const p=pose.chains[name];near(p.root[0],p.joint[0]);near(p.joint[0],p.end[0]);}
});
test('support ankle has zero WORLD velocity; feet alternate and swing clears ground',()=>{
 for(const name of ['leg_R','leg_L']){
  let contacts=0,raised=0;
  for(let i=1;i<180;i++){
   const a=rigidPose(bind,{action:'walk',time:(i-1)/120}),b=rigidPose(bind,{action:'walk',time:i/120});
   const x=a.chains[name],y=b.chains[name];
   if(x.contact&&y.contact){near(x.end[0]+a.travel,y.end[0]+b.travel);near(x.end[1],y.end[1]);contacts++;}
   if(!y.contact&&y.end[1]<bind.chains[name].end[1]-10)raised++;
  }
  assert.ok(contacts>50&&raised>10);
 }
});
test('both knees flex in SAME forward direction, never mirrored scissor knees',()=>{
 for(let i=0;i<120;i++){
  const p=rigidPose(bind,{action:'walk',time:i/100});
  for(const name of ['leg_R','leg_L']){
   const a=p.chains[name],v=[a.end[0]-a.root[0],a.end[1]-a.root[1]],u=[a.joint[0]-a.root[0],a.joint[1]-a.root[1]];
   assert.ok(u[0]*v[1]-u[1]*v[0]>0);
  }
 }
});
test('each rigid draw uses ONLY translate/rotate, not scale/shear or strips',()=>{
 const calls=[];const ctx={save(){},restore(){},translate(...a){calls.push(['translate',...a]);},rotate(a){calls.push(['rotate',a]);},drawImage(...a){calls.push(['drawImage',...a]);},scale(){throw Error('stretch forbidden');},transform(){throw Error('shear forbidden');}};
 drawLink(ctx,{},[1,2],[1,12],[30,30],[40,30]);
 assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);
 assert.throws(()=>drawLink(ctx,{},[0,0],[0,10],[0,0],[0,11]),/bone length changed/);
});
test('seek is stateless; unreachable IK, bad time and bind must fail',()=>{
 const p=rigidPose(bind,{action:'walk',time:.6});rigidPose(bind,{action:'walk',time:9});assert.deepEqual(p,rigidPose(bind,{action:'walk',time:.6}));
 assert.throws(()=>solveIK([0,0],[999,0],20,20),/unreachable/);
 assert.throws(()=>rigidPose(bind,{action:'walk',time:NaN}));
 const bad=structuredClone(bind);bad.chains.arm_R.joint=bad.chains.arm_R.root;assert.throws(()=>validateBind(bad));
});
test('all emotions evaluate to distinct facial channels; clock drives blink independently',()=>{
 const channels=EMOTIONS.map(emotion=>faceChannels({emotion,strength:1,time:.3}));
 assert.equal(new Set(channels.map(JSON.stringify)).size,EMOTIONS.length);
 near(faceChannels({emotion:'neutral',strength:1,time:1.8}).eye,0);
 assert.equal(faceChannels({emotion:'neutral',strength:1,time:.3,blink:0}).eye,1);
 assert.throws(()=>faceChannels({emotion:'unknown',strength:1,time:0}));
});
