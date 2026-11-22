#!/usr/bin/env python3
"""从仓库根重新生成本片素材（可选；压缩包里已带生成好的版本）。

在仓库根运行：python3 番外MV/浪人琵琶_字字分镜/源码/scripts/prepare_assets.py
  人物/atlas.png + 人物/index.json  -> 源码/src/assets/cast.png + 源码/src/mv/castData.ts
  浪人琵琶.WAV                      -> 源码/src/assets/langren.m4a（需要 ffmpeg）
缺素材直接报错，不拿别的造型顶替。
"""
import json, re, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path.cwd()
SRC = Path(__file__).resolve().parent.parent / "src"
GROUPS = ['act_whale_idle','act_whale_point','act_whale_sad','act_whale_shiver','act_whale_bow','act_whale_shake','act_whale_surprise','act_whale_sway','act_whale_nod','act_whale_wave','act_whale_eat','walk_whale',
'act_claude_idle','act_claude_curtsy','act_claude_tilt','act_claude_lookaround','act_claude_nod','act_claude_read','act_claude_sad','act_claude_hop','walk_claude',
'act_gpt_cast','act_gpt_hover','act_gpt_float','act_qwen_sway','act_zai_doze','act_kimi_think','act_gemini_lookaround','act_doubao_idle',
'p_whale_neutral','p_whale_think','p_whale_shout','p_claude_neutral','p_claude_dizzy',
'fx_heart','fx_sweat','fx_question','fx_exclaim','fx_sparkle','fx_shine','fx_steam','fx_gloom','fx_zzz','fx_dizzy','prop_teacup','prop_fan','prop_abacus']

def main():
    idx = json.loads((ROOT / "人物/index.json").read_text("utf-8"))
    atlas = Image.open(ROOT / "人物/atlas.png").convert("RGBA")
    allf = {f["name"]: f["atlas"] for s in idx["sheets"].values() for f in s["frames"]}
    num = lambda n: int(re.search(r"_(\d+)$", n).group(1)) if re.search(r"_(\d+)$", n) else 0
    names = []
    for g in GROUPS:
        fs = sorted([n for n in allf if re.fullmatch(re.escape(g) + r"(_\d+)?", n)], key=num)
        if not fs:
            sys.exit(f"缺帧：{g}")
        names += fs
    x = y = rowh = 0; Wd = 1024; rects = {}
    for n in names:
        _, _, w, h = allf[n]
        if x + w + 2 > Wd:
            x = 0; y += rowh + 2; rowh = 0
        rects[n] = (x, y, w, h); x += w + 2; rowh = max(rowh, h)
    sheet = Image.new("RGBA", (Wd, y + rowh), (0, 0, 0, 0))
    for n, (x, y, w, h) in rects.items():
        ax, ay, _, _ = allf[n]
        sheet.alpha_composite(atlas.crop((ax, ay, ax + w, ay + h)), (x, y))
    sheet.save(SRC / "assets/cast.png", optimize=True)
    acts = {}
    for n in names:
        acts.setdefault(re.sub(r"_\d+$", "", n), []).append(n)
    (SRC / "mv/castData.ts").write_text(
        "// 由 人物/atlas.png 按 人物/index.json 裁出本片用到的帧（像素原样，未改画）\n"
        f"export const RECTS: Record<string, [number, number, number, number]> = {json.dumps({k: list(v) for k, v in rects.items()})};\n"
        f"export const ACTIONS: Record<string, string[]> = {json.dumps(acts)};\n", "utf-8")
    wav = ROOT / "浪人琵琶.WAV"
    if not wav.exists():
        sys.exit("缺音源：浪人琵琶.WAV")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "160k", str(SRC / "assets/langren.m4a")], check=True)
    print(f"ok：{len(names)} 帧，音轨已转码")

if __name__ == "__main__":
    main()
