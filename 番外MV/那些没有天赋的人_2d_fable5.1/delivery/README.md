# 《譬如我》大字版

照样片（仓库根 `譬如我.mp4`）的大字动态排版重做的版本：1280×720 · 30 fps · 152.1 秒 · 52 镜 · 65 句逐字卡点（沿用三维版实测）。
八位角色全部用 `人物/atlas.png`；布景与道具代码绘制，零生成图。三维版 `../源码/` `../成片/` 原样保留。

说明、选角、红线核对、待确认的事都在 [`remade.md`](remade.md)。

```bash
cd 源码 && npm install && npm run dev     # 预览
npm run build                              # dist/index.html
```

改时间只改 `src/mv/lyricsData.ts`；改画面上的字后重跑 `python3 tools/subset_font.py <黄油体.ttf> <马善政.ttf>`。
写镜头守三条：逐帧函数只读时间；角色每帧重新摆；缺素材就报错。
