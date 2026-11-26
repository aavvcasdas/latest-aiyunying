import { IkiPlayer } from '@ikijs/engine';
import { loadIkiModel, StandardParameter as P } from '@ikijs/format';
import {rad,envelope,rot,add,sub,poseAt,anchors,skinPoint} from './kinematics.mjs';

const W=1280,H=720,BASE='assets/cutout/',scale=.545,offset=[640-456*.545,650-1095*.545];
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d');
const ikiCanvas=document.querySelector('#iki'),errorBox=document.querySelector('#error');
canvas.width=W;canvas.height=H;
// Iki needs a nonzero CSS viewport even though its transparent result is composited
// into the SAME output canvas. Do not display a second face-only route.
ikiCanvas.hidden=false;ikiCanvas.style.cssText='position:fixed;left:-10000px;top:0;width:912px;height:1136px;pointer-events:none';
let images={},rig,player,route='C',playing=true,time=0,epoch=performance.now(),debug=false,manual=false;
let face={eye:1,mouth:0};
function background(){
 ctx.setTransform(1,0,0,1,0,0);const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f0f5fa');g.addColorStop(1,'#dce9f2');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#f8fbfe';ctx.beginPath();ctx.ellipse(640,340,326,326,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#c4d9e7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(145,650);ctx.lineTo(1135,650);ctx.stroke();
}
function drawPart(name,angles){
 const [s,e]=anchors(rig,name);
 // Both images are rigid affine transforms; no per-vertex bending anywhere.
 ctx.save();ctx.translate(...s);ctx.rotate(rad(angles[0]));ctx.translate(-s[0],-s[1]);
 ctx.drawImage(images[name+'_upper'],0,0);
 ctx.translate(...e);ctx.rotate(rad(angles[1]));ctx.translate(-e[0],-e[1]);
 ctx.drawImage(images[name+'_lower'],0,0);ctx.restore();
}
function setFace(t){
 const blink=(c)=>Math.max(0,1-Math.abs(t-c)/.13);
 face={eye:manual?Number(document.querySelector('#eye').value):1-Math.max(blink(1.1),blink(4.2),blink(6.4)),
 mouth:manual?Number(document.querySelector('#mouth').value):(t>2&&t<5.8?(.25+.7*Math.abs(Math.sin(t*8)))*envelope(t,2,5.8,.3):0)};
 player.setParameter(P.EyeOpenLeft,face.eye);player.setParameter(P.EyeOpenRight,face.eye);player.setParameter(P.MouthOpen,face.mouth);
 for(const id of [P.AngleX,P.AngleY,P.AngleZ,P.BodyAngleX,P.BodyAngleY,P.BodyAngleZ,P.Breath])if(id)player.setParameter(id,0);
 document.querySelector('#params').textContent=`眼睛开合 ${face.eye.toFixed(2)} · 嘴部开合 ${face.mouth.toFixed(2)} · 与手脚共用时间 ${t.toFixed(2)} s`;
}
function compose(t){
 background();const pose=poseAt(t);
 ctx.save();ctx.translate(...offset);ctx.scale(scale,scale);
 drawPart('leg_R',pose.leg_R);drawPart('leg_L',pose.leg_L);
 ctx.drawImage(images.body,0,0);drawPart('arm_R',pose.arm_R);drawPart('arm_L',pose.arm_L);
 ctx.drawImage(ikiCanvas,0,0,912,1136);
 if(debug){ctx.strokeStyle='#39c4a8';ctx.fillStyle='#0b665b';ctx.lineWidth=4;
 for(const [name,angles] of Object.entries(pose)){
 const [s,e,h]=anchors(rig,name),joint=add(s,rot(sub(e,s),rad(angles[0]))),tip=add(joint,rot(sub(h,e),rad(angles[0]+angles[1])));
 ctx.beginPath();ctx.moveTo(...s);ctx.lineTo(...joint);ctx.lineTo(...tip);ctx.stroke();
 for(const p of [s,joint,tip]){ctx.beginPath();ctx.arc(...p,6,0,Math.PI*2);ctx.fill();}}
 }ctx.restore();
 document.querySelector('#seek').value=t;document.querySelector('#clock').textContent=`${t.toFixed(1)} / 8.0 s`;
 document.querySelector('#current').textContent='Cutout 刚性关节 + Iki 眼睛 / 嘴部 · 同一个角色、同一张输出画布';
}
// Set all parameters, let Iki's public rendering loop draw, then composite its
// transparent face into the rigid cutout. There is no second animation clock.
const raf=()=>new Promise(r=>requestAnimationFrame(r));
let exporting=false;
async function tick(now){
 if(!exporting){if(playing)time=((now-epoch)/1000)%8;const t=time;setFace(t);await raf();if(!exporting)compose(t);}
 requestAnimationFrame(tick);
}
async function choose(){route='C';document.querySelector('#faceControls').hidden=false;document.querySelector('#bonesLabel').hidden=false;}
async function init(){
 const response=await fetch(BASE+'rig.json');if(!response.ok)throw new Error('Missing rig manifest');rig=await response.json();
 for(const name of ['body',...Object.keys(rig.joints).flatMap(n=>[n+'_upper',n+'_lower'])]){
 const im=new Image();im.src=BASE+name+'.png';await im.decode();images[name]=im;}
 player=new IkiPlayer(ikiCanvas);
 const mr=await fetch(BASE+'whale.iki');if(!mr.ok)throw new Error('Missing Iki model');const model=loadIkiModel(await mr.text());
 const loaded=await player.load(model);if(loaded.failedTextures.length)throw new Error('Iki texture load failure: '+loaded.failedTextures);
 player.setView({x:0,y:0,width:912,height:1136});player.start();
 document.querySelector('#loading').hidden=true;
 document.querySelector('#play').onclick=()=>{playing=!playing;exporting=false;epoch=performance.now()-time*1000;document.querySelector('#play').textContent=playing?'暂停':'播放';};
 document.querySelector('#restart').onclick=()=>{time=0;epoch=performance.now();manual=false;exporting=false;};
 document.querySelector('#seek').oninput=e=>{time=Number(e.target.value);epoch=performance.now()-time*1000;exporting=false;};
 document.querySelector('#bones').onchange=e=>{debug=e.target.checked;exporting=false;};
 for(const id of ['eye','mouth'])document.querySelector('#'+id).oninput=()=>{manual=true;exporting=false;};
 document.querySelector('#autoFace').onclick=()=>{manual=false;exporting=false;};
 document.querySelector('#routeBStatus').textContent=`Cutout + Iki 已组合 · ${model.parts.length} 个独立面部部件`;
 window.puppet={ready:true,poseAt,bonePoint:(p,n,a)=>skinPoint(rig,p,n,a),rig,choose,
 snapshot:async(_route,t)=>{exporting=true;playing=false;manual=false;time=t;setFace(t);await raf();await raf();compose(t);return canvas.toDataURL('image/png');},
 getState:()=>({route,time,playing,bodyRoot:[456,650],parameters:player.getParameters().map(p=>({id:p.id,value:player.getParameter(p.id)}))})};
 await choose();requestAnimationFrame(tick);
}
function fail(error){console.error(error);errorBox.hidden=false;errorBox.textContent='预览加载失败：'+error.message;document.querySelector('#loading').hidden=true;}
init().catch(fail);
