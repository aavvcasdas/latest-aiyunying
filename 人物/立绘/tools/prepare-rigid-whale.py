"""Rebind the approved whale to THREE rigid textures per limb.

Source files / generation provenance remain under paperdoll/assets. This tool
only cuts/copies pixels; it does not generate art or stretch a limb. The template
runtime consumes its own engine/assets/rigid/whale files, not paperdoll JS.
"""
from pathlib import Path
import json
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'paperdoll/assets/cutout'
OUT=ROOT/'通用模板/engine/assets/rigid/whale'
CHAINS={
    'arm_R':{'root':[350,551],'joint':[294,600],'end':[250,658],'tip':[216,672]},
    'arm_L':{'root':[550,550],'joint':[601,607],'end':[641,663],'tip':[675,677]},
    'leg_R':{'root':[391,879],'joint':[388,939],'end':[388,1000],'tip':[387,1070]},
    'leg_L':{'root':[503,880],'joint':[509,938],'end':[507,1000],'tip':[509,1071]},
}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    files={}
    yy,xx=np.mgrid[:1136,:912]
    for name,c in CHAINS.items():
        with Image.open(SRC/f'{name}.png') as im:
            rgba=np.array(im.convert('RGBA'))
        s,e,w=(np.array(c[k],float) for k in ['root','joint','end'])
        a=(e-s)/np.linalg.norm(e-s);b=(w-e)/np.linalg.norm(w-e)
        elbow=(xx-e[0])*a[0]+(yy-e[1])*a[1]
        wrist=(xx-w[0])*b[0]+(yy-w[1])*b[1]
        arm=name.startswith('arm')
        # End caps are locally repainted onto their OWN rigid piece, not copied
        # from both sides of a bent sleeve and not stretched across the hinge.
        radius=31 if arm else 26
        elbow_cap=(xx-e[0])**2+(yy-e[1])**2<radius**2
        wrist_cap=(xx-w[0])**2+(yy-w[1])**2<(10 if arm else 16)**2
        masks={
            'upper':elbow<=0,
            'lower':(elbow>=0)&((wrist<=0)|wrist_cap),
            'end':(wrist>=-8)|wrist_cap,
        }
        if arm:
            # Torso apron/lace accidentally enclosed by the old arm polygon is
            # NOT sleeve art. Keep white cuff only near the actual wrist.
            white=(rgba[:,:,:3].min(2)>175)&(wrist < -22)
            rgba[white,3]=0
        if not arm:
            rgba[yy<894,3]=0  # skirt ruffles must stay on torso, never on thigh
            masks['end']=(yy>=990)|wrist_cap
            masks['lower'] &= yy<=1010
        # Median source textile / skin values, sampled away from drawn outlines.
        sample=rgba[int(e[1])-8:int(e[1])+8,int(e[0])-8:int(e[0])+8]
        valid=sample[sample[:,:,3]>200,:3]
        color=tuple(np.median(valid,axis=0).astype('uint8')) if len(valid) else ((42,50,91) if arm else (255,234,226))
        for segment,mask in masks.items():
            out=rgba.copy();out[~mask,3]=0;out[out[:,:,3]==0,:3]=0
            patch=Image.new('RGBA',(912,1136))
            draw=ImageDraw.Draw(patch)
            if segment in ('upper','lower'):
                draw.ellipse((e[0]-radius,e[1]-radius,e[0]+radius,e[1]+radius),fill=(*color,255))
            if segment=='upper':
                root_color=(38,46,85,255) if arm else (*color,255)
                r=24 if arm else 23
                draw.ellipse((s[0]-r,s[1]-r,s[0]+r,s[1]+r),fill=root_color)
            if segment in ('lower','end'):
                r=10 if arm else 15
                cuff=(246,239,246,255) if not arm else (250,234,229,255)
                draw.ellipse((w[0]-r,w[1]-r,w[0]+r,w[1]+r),fill=cuff)
            patch.alpha_composite(Image.fromarray(out))
            key=f'{name}_{segment}';files[key]=key+'.png'
            patch.save(OUT/files[key],optimize=True)
    # Local regeneration repairs the uncovered hair and missing tail. Preserve
    # the already-approved featureless face and all unoccluded costume pixels.
    import sys
    sys.path.insert(0,str(ROOT/'paperdoll/tools'))
    from prepare_cutout import foreground, mask_poly, POLYS
    clean=foreground(Image.open(OUT/'body-cleanplate-source.png').convert('RGBA').resize((912,1136),Image.Resampling.LANCZOS))
    body=Image.open(SRC/'body.png').convert('RGBA')
    for name in ['arm_R','arm_L']:
        hole=mask_poly(POLYS[name]).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(1))
        hole_pixels=np.array(hole);hole_pixels[:530]=0
        body=Image.composite(clean,body,Image.fromarray(hole_pixels))
    tail_hole=Image.new('L',(912,1136))
    ImageDraw.Draw(tail_hole).rectangle((326,893,567,1110),fill=255)
    body=Image.composite(clean,body,tail_hole)
    body.save(OUT/'body.png',optimize=True)
    files['body']='body.png'
    for name in ['eye_R','eye_L']:
        with Image.open(SRC/f'{name}.png') as im:im.save(OUT/f'{name}.png',optimize=True)
        files[name]=name+'.png'
    bind={'w':912,'h':1136,'ground':1095,'face':{'eyes':{'R':[318,329,89,96],'L':[457,309,91,98]},'mouth':[436,430]},'chains':CHAINS,'files':files}
    (OUT/'bind.json').write_text(json.dumps(bind,ensure_ascii=False,indent=2)+'\n')
    record={'source':'paperdoll/assets/cutout-provenance.json','generator':'人物/立绘/tools/prepare-rigid-whale.py',
            'method':'manual three-link alpha cuts and locally painted rigid joint caps; generated limb-free body patch only, limbs never resampled or stretched',
            'generation':{'asset':'body-cleanplate-source.png','model':'unknown','version':'unknown','seed':'unknown','purpose':'remove all old limbs; reconstruct hair and tail behind them; not video generation'},
            'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.glob('*.png'))}}
    (OUT/'provenance.json').write_text(json.dumps(record,indent=2)+'\n')
    print('RIGID_BIND_OK',OUT)

if __name__=='__main__':main()
