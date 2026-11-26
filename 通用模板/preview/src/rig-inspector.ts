import '../../engine/tachie-assets';
import {Tachie,TACHIE,preloadTachie} from '../../engine/tachie';
import {EMOTIONS, type Emotion} from '../../engine/rigid-character';
const $=(id:string)=>document.getElementById(id) as HTMLInputElement;
const canvas=$('rigStage') as unknown as HTMLCanvasElement;
const ctx=canvas.getContext('2d')!;
let actor:Tachie,time=0,playing=true,epoch=performance.now();
const number=(id:string)=>Number($(id).value);
function paint(t:number){
 actor.begin();
 const emotion=$('emotion').value==='auto'?EMOTIONS[Math.floor(t/2)%EMOTIONS.length]:$('emotion').value as Emotion;
 actor.act($('action').value,t,t).expression(emotion,number('strength')).bones($('bones').checked);
 if($('manual').checked)actor.pose({arm_R:[number('shoulder'),number('elbow')]});
 if($('speak').checked)actor.face({mouth:.15+.8*Math.abs(Math.sin(t*6))});
 actor.freeze(t);
 ctx.fillStyle='#edf3f7';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#ccdce6';ctx.beginPath();ctx.moveTo(100,1100);ctx.lineTo(810,1100);ctx.stroke();
 actor.paintTo(ctx);
 const s=actor.rigState();
 $('clock').textContent=t.toFixed(3)+' s';$('time').value=String(t);
 $('state').textContent=JSON.stringify({action:$('action').value,time:+t.toFixed(3),travel:+s.travel.toFixed(2),
  joints:Object.fromEntries(Object.entries(s.chains).map(([name,p])=>[name,{root:p.root.map(n=>+n.toFixed(1)),joint:p.joint.map(n=>+n.toFixed(1)),end:p.end.map(n=>+n.toFixed(1)),contact:p.contact}]))},null,2);
}
function tick(now:number){if(playing)time=((now-epoch)/1000)%12;paint(time);requestAnimationFrame(tick);}
function pause(){playing=false;$('play').textContent='播放';}
async function main(){
 await preloadTachie('whale_cutout');actor=new Tachie(TACHIE.whale_cutout);
 $('play').onclick=()=>{playing=!playing;epoch=performance.now()-time*1000;$('play').textContent=playing?'暂停':'播放';};
 $('time').oninput=()=>{pause();time=number('time');};
 $('previous').onclick=()=>{pause();time=Math.max(0,time-1/30);};
 $('next').onclick=()=>{pause();time=Math.min(12,time+1/30);};
 for(const id of ['action','emotion','strength','bones','speak','manual','shoulder','elbow'])$(id).oninput=()=>paint(time);
 Object.assign(window,{rigInspector:{ready:true,actor,paint:(t:number)=>{pause();time=t;paint(t);return canvas.toDataURL();},state:()=>actor.rigState()}});
 requestAnimationFrame(tick);
}
main().catch(e=>{$('error').textContent=e.message;console.error(e);});
