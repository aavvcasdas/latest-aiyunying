import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
p = ROOT / '通用模板/cast/source/walk_cycle_data.js'
s=p.read_text(encoding='utf-8')
data = json.loads((Path(__file__).resolve().parent / 'whale_sprites.json').read_text())['walk']
for key,rec in data.items():
    w,h,b64=rec
    pat=re.compile(rf'({re.escape(key)}: \[)(\d+), (\d+), \'[^\']*\'(\])')
    m=pat.search(s)
    if not m: raise SystemExit(f'missing {key}')
    if int(m.group(2))!=w or int(m.group(3))!=h:
        raise SystemExit(f'size mismatch {key}: {m.group(2)}x{m.group(3)} vs {w}x{h}')
    s=pat.sub(lambda mm: f'{mm.group(1)}{w}, {h}, \'{b64}\'{mm.group(4)}', s, count=1)
# update header note
old_note='''// 2026-11-13 例外：本鲸八帧步态（walk_whale_0–7）按 90 px 定距切格时，把隔壁实例的尾巴尖与靴沿切了进来，
// 裙摆右前方多出一条“鱼尾”。修补用仓库里的 tools/fix_whale_walk_bleed.mjs（只清越界像素，`--check` 可复验），
// 之后重跑 `npm run atlas`。重新生成步态数据时先看这份脚本是否还需要跑一遍。'''
redraw_note='''// 2026-11-24 用户授权重画本鲸：walk_whale_0–7 已由新的侧面基础格
// （whale_redraw_refs/whale_side_clean.png）确定性派生八帧，透明留边、调色板不变。
// 旧的 tools/fix_whale_walk_bleed.mjs 是一次性历史补丁，只适用于 2026-11-13 那版切格数据；
// 新帧由 npm run walk:check 的通用连通域检查把关，不再按写死坐标清像素。'''
rollback_note='''// 2026-11-24 用户要求：本鲸走路回退到本次项目改动之前（重画前）的八帧步态，其余动作不变。
// 数据逐字节取自重画前的 walk_cycle_data.js，保存在 whale_redraw_refs/walk_legacy.json；
// tools/fix_whale_walk_bleed.mjs 那次历史清像素补丁本来就已经应用在这份数据上。'''
if rollback_note in s:
    pass
elif redraw_note in s:
    s = s.replace(redraw_note, rollback_note)
elif old_note in s:
    s = s.replace(old_note, rollback_note)
else:
    lines = s.splitlines(True)
    s = lines[0] + rollback_note + '\n' + ''.join(lines[1:])
p.write_text(s,encoding='utf-8')
print('walk_cycle_data.js updated',len(data),'frames')
