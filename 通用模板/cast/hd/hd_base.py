"""基础格：去抠图残留（白边）→ 走路帧补墨线 → 导出高清基础格。

原补丁的做法是「去残留 + 颜色外扩 + Real-ESRGAN 4 倍超分」。这一版把它拆开、并且加了开关：

  1 倍基础格（图集里 alpha 只有 0/255）
    → 去残留（fringe_mask / halo_band：只动「比里面亮、朝白色偏、往里又找不到相近颜色」的像素）
    → 走路帧补墨线（这些格子烘焙时没加 1 像素 #181425 描边，站立切走路时描边会消失）
    → 放大：默认 scale=2 的像素艺术放大（保留像素块，放大后仍是锐利边缘）；scale=4 且装了
      onnxruntime + Real-ESRGAN 权重时才走模型超分（同一套去残留结果，模型只负责放大）
    → 颜色外扩（轮廓外 12 圈透明像素的 RGB，透明区不再是黑的，任何过滤都不会带出黑边 / 白边）

用法：
    python3 通用模板/cast/hd/hd_base.py                 # 全部基础格，2 倍，出 人物/q版HD_2x/
    python3 通用模板/cast/hd/hd_base.py --scale 4       # 4 倍（要 sr.py 的模型与权重）
    python3 通用模板/cast/hd/hd_base.py whale_idle ...  # 只做这几格
    python3 通用模板/cast/hd/hd_base.py --report        # 只量残留数量，不写图（核对白边用）

依赖：numpy、pillow（模型超分另需 onnx、onnxruntime）。输出目录：
    人物/q版HD_2x/base/*.png、base_meta.json、base_report.json   （scale=2，默认，入库）
    人物/q版HD/base/*.png …                                     （scale=4，按需，不入库）
"""
import json, os, sys, time
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get('REPO', os.path.abspath(os.path.join(HERE, '../../..')))

INK = np.array([24, 20, 37])   # 每格最外圈烘焙进去的 1 像素墨线 #181425
LUM = np.array([0.299, 0.587, 0.114])


def shifts(m, r=1, diag=True):
    """把 m 按邻居偏移各 yield 一份（零填充）"""
    H, W = m.shape[:2]
    p = np.pad(m, ((r, r), (r, r)) + ((0, 0),) * (m.ndim - 2))
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dy == 0 and dx == 0:
                continue
            if not diag and dy != 0 and dx != 0:
                continue
            yield p[r + dy:r + dy + H, r + dx:r + dx + W]


def edge_dist(op, levels=3):
    """1 = 贴着透明区（4 邻域），2 = 再往里一圈，…，levels+1 = 更深"""
    d = np.zeros(op.shape, np.uint8)
    cur = op.copy()
    for level in range(1, levels + 1):
        nb_all = np.ones_like(op)
        for s in shifts(cur, 1, diag=False):
            nb_all &= s
        ring = cur & ~nb_all
        d[ring] = level
        cur = cur & nb_all
    d[cur] = levels + 1
    return d


def fringe_mask(a, thr=18.0):
    """抠图残留：墨线内侧那一圈（没有墨线的格是轮廓本身）里，比里面亮、朝白偏、且往里找不到相近颜色的像素。
    真的浅色细节（蕾丝、围裙、手、浅色发梢）有 ≥2 像素厚，会被 support 认出来、不动。"""
    op = a[..., 3] > 0
    d = edge_dist(op, 3)
    rgb = a[..., :3].astype(np.float32)
    ink = op & (np.abs(rgb - INK).sum(-1) < 6)
    outline = (d == 1) & ink
    near_outline = np.zeros(op.shape, bool)
    for s_ in shifts(outline, 1, diag=True):
        near_outline |= s_
    out = np.zeros(op.shape, bool)
    Fout = np.zeros_like(rgb)
    for ring, cand in ((1, (d == 1) & ~ink), (2, (d == 2) & near_outline & ~ink), (3, (d == 3) & ~ink)):
        deep = (d > ring) & ~ink
        num1 = np.zeros_like(rgb); c1 = np.zeros(op.shape, np.float32)
        num2 = np.zeros_like(rgb); c2 = np.zeros(op.shape, np.float32)
        support = np.zeros(op.shape, bool)
        for sm, sc in zip(shifts(deep, 1), shifts(rgb, 1)):
            num1 += sc * sm[..., None]; c1 += sm
        for sm, sc in zip(shifts(deep, 2), shifts(rgb, 2)):
            num2 += sc * sm[..., None]; c2 += sm
            support |= sm & (np.abs(sc - rgb).sum(-1) < 54)
        F = np.where((c1 > 0)[..., None], num1 / np.maximum(c1, 1)[..., None], num2 / np.maximum(c2, 1)[..., None])
        WF = 255.0 - F
        n2 = (WF * WF).sum(-1)
        t = ((rgb - F) * WF).sum(-1) / np.maximum(n2, 1)
        res = np.linalg.norm(rgb - F - t[..., None] * WF, axis=-1)
        k = 1.0 if ring < 3 else 1.6        # 第三圈只在明显是残留时才动
        fr = cand & (c2 > 0) & ~support & ((rgb @ LUM) - (F @ LUM) > thr * k) & (n2 > 90 * 90) & (t > 0.1 * k) & (res < 34)
        if ring == 3:                        # 第三圈只接着第二圈已经认出来的残留往里走
            adj = np.zeros(op.shape, bool)
            for s_ in shifts(out, 1, diag=False):
                adj |= s_
            fr &= adj
        out |= fr
        Fout[fr] = F[fr]
    return out, Fout


def halo_band(a):
    """整圈发白的光晕（墨线下面 1–3 像素宽、几乎全白的一圈）。只在这种帧上开火：
    墨线下那一圈比核心亮很多。"""
    op = a[..., 3] > 0
    d = edge_dist(op, 4)
    rgb = a[..., :3].astype(np.float32)
    lum = rgb @ LUM
    ink = op & (np.abs(rgb - INK).sum(-1) < 6)
    nonink = op & ~ink
    r2 = nonink & (d == 2)
    core = nonink & (d >= 4)
    none = np.zeros(op.shape, bool)
    if r2.sum() < 20 or core.sum() < 20:
        return none, 0.0
    gap = float(np.median(lum[r2]) - np.median(lum[core]))
    if not (np.median(lum[r2]) > 150 and gap > 60):
        return none, gap
    num = np.zeros_like(rgb); cnt = np.zeros(op.shape, np.float32); support = np.zeros(op.shape, bool)
    for sm, sc in zip(shifts(core, 3), shifts(rgb, 3)):
        num += sc * sm[..., None]; cnt += sm
        support |= sm & (np.abs(sc - rgb).sum(-1) < 60)
    F = num / np.maximum(cnt, 1)[..., None]
    WF = 255.0 - F
    n2 = (WF * WF).sum(-1)
    t = ((rgb - F) * WF).sum(-1) / np.maximum(n2, 1)
    res = np.linalg.norm(rgb - F - t[..., None] * WF, axis=-1)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = (R > 200) & (R - B > 28) & (G - B > 8)
    m = nonink & (d <= 3) & (cnt > 0) & ~support & ~skin & (lum - F @ LUM > 45) & (t > 0.35) & (res < 40) & (n2 > 90 * 90)
    return m, gap


def inward_fill(a, m):
    """把被判定为残留的像素，用最近的、保留下来的像素颜色从里往外重上色（轮廓不动）"""
    rgb = a[..., :3].astype(np.float32)
    op = a[..., 3] > 0
    ink = op & (np.abs(rgb - INK).sum(-1) < 6)
    good = op & ~ink & ~m
    todo = m.copy()
    for _ in range(6):
        if not todo.any():
            break
        num = np.zeros_like(rgb); cnt = np.zeros(op.shape, np.float32)
        for sm, sc in zip(shifts(good, 1), shifts(rgb, 1)):
            num += sc * sm[..., None]; cnt += sm
        new = todo & (cnt > 0)
        rgb[new] = num[new] / cnt[new][:, None]
        good |= new
        todo &= ~new
    out = a.copy()
    out[..., :3] = np.clip(rgb + 0.5, 0, 255).astype(np.uint8)
    return out


def defringe(a):
    dbg = np.zeros(a.shape[:2], np.uint8)
    hm, gap = halo_band(a)
    a2 = inward_fill(a, hm) if hm.any() else a.copy()
    dbg[hm] = 1
    m, F = fringe_mask(a2)
    a2[m, :3] = np.clip(F[m] + 0.5, 0, 255).astype(np.uint8)
    dbg[m] = 2
    return a2, dict(recolored=int(m.sum()) + int(hm.sum()), halo=int(hm.sum()), gap=round(gap, 1)), dbg


def bleed(a, n=12):
    """把轮廓颜色往透明区外扩，放大时模型 / 采样器看不到任何底色（alpha 仍为 0）"""
    rgb = a[..., :3].astype(np.float32)
    filled = a[..., 3] > 0
    if not filled.any():
        return rgb
    for _ in range(n):
        num = np.zeros_like(rgb); cnt = np.zeros(filled.shape, np.float32)
        for sm, sc in zip(shifts(filled, 1), shifts(rgb, 1)):
            num += sc * sm[..., None]; cnt += sm
        new = ~filled & (cnt > 0)
        rgb[new] = num[new] / cnt[new][:, None]
        filled |= new
    rgb[~filled] = rgb[filled].mean(0)
    return rgb


def box_up(rgb, al, k):
    """k×k 盒式放大（像素艺术放大，坐标 (x,y) ↦ [kx, kx+k)）：形状不变、边缘仍然锐利"""
    if k == 1:
        return rgb, al
    out = np.repeat(np.repeat(rgb, k, axis=0), k, axis=1)
    aout = np.repeat(np.repeat(al, k, axis=0), k, axis=1)
    return out, aout


def smoothstep(x, e0, e1):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def upscale(a, scale):
    """返回放大后的 RGBA。scale=2：盒式放大；scale=4：装了模型就走 Real-ESRGAN（sr.sr4）。"""
    rgb = bleed(a) / 255.0
    al = (a[..., 3] > 0).astype(np.float32)
    if scale == 4:
        try:
            import sr  # 只有 scale=4 才需要 onnxruntime + 权重
        except Exception as e:  # pragma: no cover - 环境缺依赖时的明确报错
            raise SystemExit(f'scale=4 需要 通用模板/cast/hd/sr.py 与 onnxruntime：{e}\n  没有模型就用默认的 --scale 2（像素艺术放大，形状不变）。')
        rgb = sr.sr4(rgb)
        al = smoothstep(sr.sr4(np.repeat(al[..., None], 3, -1)).mean(-1), 0.22, 0.78)
        return np.dstack([np.clip(rgb * 255 + 0.5, 0, 255), al * 255 + 0.5]).astype(np.uint8)
    rgb, al = box_up(rgb, al, scale)
    return np.dstack([np.clip(rgb * 255 + 0.5, 0, 255), np.clip(al * 255 + 0.5, 0, 255)]).astype(np.uint8)


def rim_report(a):
    """（墨线下两圈里的像素数，其中按两条规则算作残留的像素数）"""
    op = a[..., 3] > 0
    d = edge_dist(op, 3)
    return int(((d >= 1) & (d <= 2) & op).sum()), int((fringe_mask(a)[0] | halo_band(a)[0]).sum())


def ink_share(a):
    op = a[..., 3] > 0
    r = edge_dist(op, 1) == 1
    return float((np.abs(a[..., :3].astype(int) - INK).sum(-1)[r] < 6).mean()) if r.any() else 1.0


def add_outline(a):
    """走路帧烘焙时漏了 1 像素墨线：补上（格子四边各长 1 像素）"""
    p = np.pad(a, ((1, 1), (1, 1), (0, 0)))
    op = p[..., 3] > 0
    nb = np.zeros(op.shape, bool)
    for s_ in shifts(op, 1, diag=False):
        nb |= s_
    ring = ~op & nb
    p[ring, :3] = INK
    p[ring, 3] = 255
    return p


def main(argv):
    scale = 2
    report_only = False
    names_arg = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--scale':
            scale = int(argv[i + 1]); i += 2; continue
        if a.startswith('--scale='):
            scale = int(a.split('=', 1)[1]); i += 1; continue
        if a == '--report':
            report_only = True; i += 1; continue
        if a in ('-h', '--help'):
            print(__doc__); return 0
        names_arg.append(a); i += 1
    if scale not in (1, 2, 4):
        raise SystemExit('--scale 只支持 1 / 2 / 4')

    out_root = os.environ.get('OUT', os.path.join(REPO, '人物/q版HD_2x' if scale == 2 else '人物/q版HD'))
    if not report_only:
        os.makedirs(f'{out_root}/clean1x', exist_ok=True)
        os.makedirs(f'{out_root}/base', exist_ok=True)

    meta_path = os.path.join(REPO, '通用模板/engine/assets/cast_atlas.json')
    atlas_path = os.path.join(REPO, '通用模板/engine/assets/cast_atlas.png')
    META = json.load(open(meta_path))['s']
    ATLAS = np.array(Image.open(atlas_path).convert('RGBA'))
    BASE = [k for k in META if not k.startswith(('act_', 'prop_', 'fx_'))]
    names = [n for n in BASE if not names_arg or n in names_arg]
    if names_arg:
        missing = [n for n in names_arg if n not in BASE]
        if missing:
            raise SystemExit(f'图集里没有这些基础格：{"、".join(missing)}')

    t0 = time.time()
    report, meta = {}, {}
    tot_before = tot_after = 0
    for idx, n in enumerate(names):
        x, y, w, h = META[n]
        a = ATLAS[y:y + h, x:x + w]
        c, st, _dbg = defringe(a)
        r0 = rim_report(a)
        r1 = rim_report(c)
        share = ink_share(a)
        pad = 0
        if share < 0.5 and not n.startswith('p_'):
            c = add_outline(c); pad = 1
        tot_before += r0[1]; tot_after += r1[1]
        if not report_only:
            Image.fromarray(c).save(f'{out_root}/clean1x/{n}.png')
            hd = upscale(c, scale)
            Image.fromarray(hd).save(f'{out_root}/base/{n}.png')
            meta[n] = dict(w=w, h=h, pad=pad, hd=[int(hd.shape[1]), int(hd.shape[0])])
        report[n] = dict(size=[w, h], ring_px=r0[0], residue_before=r0[1], residue_after=r1[1],
                         ink_share_before=round(share, 2), outline_added=bool(pad), **st)
        if idx % 20 == 0:
            print(f'{idx}/{len(names)} {n} {time.time() - t0:.0f}s', flush=True)

    print(f'{len(names)} 张基础格：抠图残留 {tot_before} → {tot_after} 像素；{scale} 倍；{time.time() - t0:.0f}s')
    if not report_only:
        json.dump(report, open(f'{out_root}/base_report.json', 'w'), ensure_ascii=False, indent=1)
        json.dump(meta, open(f'{out_root}/base_meta.json', 'w'), ensure_ascii=False, indent=1)
        print(f'写完：{out_root}/base（{len(meta)} 张）')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
