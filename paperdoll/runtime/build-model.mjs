// Real Iki auto-rigger. Pixels are decoded by Python, not approximated rectangles.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateIkiFromLayerSet } from '@ikijs/editor';
import { parseIkiModel } from '@ikijs/format';
const root=path.dirname(fileURLToPath(import.meta.url));
const input=JSON.parse(fs.readFileSync(path.join(root,'../assets/cutout/iki-inputs.json'),'utf8'));
const model=generateIkiFromLayerSet(input.layers,input.canvas,{rigPlan:{turn:{amount:0.4},eyes:{blink:0.65}}});
model.name='本鲸 · 面部独立层试验';
model.textures=[];
for(const part of model.parts){
 const role=part.id;
 const entry=input.textures[role];
 if(!entry)throw new Error(`Missing texture ${role}`);
 part.texture={index:model.textures.length,uv:{x:0,y:0,width:1,height:1}};
 model.textures.push({source:entry});
}
// Explicit closed-lash artwork supplements the auto-rigger; not claimed as inferred art.
for(const side of ['L','R']){
 const {bbox:[x0,y0,x1,y1],texture}=input.closed[side];
 const index=model.textures.length;
 model.textures.push({source:texture});
 model.parts.push({id:`closed_${side}`,order:model.parts.length,color:[1,1,1,1],
 width:x1-x0,height:y1-y0,transform:{x:(x0+x1)/2-456,y:568-(y0+y1)/2},
 deformer:`eyeWarp_${side}`,texture:{index,uv:{x:0,y:0,width:1,height:1}},
 mesh:{vertices:[-.5,.5,.5,.5,-.5,-.5,.5,-.5],uvs:[0,0,1,0,0,1,1,1],indices:[0,1,2,1,3,2]},
 bindings:Array.from({length:6},()=>({parameter:`ParamEye${side}Open`,channel:'opacity',from:1,to:0}))});
}
// Combined player owns the fixed featureless body; Iki draws ONLY the independent
// eyes and mouth. This prevents a second face/torso hiding the articulated limbs.
model.parts=model.parts.filter(p=>!['face','body'].includes(p.id));
model.name='本鲸 · Cutout + Iki';
const valid=parseIkiModel(model);
fs.writeFileSync(path.join(root,'../assets/cutout/whale.iki'),JSON.stringify(valid));
fs.writeFileSync(path.join(root,'../assets/cutout/iki-report.json'),JSON.stringify({
 generator:'@ikijs/editor generateIkiFromLayerSet',editor:'0.36.0',engine:'0.13.0',
 validation:'parseIkiModel passed',parts:model.parts.map(p=>p.id),parameters:model.parameters,
 limitation:'Face/eye/mouth isolation only. No inferred hand-painted turns or real audio lip-sync. No hair spring claimed.'
},null,2)+'\n');
console.log(`IKI_OK: ${model.parts.length} parts, ${model.parameters.length} parameters`);
