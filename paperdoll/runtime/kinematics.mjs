// Deterministic rigid two-link kinematics. No weighted mesh or root wobble.
export const rad=d=>d*Math.PI/180;
export const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const envelope=(t,a,b,fade=.4)=>smooth((t-a)/fade)*smooth((b-t)/fade);
export const rot=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export function poseAt(t){
 if(!Number.isFinite(t))throw new Error('Non-finite animation time');
 t=((t%8)+8)%8;
 const wave=envelope(t,.4,4,.85),reach=envelope(t,4.3,7.6,.8);
 // Frontal artwork supports a greeting, not a convincing side-view walk.
 // Keep soles planted rather than bending frontal knees sideways.
 return {arm_R:[25*wave,(82+7*Math.sin((t-1)*Math.PI*2))*wave],
 arm_L:[-15*reach,-36*reach],leg_R:[0,0],leg_L:[0,0]};
}
export function anchors(rig,name){
 const j=rig.joints[name];if(!j)throw new Error('Missing joint chain: '+name);
 return name.startsWith('arm')?[j.shoulder,j.elbow,j.hand]:[j.hip,j.knee,j.foot];
}
export function rigidPoint(rig,p,name,angles,segment){
 const [s,e]=anchors(rig,name),es=sub(e,s);
 if(Math.hypot(...es)<1e-8)throw new Error('Zero length bone: '+name);
 const [a,b]=angles.map(rad);
 if(segment==='upper')return add(s,rot(sub(p,s),a));
 if(segment==='lower')return add(add(s,rot(es,a)),rot(sub(p,e),a+b));
 throw new Error('Unknown rigid segment: '+segment);
}
// Joint/debug compatibility only. Textures are separate upper/lower images;
// never send a triangle spanning the hinge through this classifier.
export function skinPoint(rig,p,name,angles){
 const [s,e]=anchors(rig,name),axis=sub(e,s),v=sub(p,e);
 return rigidPoint(rig,p,name,angles,v[0]*axis[0]+v[1]*axis[1]>0?'lower':'upper');
}
