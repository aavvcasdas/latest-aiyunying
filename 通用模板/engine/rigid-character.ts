// Generic fixed-length cutout skeleton. NO strips, mesh skinning, shear or scale.
// Source / target links are mapped by translation + rotation only.
export type V2 = [number, number];
export type Limb = 'arm_R' | 'arm_L' | 'leg_R' | 'leg_L';
export type Emotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'joy' | 'surprised';
export interface ChainBind { root: V2; joint: V2; end: V2; tip: V2 }
export interface FaceBind { eyes: Record<'R'|'L',[number,number,number,number]>; mouth: V2 }
export interface RigidBind {
  w: number; h: number; ground?: number;
  chains: Record<Limb, ChainBind>;
  face: FaceBind;
  files: Record<string, string>;
}
export interface ChainPose { root: V2; joint: V2; end: V2; tip: V2; contact: boolean }
export interface RigidPose { body: V2; travel: number; chains: Record<Limb, ChainPose> }
export interface RigidOptions {
  action: string; time: number; cycle?: number; stride?: number;
  /** Per-joint degrees from straight-down, elbow/knee relative flexion. */
  joints?: Partial<Record<Limb, [number, number]>>;
}
export interface FaceState { emotion: Emotion; strength: number; time: number; mouth?: number; blink?: number }
export type RigidImages = Record<string, CanvasImageSource>;
const PI = Math.PI;
export const plus=(a: V2,b: V2): V2=>[a[0]+b[0],a[1]+b[1]];
export const minus=(a: V2,b: V2): V2=>[a[0]-b[0],a[1]-b[1]];
export const length=(a: V2)=>Math.hypot(a[0],a[1]);
const clamp=(x: number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const deg=(a: number)=>a*PI/180;
const at=(root: V2,len: number,a: number): V2=>plus(root,[Math.sin(a)*len,Math.cos(a)*len]);
const rotate=(p: V2,a: number): V2=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
export const LIMBS: Limb[]=['leg_R','leg_L','arm_R','arm_L'];
export const EMOTIONS: Emotion[]=['neutral','happy','angry','sad','joy','surprised'];
export function validateBind(bind: RigidBind): void {
  if(![bind.w,bind.h].every(Number.isFinite)||!(bind.w>0&&bind.h>0))throw new Error('[rig] invalid source dimensions');
  if(!bind.face||!Object.values(bind.face.eyes).every(p=>p.length===4&&p.every(Number.isFinite))||!bind.face.mouth.every(Number.isFinite))throw new Error('[rig] missing face anchors');
  for(const name of LIMBS){
    const c=bind.chains[name];
    if(!c||![c.root,c.joint,c.end,c.tip].every(p=>p?.length===2&&p.every(Number.isFinite)))throw new Error('[rig] missing/nonfinite joint '+name);
    if(length(minus(c.joint,c.root))<1||length(minus(c.end,c.joint))<1)throw new Error('[rig] zero bone '+name);
    for(const part of ['upper','lower','end'])if(!bind.files[name+'_'+part])throw new Error('[rig] missing rigid artwork '+name+'_'+part);
  }
  if(!bind.files.body||!bind.files.eye_R||!bind.files.eye_L)throw new Error('[rig] missing body/eyes');
}
/** Planar two-bone IK, fixed lengths. Reject unreachable targets, never stretch. */
export function solveIK(root: V2,target: V2,l1: number,l2: number,bend=1): V2 {
  const v=minus(target,root),d=length(v);
  if(!Number.isFinite(d)||d>l1+l2+1e-6||d<Math.abs(l1-l2)-1e-6||d<1e-6)throw new Error('[rig] unreachable target; move root, do not stretch');
  const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
  // Both knees flex forward (+x) in sagittal screen projection, NOT sideways
  // in opposite directions. bind artwork remains frontal: this is a 2D walk.
  return [root[0]+v[0]*along/d+v[1]*height/d*bend,root[1]+v[1]*along/d-v[0]*height/d*bend];
}
export function rigidPose(bind: RigidBind,o: RigidOptions): RigidPose {
  if(!['idle','bind','walk','run','wave'].includes(o.action))throw new Error('[rig] unsupported action');
  if(!Number.isFinite(o.time))throw new Error('[rig] nonfinite time');
  const cycle=o.cycle??1.2,stride=o.stride??100;
  if(!(cycle>0&&Number.isFinite(cycle)&&stride>=0&&stride<=120))throw new Error('[rig] invalid gait settings');
  const walking=o.action==='walk'||o.action==='run',q=o.time/cycle;
  const body: V2=[0,walking?8+2*Math.cos(q*4*PI):0];
  const pose: RigidPose={body,travel:walking?q*stride:0,chains:{} as Record<Limb,ChainPose>};
  for(const name of LIMBS){
    const b=bind.chains[name],l1=length(minus(b.joint,b.root)),l2=length(minus(b.end,b.joint)),root=plus(b.root,body);
    let joint: V2,end: V2,angle=0,contact=false;
    const phase=((q+(name.endsWith('L')?.5:0))%1+1)%1;
    if(walking&&name.startsWith('leg')&&!o.joints?.[name]){
      const support=.6,span=stride*support;
      let dx: number,lift: number;
      if(phase<support){dx=span/2-phase*stride;lift=0;contact=true;}
      else {const s=(phase-support)/(1-support),ease=s*s*(3-2*s);dx=-span/2+span*ease;lift=32*Math.sin(PI*s)**2;angle=deg(-12)*Math.sin(PI*s);}
      end=[b.end[0]+dx,b.end[1]-lift];
      joint=solveIK(root,end,l1,l2,1);
    } else {
      let shoulder=name.startsWith('arm')?(name.endsWith('R')?-10:10):0;
      let elbow=0;
      if(walking&&name.startsWith('arm')){shoulder+=18*Math.cos(phase*2*PI);elbow=8+8*(1-Math.cos(phase*2*PI));}
      if(o.action==='wave'&&name==='arm_R'){shoulder=-72;elbow=-65+8*Math.sin(o.time*5);}
      if(o.joints?.[name]) [shoulder,elbow]=o.joints[name]!;
      if(!Number.isFinite(shoulder)||!Number.isFinite(elbow)||Math.abs(elbow)>145)throw new Error('[rig] invalid joint angle '+name);
      joint=at(root,l1,deg(shoulder));end=at(joint,l2,deg(shoulder+elbow));
      angle=name.startsWith('arm')?Math.atan2(end[1]-joint[1],end[0]-joint[0])-Math.atan2(b.end[1]-b.joint[1],b.end[0]-b.joint[0]):0;
    }
    const sourceEnd=minus(b.tip,b.end);
    pose.chains[name]={root,joint,end,tip:plus(end,rotate(sourceEnd,angle)),contact};
  }
  return pose;
}
/** Map a source link rigidly to target link. No ctx.scale in this renderer. */
export function drawLink(ctx: CanvasRenderingContext2D,img: CanvasImageSource,sourceA: V2,sourceB: V2,targetA: V2,targetB: V2): void {
  const u=minus(sourceB,sourceA),v=minus(targetB,targetA);
  if(Math.abs(length(u)-length(v))>1e-4)throw new Error('[rig] bone length changed');
  ctx.save();ctx.translate(...targetA);ctx.rotate(Math.atan2(v[1],v[0])-Math.atan2(u[1],u[0]));ctx.drawImage(img,-sourceA[0],-sourceA[1]);ctx.restore();
}
function drawChain(ctx: CanvasRenderingContext2D,images: RigidImages,name: Limb,b: ChainBind,p: ChainPose){
  for(const [part,a,z] of [['upper','root','joint'],['lower','joint','end'],['end','end','tip']] as const){
    const img=images[name+'_'+part];if(!img)throw new Error('[rig] texture not loaded '+name+'_'+part);
    drawLink(ctx,img,b[a],b[z],p[a],p[z]);
  }
}
export function faceChannels(f: FaceState){
  if(!EMOTIONS.includes(f.emotion)||![f.time,f.strength,f.mouth??0,f.blink??0].every(Number.isFinite))throw new Error('[face] invalid expression');
  const strength=clamp(f.strength),phase=((f.time%2.1)+2.1)%2.1;
  const blink=f.blink??Math.max(0,1-Math.abs(phase-1.8)/.11);
  const joy=f.emotion==='joy'?strength:0,happy=f.emotion==='happy'?strength:0,sad=f.emotion==='sad'?strength:0,angry=f.emotion==='angry'?strength:0;
  return {eye:clamp((1-blink)*(1-.9*joy-.35*happy-.3*sad)),mouth:clamp(f.mouth??(joy*.85+happy*.25+(f.emotion==='surprised'?.8*strength:0))),happy,sad,angry,joy};
}
/** Independent eyes, lids, eyebrows, tears and mouth, evaluated on EACH template
 * frame. Rich expression artwork supplements the old Iki eye/mouth-only model;
 * this synchronous template renderer does not pretend to run IkiPlayer. */
export function drawExpression(ctx: CanvasRenderingContext2D,images: RigidImages,f: FaceState,anchors: FaceBind){
  const c=faceChannels(f);ctx.save();ctx.strokeStyle='#613b4b';ctx.lineWidth=3;ctx.lineCap='round';
  for(const [side,box] of [['R',anchors.eyes.R],['L',anchors.eyes.L]] as const){
    const [x,y,w,h]=box,cx=x+w/2,cy=y+h/2;
    if(c.eye>.12){
      ctx.save();ctx.beginPath();ctx.rect(x,y+h*(1-c.eye)*.5,w,h*c.eye);ctx.clip();
      const im=images['eye_'+side];if(!im)throw new Error('[face] missing eye '+side);ctx.drawImage(im,0,0);ctx.restore();
    }else{ctx.beginPath();const mid=cy+9;ctx.moveTo(x+9,mid);ctx.quadraticCurveTo(cx,mid+(c.joy||c.happy?-15:17),x+w-9,mid);ctx.stroke();}
    // Eyebrow inclination is explicit, not the old static neutral eyelids.
    const inward=side==='R'?1:-1,tilt=inward*(c.angry*18-c.sad*15);
    ctx.beginPath();ctx.moveTo(x+12,y+5-tilt);ctx.quadraticCurveTo(cx,y-3-c.happy*7,x+w-12,y+5+tilt);ctx.stroke();
    if(c.sad>.3){ctx.save();ctx.globalAlpha=c.sad*.8;ctx.fillStyle='#90d5f0';ctx.beginPath();ctx.ellipse(x+(side==='R'?14:w-14),y+h-3,5,8+5*Math.sin(f.time*3)**2,0,0,2*PI);ctx.fill();ctx.restore();}
  }
  ctx.save();ctx.translate(...anchors.mouth);ctx.lineWidth=2.5;
  if(c.mouth>.1){
    ctx.fillStyle='#773e59';ctx.beginPath();
    if(c.joy>.1){ctx.moveTo(-16,0);ctx.quadraticCurveTo(0,4,16,0);ctx.quadraticCurveTo(0,27,-16,0);}
    else ctx.ellipse(0,1,10,3+c.mouth*13,0,0,2*PI);
    ctx.fill();
    ctx.fillStyle='#ee9fae';ctx.beginPath();ctx.ellipse(0,5+c.mouth*4,6+c.joy*3,3,0,0,2*PI);ctx.fill();
  } else {ctx.beginPath();ctx.moveTo(-9,0);ctx.quadraticCurveTo(0,c.sad?-8:c.angry?-2:5+c.happy*5,9,0);ctx.stroke();}
  ctx.restore();ctx.restore();
}
export function drawRigidCharacter(ctx: CanvasRenderingContext2D,bind: RigidBind,images: RigidImages,pose: RigidPose,face: FaceState,bones=false){
  for(const name of ['leg_R','leg_L'] as Limb[])drawChain(ctx,images,name,bind.chains[name],pose.chains[name]);
  if(!images.body)throw new Error('[rig] body not loaded');
  ctx.drawImage(images.body,...pose.body);
  for(const name of ['arm_R','arm_L'] as Limb[])drawChain(ctx,images,name,bind.chains[name],pose.chains[name]);
  ctx.save();ctx.translate(...pose.body);drawExpression(ctx,images,face,bind.face);ctx.restore();
  if(bones){ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#13b99c';ctx.fillStyle='#075f56';
    for(const [name,p] of Object.entries(pose.chains)){
      ctx.beginPath();ctx.moveTo(...p.root);for(const v of [p.joint,p.end,p.tip])ctx.lineTo(...v);ctx.stroke();
      for(const v of [p.root,p.joint,p.end,p.tip]){ctx.beginPath();ctx.arc(...v,5,0,2*PI);ctx.fill();}
      if(p.contact){ctx.strokeStyle='#e89a23';ctx.beginPath();ctx.moveTo(p.end[0]-18,p.end[1]+(bind.ground??1095)-bind.chains[name as Limb].end[1]);ctx.lineTo(p.end[0]+18,p.end[1]+(bind.ground??1095)-bind.chains[name as Limb].end[1]);ctx.stroke();ctx.strokeStyle='#13b99c';}
    }ctx.restore();}
}
