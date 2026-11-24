from __future__ import annotations
import base64, json, math
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
REF = ROOT/'通用模板/cast/source/whale_redraw_refs'
OUT = Path(__file__).resolve().parent / 'whale_sprites.json'
PREVIEW = ROOT/'docs/quality_comparison/whale_redraw'
PREVIEW.mkdir(parents=True, exist_ok=True)
pal = json.loads((ROOT / 'docs/quality_comparison/whale_redraw/whale_palette.json').read_text())
RGB = [tuple(c) for c in pal['RGB']]
T = pal['T']
OLD_ATLAS = Image.open(ROOT / 'docs/quality_comparison/whale_redraw/cast_atlas.before.png').convert('RGBA')
OLD_RECTS = json.loads((ROOT / '通用模板/engine/assets/cast_atlas.json').read_text(encoding='utf-8'))['s']
cache = {}

def nearest(rgb):
    if rgb in cache: return cache[rgb]
    r,g,b = rgb
    best = min(range(len(RGB)), key=lambda i: (RGB[i][0]-r)**2 + (RGB[i][1]-g)**2 + (RGB[i][2]-b)**2)
    cache[rgb] = best
    return best

def harden(im):
    """Indexed-color sprites stay hard-alpha; master_soft adds a 1px edge in bake_atlas."""
    im = im.convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    im.putalpha(a)
    return im

def trim(im, pad=2):
    bb = im.getchannel('A').getbbox()
    if not bb: return im
    x0,y0,x1,y1 = bb
    return im.crop((max(0,x0-pad), max(0,y0-pad), min(im.width,x1+pad), min(im.height,y1+pad)))

def fit(im, w, h, pad=2, resample=Image.Resampling.LANCZOS):
    im = harden(trim(im, 0))
    maxw, maxh = w-2*pad, h-2*pad
    scale = min(maxw/im.width, maxh/im.height)
    nw, nh = max(1, round(im.width*scale)), max(1, round(im.height*scale))
    small = im.resize((nw,nh), resample)
    small = harden(small)
    out = Image.new('RGBA',(w,h),(0,0,0,0))
    out.alpha_composite(small,((w-nw)//2,(h-nh)//2))
    return harden(out)

# Central apron / hem / leg region. The user asked for the plainer pre-redraw
# clothes, so every front-facing base sprite takes this exact lower-body patch
# from cast_atlas.before.png after fitting. The derived action baker no longer
# freezes this region: pose() may move skirt and legs naturally.
CLOTHES_BOX = (0.18, 0.58, 0.82, 1.0)

def _clothes_box(w, h):
    return (int(w * CLOTHES_BOX[0]), int(h * CLOTHES_BOX[1]),
            int(w * CLOTHES_BOX[2]), int(h * CLOTHES_BOX[3]))

def _old_lower_patch(source_key, w, h):
    x, y, ow, oh = OLD_RECTS[source_key]
    cell = OLD_ATLAS.crop((x, y, x + ow, y + oh))
    sx0, sy0, sx1, sy1 = _clothes_box(ow, oh)
    patch = cell.crop((sx0, sy0, sx1, sy1))
    tx0, ty0, tx1, ty1 = _clothes_box(w, h)
    return patch.resize((tx1 - tx0, ty1 - ty0), Image.Resampling.NEAREST)

def fit_with_old_clothes(im, w, h, source_key='whale_idle', pad=2):
    """Fit a front-facing base, then restore the old plain lower-body art."""
    out = fit(im, w, h, pad=pad)
    box = _clothes_box(w, h)
    # paste() also replaces alpha: V2 hem / decorative swirls cannot survive.
    out.paste(_old_lower_patch(source_key, w, h), (box[0], box[1]))
    return harden(out)

def quantize(im):
    im = harden(im)
    px = im.load()
    d = []
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a = px[x,y]
            d.append(T if a < 128 else nearest((r,g,b)))
    return d

def rle_encode(d):
    out=[]; i=0; n=len(d)
    while i<n:
        j=i+1
        while j<n and d[j]==d[i]: j+=1
        run=j-i; val=d[i]
        if val != 254 and run >= 4:
            while run>0:
                r=min(255,run)
                out.extend([254,r,val]); run-=r
        else:
            out.extend([val]*run)
        i=j
    return base64.b64encode(bytes(out)).decode('ascii')

def record(im,w,h):
    d=quantize(im)
    assert len(d)==w*h
    return [w,h,rle_encode(d)]

def img(name):
    return Image.open(REF/f'whale_{name}_clean.png').convert('RGBA')

front, blink, wave, point, side = [img(n) for n in ['front','blink','wave','point','side']]

# face / portraits ---------------------------------------------------------
def face_crop(base):
    b = harden(trim(base,0))
    w,h=b.size
    # head + bonnet + shoulders; top ~58%
    crop = b.crop((int(w*0.16), 0, int(w*0.84), int(h*0.58)))
    return crop

def portrait(base, expression):
    c = face_crop(base)
    if expression == 'shout':
        d=ImageDraw.Draw(c)
        w,h=c.size
        # small open mouth, dark navy
        d.ellipse((int(w*0.47),int(h*0.62),int(w*0.55),int(h*0.72)), fill=(38,32,60,255))
    elif expression == 'think':
        d=ImageDraw.Draw(c)
        w,h=c.size
        # tiny hand near chin
        d.ellipse((int(w*0.62),int(h*0.66),int(w*0.72),int(h*0.78)), fill=(242,221,209,255))
    return fit(c,64,64,pad=1)

# walk variants ------------------------------------------------------------
# Rhythm reference: boot centroids and tail bob in the eight pre-redraw
# walk_whale_* atlas cells. Only the *phase* is borrowed; every opaque pixel
# below still comes from the current blue-haired side clean art.
LEG_TARGETS_L = [34, 34, 31, 33, 38, 33, 32, 38]
LEG_TARGETS_R = [58, 59, 62, 60, 48, 58, 60, 50]
TAIL_PHASE_Y = [1, 0, 0, 0, 1, 2, 0, 3]


def _scaled_box(box, w, h):
    x0, y0, x1, y1 = box
    sx, sy = w / 90, h / 88
    return (max(0, round(x0 * sx)), max(0, round(y0 * sy)),
            min(w, round(x1 * sx)), min(h, round(y1 * sy)))


def _dilate_bits(bits, w, h):
    """One 8-neighbor dilation so borrowed limb halves stay attached."""
    out = bytearray(bits)
    for y in range(h):
        for x in range(w):
            if not bits[y * w + x]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                           (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    out[ny * w + nx] = 1
    return out


def _largest_components(bits, w, h, n=1, min_area=1):
    """Keep the n biggest 8-connected blobs; drops detached hem / specks."""
    seen = bytearray(w * h)
    comps = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not bits[i] or seen[i]:
                continue
            q = deque([(x, y)])
            seen[i] = 1
            pts = []
            while q:
                cx, cy = q.popleft()
                pts.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1),
                               (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if bits[j] and not seen[j]:
                            seen[j] = 1
                            q.append((nx, ny))
            comps.append(pts)
    comps = [c for c in comps if len(c) >= min_area]
    comps.sort(key=len, reverse=True)
    out = bytearray(w * h)
    for pts in comps[:n]:
        for x, y in pts:
            out[y * w + x] = 1
    return out


def _mask_patch(im, box, kind):
    """Extract a hard-alpha limb/tail/hand patch from the current side sprite."""
    crop = im.crop(box)
    cw, ch = crop.size
    out = Image.new('RGBA', crop.size, (0, 0, 0, 0))
    src, dst = crop.load(), out.load()
    bits = bytearray(cw * ch)
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = src[x, y]
            if a < 128:
                continue
            if kind == 'leg':
                if r + g + b < 330 and r < 130:
                    bits[y * cw + x] = 1
            elif kind == 'tail':
                if (b > 75 and b >= r and b >= g) or (r + g + b < 210 and b >= r - 10):
                    bits[y * cw + x] = 1
            elif kind == 'arm':
                # white cuff + skin hand; dark dress/hair stays in the body layer
                if r + g + b > 330 and r > 130 and g > 90:
                    bits[y * cw + x] = 1
            else:
                bits[y * cw + x] = 1
    if kind in ('leg', 'tail'):
        bits = _largest_components(bits, cw, ch, 1)
    for y in range(ch):
        for x in range(cw):
            if bits[y * cw + x]:
                dst[x, y] = src[x, y]
    return out


def _erase_patch(base, patch, x0, y0):
    px, pp = base.load(), patch.load()
    for y in range(patch.height):
        for x in range(patch.width):
            if pp[x, y][3] < 128:
                continue
            X, Y = x0 + x, y0 + y
            if 0 <= X < base.width and 0 <= Y < base.height:
                px[X, Y] = (0, 0, 0, 0)


def _dominant_color(im):
    counts = {}
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a >= 128:
                key = (r, g, b)
                counts[key] = counts.get(key, 0) + 1
    return max(counts, key=counts.get) if counts else (40, 40, 60)


def _bits_image(bits, w, h):
    im = Image.new('L', (w, h), 0)
    im.putdata([255 if v else 0 for v in bits])
    return im


def _colorize_mask(mask, source):
    """Fill a binary old-walk silhouette with colors from the current art."""
    bb = mask.getbbox()
    out = Image.new('RGBA', mask.size, (0, 0, 0, 0))
    if not bb:
        return out
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    res = source.resize((bw, bh), Image.Resampling.NEAREST)
    fallback = _dominant_color(source)
    mp, rp, op = mask.load(), res.load(), out.load()
    for y in range(bb[1], bb[3]):
        for x in range(bb[0], bb[2]):
            if mp[x, y] < 128:
                continue
            p = rp[x - bb[0], y - bb[1]]
            if p[3] < 128:
                p = (*fallback, 255)
            op[x, y] = p
    return out


def _old_mask_bits(i, kind, w, h):
    """Borrow only the limb/tail *silhouette* from a pre-redraw walk frame."""
    x, y, ow, oh = OLD_RECTS[f'walk_whale_{i}']
    old = OLD_ATLAS.crop((x, y, x + ow, y + oh)).resize((w, h), Image.Resampling.NEAREST)
    px = old.load()
    bits = bytearray(w * h)
    leg_y, tail_y, arm_y0, arm_y1 = [round(h * v / 88) for v in (68, 50, 38, 70)]
    tail_x, arm_x = round(w * 45 / 90), round(w * 35 / 90)
    leg_x = round(w * 20 / 90)
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            if a < 128:
                continue
            # The old side-walk tail swept to the left; the current blue-haired
            # side model has its tail on the right, so discard that fragment.
            if kind == 'leg' and xx < leg_x:
                continue
            if kind == 'leg' and yy >= leg_y and r + g + b < 300 and r < 120:
                bits[yy * w + xx] = 1
            elif kind == 'tail' and xx >= tail_x and yy >= tail_y and (
                (b > 75 and b >= r and b >= g) or (r + g + b < 210 and b >= r - 10)):
                bits[yy * w + xx] = 1
            elif kind == 'arm' and arm_y0 <= yy < arm_y1 and xx >= arm_x and (
                r + g + b > 330 and r > 150 and g > 110 and b > 90):
                bits[yy * w + xx] = 1
    if kind in ('leg', 'tail'):
        bits = _dilate_bits(bits, w, h)
    return _largest_components(bits, w, h,
                               2 if kind in ('leg', 'tail') else 1,
                               60 if kind in ('leg', 'tail') else 1)


def _old_walk_layer(i, kind, source, w, h):
    bits = _old_mask_bits(i, kind, w, h)
    return _colorize_mask(_bits_image(bits, w, h), source)


def _shear_x(patch, top_dx, bottom_dx):
    out = Image.new('RGBA', patch.size, (0, 0, 0, 0))
    src, dst = patch.load(), out.load()
    ph = max(1, patch.height - 1)
    for y in range(patch.height):
        shift = round(top_dx + (bottom_dx - top_dx) * y / ph)
        for x in range(patch.width):
            sx = x - shift
            if 0 <= sx < patch.width:
                dst[x, y] = src[sx, y]
    return out


def _alpha_centroid(patch):
    px = patch.load()
    sx = sy = n = 0
    for y in range(patch.height):
        for x in range(patch.width):
            if px[x, y][3] >= 128:
                sx += x; sy += y; n += 1
    return (sx / n, sy / n) if n else (patch.width / 2, patch.height / 2)


def _transform_rows(im, dx_top, dx_mid, dy_top, dy_mid, split1, split2):
    """Move head / shoulders / skirt together while the feet stay phase-independent."""
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    src, dst = im.load(), out.load()
    for y in range(im.height):
        dx, dy = (dx_top, dy_top) if y < split1 else ((dx_mid, dy_mid) if y < split2 else (0, 0))
        for x in range(im.width):
            sx, sy = x - dx, y - dy
            if 0 <= sx < im.width and 0 <= sy < im.height:
                dst[x, y] = src[sx, sy]
    return out


def walk_variant(base, i, w, h):
    """Eight-frame side walk with independent arm / leg / tail rhythm.

    The rejected row-shift walk read as one rigid sprite sliding. Here the
    current blue-haired side model keeps its head, hair, face, apron and
    upper body. Only the lower-body limb/tail *silhouettes* are borrowed from
    the eight pre-redraw walk cells, then re-colored with pixels sampled from
    the current side clean art. The cuff/hand swings with the upper body.
    """
    im = harden(fit(base, w, h, pad=3))
    phase = i / 8 * 2 * math.pi
    sx, sy = w / 90, h / 88
    bob = round(1.2 * math.sin(2 * phase) * sy)
    arm_dx = round(1.8 * math.sin(phase) * sx)
    split1, split2 = int(h * 0.52), int(h * 0.72)
    body = _transform_rows(im, arm_dx, arm_dx // 2, -bob, -bob // 2, split1, split2)

    leg_box = _scaled_box((24, 68, 70, 88), w, h)
    tail_box = _scaled_box((52, 52, 82, 88), w, h)
    arm_box = _scaled_box((36, 56, 48, 68), w, h)
    leg_src = _mask_patch(im, leg_box, 'leg')
    tail_src = _mask_patch(im, tail_box, 'tail')
    arm_patch = _mask_patch(im, arm_box, 'arm')

    # Remove only the static lower limbs / tail / hand; the connected upper
    # body and apron remain exactly the current blue-haired side model.
    _erase_patch(body, arm_patch, arm_box[0], arm_box[1])
    d = ImageDraw.Draw(body)
    d.rectangle(leg_box, fill=(0, 0, 0, 0))
    d.rectangle(tail_box, fill=(0, 0, 0, 0))

    tail_layer = _old_walk_layer(i, 'tail', tail_src, w, h)
    leg_layer = _old_walk_layer(i, 'leg', leg_src, w, h)
    body.paste(tail_layer, (0, 0), tail_layer)
    body.paste(leg_layer, (0, 0), leg_layer)
    arm_shift = round(arm_dx * 3)
    body.paste(arm_patch, (arm_box[0] + arm_shift,
                           arm_box[1] + round(bob * 0.5)), arm_patch)
    return harden(body)

# base sprites -------------------------------------------------------------
sprites = {}
def add(key, im, w, h):
    sprites[key] = record(im,w,h)

add('whale_idle', fit_with_old_clothes(front,78,88), 78,88)
add('whale_blink', fit_with_old_clothes(blink,78,88), 78,88)
# 2026-11-24 回退：挥手 / 递出去恢复「加裙子固定之前」的 f23… 状态——
# 旧参考格手臂姿势 + 那一版自己的裙摆，不贴旧下半身补丁（其它基础格不变）。
add('whale_wave', fit(wave,78,88), 78,88)
add('whale_point', fit(point,77,88), 77,88)
add('whale_side', fit(side,78,88), 78,88)
add('whale_big_idle', fit_with_old_clothes(front,131,148,'whale_big_idle'), 131,148)
add('whale_big_blink', fit_with_old_clothes(blink,131,148,'whale_big_idle'), 131,148)
add('whale_big_wave', fit(wave,131,148), 131,148)
add('whale_big_point', fit(point,130,148), 130,148)
add('p_whale_neutral', portrait(front,'neutral'), 64,64)
add('p_whale_shout', portrait(front,'shout'), 64,64)
add('p_whale_think', portrait(blink,'think'), 64,64)

# legacy helper sprites (not in atlas, but still whale "images")
walk_sizes = [(77,88),(84,88),(76,88),(84,88)]
map_sizes  = [(49,56),(54,56),(48,56),(53,56)]
for i,(w,h) in enumerate(walk_sizes):
    add(f'whale_walk_{i}', walk_variant(side,i,w,h), w,h)
for i,(w,h) in enumerate(map_sizes):
    base = front if i%2==0 else side
    im = fit_with_old_clothes(base,w,h,pad=1) if i%2==0 else fit(base,w,h,pad=1)
    add(f'whale_map_{i}', im, w,h)
add('whale_map_pt', fit(point,49,56,pad=1), 49,56)

# eight atlas walk frames
walk_frames = {}
for i in range(8):
    key=f'walk_whale_{i}'
    im=walk_variant(side,i,90,88)
    walk_frames[key]=record(im,90,88)
    sprites[key]=walk_frames[key]

OUT.write_text(json.dumps({'sprites':sprites,'walk':walk_frames},ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
print('sprites',len(sprites),'walk',len(walk_frames),'->',OUT)

# preview contact sheet of base + walk + portraits
from PIL import ImageFont
keys=['whale_idle','whale_blink','whale_wave','whale_point','whale_side','whale_big_idle','p_whale_neutral','p_whale_shout','p_whale_think']+[f'walk_whale_{i}' for i in range(8)]
cellw,cellh=180,190; cols=6; rows=math.ceil(len(keys)/cols)
sheet=Image.new('RGB',(cols*cellw,rows*cellh),(10,10,18)); dr=ImageDraw.Draw(sheet)
for idx,k in enumerate(keys):
    w,h,b64=sprites[k]
    # decode back to RGBA using palette for preview
    raw=base64.b64decode(b64); d=[]; p=0
    while p<len(raw):
        b=raw[p]
        if b==254:
            run=raw[p+1]; val=raw[p+2]; d.extend([val]*run); p+=3
        else:
            d.append(b); p+=1
    im=Image.new('RGBA',(w,h),(0,0,0,0)); px=im.load()
    for y in range(h):
        for x in range(w):
            v=d[y*w+x]
            if v!=T: px[x,y]=(*RGB[v],255)
    scale=min((cellw-12)/w,(cellh-32)/h)
    t=im.resize((max(1,int(w*scale)),max(1,int(h*scale))),Image.Resampling.NEAREST)
    bg=Image.new('RGBA',(cellw-8,cellh-28),(22,22,36,255))
    bg.alpha_composite(t,((bg.width-t.width)//2,(bg.height-t.height)//2))
    ox=(idx%cols)*cellw+4; oy=(idx//cols)*cellh+22
    sheet.paste(bg.convert('RGB'),(ox,oy))
    dr.text((ox,(idx//cols)*cellh+4),k,fill=(230,220,200))
sheet.save(PREVIEW/'new_base_walk_preview.png')
print('preview',PREVIEW/'new_base_walk_preview.png',sheet.size)
