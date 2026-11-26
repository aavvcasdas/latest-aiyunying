"""人工标注部件 + 图片模型遮挡补画 -> 真正独立的 cutout 层。

不宣称自动语义分割。所有部件与 pivot 保留原画布坐标；角色 L/R 按自身定义。
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "paperdoll/assets"
OUT = ASSETS / "cutout"
SIZE = (912, 1136)

POLYS = {
    "arm_R": [(351,522),(329,536),(307,550),(289,554),(276,570),(251,582),(238,602),(224,624),(192,626),(192,650),(181,659),(183,674),(201,682),(216,681),(207,699),(220,704),(246,690),(263,696),(283,679),(301,663),(324,642),(343,617),(360,593),(369,562)],
    "arm_L": [(546,518),(567,531),(581,548),(599,562),(605,575),(630,585),(644,605),(650,630),(669,638),(681,650),(697,661),(701,675),(688,682),(669,685),(656,682),(662,700),(650,708),(632,694),(610,688),(587,675),(565,654),(547,626),(534,598),(530,560)],
    "leg_R": [(350,875),(425,877),(431,927),(426,974),(429,1010),(438,1040),(428,1075),(407,1092),(373,1093),(349,1080),(336,1057),(339,1028),(346,1000),(342,967),(346,932)],
    "leg_L": [(472,874),(537,868),(546,920),(551,958),(547,988),(554,1020),(551,1065),(539,1085),(515,1096),(484,1093),(465,1083),(460,1060),(467,1035),(475,1012),(470,975),(468,939)],
    "eye_R": [(322,339),(339,335),(361,337),(384,346),(397,362),(404,382),(402,403),(389,417),(365,422),(341,413),(326,399),(320,379),(319,357)],
    "eye_L": [(464,325),(483,316),(506,320),(526,328),(539,343),(542,364),(536,385),(522,399),(500,403),(479,399),(466,385),(460,367),(458,345)],
}
JOINTS = {
    "arm_R": {"shoulder": [350,551], "elbow": [294,600], "hand": [216,672]},
    "arm_L": {"shoulder": [550,550], "elbow": [601,607], "hand": [675,677]},
    "leg_R": {"hip": [391,879], "knee": [387,976], "foot": [387,1070]},
    "leg_L": {"hip": [503,880], "knee": [511,973], "foot": [509,1071]},
}


def mask_poly(points, feather=0):
    mask = Image.new("L", SIZE)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def foreground(im):
    a = np.array(im.convert("RGBA"))
    rgb = a[:, :, :3].astype(np.int16)
    near = (rgb.min(2) > 235) & (rgb.max(2) - rgb.min(2) < 18)
    m = np.zeros((SIZE[1] + 2, SIZE[0] + 2), dtype=np.uint8)
    m[1:-1, 1:-1] = np.where(near, 0, 255)
    flood = Image.fromarray(m).copy()
    ImageDraw.floodfill(flood, (0, 0), 128)
    a[np.array(flood)[1:-1, 1:-1] == 128, 3] = 0
    return Image.fromarray(a)


def masked(im, mask):
    result = im.copy()
    result.putalpha(ImageChops.multiply(im.getchannel("A"), mask))
    return result


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(ASSETS / "whale-regenerated.png").convert("RGBA")
    assert source.size == SIZE
    original = foreground(source)
    clean = foreground(Image.open(ASSETS / "whale-cleanplate.png").convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS))
    faceclean = Image.open(ASSETS / "whale-face-cleanplate-v2.png").convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
    # 原画保持不动，仅在手臂遮挡区采用生成图；模型改动的胸前/脸部不接入。
    body = original.copy()
    for name in ("arm_R", "arm_L"):
        hole = mask_poly(POLYS[name]).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1))
        body = Image.composite(clean, body, hole)
        masked(original, mask_poly(POLYS[name])).save(OUT / f"{name}.png")
    # 裙摆保持上层，不让伸腿时带走裙子。隐藏腿根由裙摆遮住。
    for name in ("leg_R", "leg_L"):
        mask = mask_poly(POLYS[name])
        masked(original, mask).save(OUT / f"{name}.png")
        # 裙摆下部以明确 y 边界分离，无水平带假装全身骨骼。
    alpha = np.array(body.getchannel("A"))
    yy, xx = np.mgrid[:SIZE[1], :SIZE[0]]
    alpha[(yy >= 893) & (xx >= 330) & (xx <= 563)] = 0
    body.putalpha(Image.fromarray(alpha))
    body.save(OUT / "body.png")
    original.save(OUT / "original.png")

    # Only install regenerated skin inside the missing-feature masks. All other
    # pixels remain the approved original, including blush, nose and face outline.
    face_base = original.copy()
    feature_mask = Image.new("L", SIZE)
    fd = ImageDraw.Draw(feature_mask)
    for name in ("eye_R", "eye_L"):
        fd.polygon(POLYS[name], fill=255)
    fd.ellipse((417,416,452,442),fill=255)
    feature_mask = feature_mask.filter(ImageFilter.GaussianBlur(2))
    # Match local surrounding skin in each patch rather than globally tinting
    # the face. Generated skin is only used for occluded feature interiors.
    generated = np.array(faceclean).astype(np.float32)
    approved = np.array(original).astype(np.float32)
    # Use the neutral nose bridge, NOT the blush directly below each eye.
    # Sampling cheeks here would turn the entire eye socket into a pink patch.
    reference=approved[379:390,411:420,:3].reshape(-1,3)
    neutral=generated[379:390,411:420,:3].reshape(-1,3)
    delta=np.median(reference,axis=0)-np.median(neutral,axis=0)
    generated[:,:,:3]=np.clip(generated[:,:,:3]+delta,0,255)
    faceclean = Image.fromarray(generated.astype('uint8'))
    face_base = Image.composite(faceclean, original, feature_mask)
    for name in ("eye_R", "eye_L"):
        eye = masked(original, mask_poly(POLYS[name], 0.5))
        pixels = np.array(eye)
        c = pixels[:, :, :3].astype(np.int16)
        skin = (c[:, :, 0] > 170) & (c[:, :, 0] - c[:, :, 1] > 7) & (c[:, :, 0] - c[:, :, 2] > 15)
        pixels[skin, 3] = 0
        # 只留包含眼球的连通组件，去掉切层边缘孤立的皮肤高光小点。
        binary=Image.fromarray(np.where(pixels[:,:,3]>16,255,0).astype('uint8')).copy()
        seed=(360,380) if name=='eye_R' else (499,360)
        ImageDraw.floodfill(binary,seed,128)
        pixels[np.array(binary)!=128,3]=0
        Image.fromarray(pixels).save(OUT / f"{name}.png")
    topmask = Image.new("L", SIZE)
    ImageDraw.Draw(topmask).rectangle((0,0,SIZE[0],480),fill=255)
    masked(face_base, topmask).save(OUT / "face.png")
    bottom = original.copy()
    ba = np.array(bottom.getchannel("A"))
    ba[:474] = 0
    bottom.putalpha(Image.fromarray(ba))
    bottom.save(OUT / "portrait_body.png")
    mouth = Image.new("RGBA",SIZE)
    d=ImageDraw.Draw(mouth)
    d.arc((428,423,442,430),0,180,fill=(103,57,67,255),width=2)
    mouth.save(OUT / "mouth.png")
    opened=Image.new("RGBA",SIZE)
    d=ImageDraw.Draw(opened)
    d.ellipse((424,420,448,443),fill=(113,47,66,255),outline=(96,42,60,255),width=2)
    d.ellipse((429,434,444,443),fill=(238,143,163,255))
    opened.save(OUT / "mouth_open.png")
    # 显式闭眼线层，避免 eye mesh 完全折叠时脸上像缺了眼睛。
    for side, points in {
        "R": [(326,384),(339,390),(353,393),(367,394),(382,391),(396,385)],
        "L": [(465,367),(478,375),(492,378),(507,377),(521,372),(534,365)],
    }.items():
        line = Image.new("RGBA", (SIZE[0]*3,SIZE[1]*3))
        ld=ImageDraw.Draw(line)
        ld.line([(x*3,y*3) for x,y in points],fill=(65,38,47,255),width=8,joint='curve')
        ld.line([(points[0][0]*3,points[0][1]*3),(points[0][0]*3-10,points[0][1]*3-7)],fill=(65,38,47,255),width=6)
        line.resize(SIZE,Image.Resampling.LANCZOS).save(OUT / f"closed_{side}.png")
    # Separate rigid textures. A circular overlap at the elbow/knee covers the
    # hinge without ever stretching or blending the artwork along a bone.
    yy,xx=np.mgrid[:SIZE[1],:SIZE[0]]
    for name,j in JOINTS.items():
        keys=('shoulder','elbow','hand') if name.startswith('arm') else ('hip','knee','foot')
        s,e,h=(np.array(j[k],float) for k in keys)
        axis=(e-s)/np.linalg.norm(e-s)
        progress=(xx-e[0])*axis[0]+(yy-e[1])*axis[1]
        radius=24 if name.startswith('arm') else 29
        circle=(xx-e[0])**2+(yy-e[1])**2<=radius**2
        part=Image.open(OUT/f'{name}.png').convert('RGBA')
        for seg,keep in [('upper',(progress<=0)|circle),('lower',(progress>=0)|circle)]:
            a=np.array(part)
            a[~keep,3]=0
            Image.fromarray(a).save(OUT/f'{name}_{seg}.png')
    # Face and torso in the combined cutout must NEVER contain baked features.
    body=Image.open(OUT/'body.png').convert('RGBA')
    body=Image.composite(face_base,body,feature_mask)
    body.save(OUT/'body.png')
    # A featureless template base with no baked hands; layer positions use the
    # same 912x1136 coordinates. Eyes/mouth/hands are real transparent images.
    base=body.copy()
    base.alpha_composite(Image.open(OUT/'leg_R.png'))
    base.alpha_composite(Image.open(OUT/'leg_L.png'))
    base.save(OUT/'template_base.png')
    eyes=Image.new('RGBA',SIZE)
    eyes.alpha_composite(Image.open(OUT/'eye_R.png'));eyes.alpha_composite(Image.open(OUT/'eye_L.png'))
    eyes.save(OUT/'eyes.png')
    hands=Image.new('RGBA',SIZE)
    hands.alpha_composite(Image.open(OUT/'arm_R.png'));hands.alpha_composite(Image.open(OUT/'arm_L.png'))
    hands.save(OUT/'hands.png')
    # 清空全透明区域的 RGB：减少体积，也避免采样到原画隐形脏边。
    for path in OUT.glob('*.png'):
        rgba=np.array(Image.open(path).convert('RGBA'))
        rgba[rgba[:,:,3] == 0, :3] = 0
        Image.fromarray(rgba).save(path,optimize=True)
    manifest={"canvas":list(SIZE),"annotation":"manual polygons, not automatic segmentation", "handedness":"character own left/right", "joints":JOINTS, "polygons":POLYS,
              "cutout_renderer":"rigid upper/lower segment rotation with circular overlapping joint caps; Iki face composited on same source canvas", "root_motion":"fixed; no whole-image oscillation", "source_sha256":hashlib.sha256((ASSETS/'whale-regenerated.png').read_bytes()).hexdigest(),"layers":{p.stem:p.name for p in sorted(OUT.glob('*.png'))}}
    (OUT / "rig.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    provenance_path=ASSETS/'cutout-provenance.json'
    if provenance_path.exists():
        record=json.loads(provenance_path.read_text())
        for filename in record['sources']:
            data=(ASSETS/filename).read_bytes()
            record['sources'][filename]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
        record['parts']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.glob('*.png'))}
        provenance_path.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print(OUT)


if __name__ == "__main__":
    main()
