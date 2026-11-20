# 番外 MV ·《告白气球》

周二珂翻唱版。1280×720 · 30 fps · 212.98 秒 · 42 镜 · 34 句实测卡点。巴黎水彩明信片画风；
八位角色全部用 `人物/atlas.png`，布景与道具由代码绘制，零生成图；画面字全部用模板字体（站酷快乐体）。

主歌两遍给两种视角：第一遍鲸这边（事事差一点），第二遍小克那边（原来她全看见了）。完整说明见 [`remade.md`](remade.md)。

```bash
cd 源码 && npm install && npm run dev     # 预览
npm run build                              # dist/index.html
```

- 改某句时间：只改 `src/mv/lyrics.ts` 那一行，镜头时机都挂在句子上（`LT(n)` 句首切镜、`LM(n)` 后半句）。
- 改画面上的字：重跑 `python3 tools/subset_font.py <仓库根>/通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf`，缺字报错。
- 写镜头守三条：逐帧函数只读时间；角色每帧重新摆；缺素材就报错。

现状：没有成片（mp4），没有人整片看过、听过。
