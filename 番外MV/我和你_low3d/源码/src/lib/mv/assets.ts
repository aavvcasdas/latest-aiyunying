// 读取 latest-aiyunying/人物/index.json（分组图坐标），按「帧名」取 Q 版像素帧。
export type Frame = { img: HTMLImageElement; x: number; y: number; w: number; h: number };

type IndexJson = {
  sheets: Record<string, { frames: { name: string; sheet: [number, number, number, number] }[] }>;
};

export class Assets {
  frames = new Map<string, Frame>();
  actions = new Map<string, Frame[]>();
  props = new Map<string, HTMLImageElement>();
  ready = false;

  async load(): Promise<void> {
    const res = await fetch("/mv/cast/index.json");
    const idx = (await res.json()) as IndexJson;
    const imgs = new Map<string, HTMLImageElement>();
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("缺素材: " + src));
        im.src = src;
      });
    await Promise.all(
      Object.keys(idx.sheets).map(async (path) => {
        const base = path.split("/").pop()!;
        imgs.set(path, await loadImg("/mv/cast/" + base));
      }),
    );
    for (const [path, sheet] of Object.entries(idx.sheets)) {
      const img = imgs.get(path)!;
      for (const f of sheet.frames) {
        const [x, y, w, h] = f.sheet;
        this.frames.set(f.name, { img, x, y, w, h });
      }
    }
    // 动作分组：act_whale_hop_0..n → "whale_hop"；walk_whale_0..7 → "whale_walk"
    const names = [...this.frames.keys()].sort((a, b) => {
      const na = parseInt(a.split("_").pop()!, 10), nb = parseInt(b.split("_").pop()!, 10);
      return a.replace(/_\d+$/, "").localeCompare(b.replace(/_\d+$/, "")) || na - nb;
    });
    for (const n of names) {
      let key: string | null = null;
      let m = n.match(/^act_([a-z]+)_([a-z]+)_\d+$/);
      if (m) key = `${m[1]}_${m[2]}`;
      m = n.match(/^walk_([a-z]+)(?:_big)?_\d+$/);
      if (m) key = `${m[1]}_walk`;
      m = n.match(/^gpt_fly_\d+$/);
      if (m) key = "gpt_fly";
      m = n.match(/^fx_([a-z]+)_\d+$/);
      if (m) key = `fx_${m[1]}`;
      if (!key) continue;
      if (!this.actions.has(key)) this.actions.set(key, []);
      this.actions.get(key)!.push(this.frames.get(n)!);
    }
    await Promise.all(
      ["toys", "tv", "sneakers", "backpack", "paperplane", "wateringcan"].map(async (p) => {
        this.props.set(p, await loadImg(`/mv/props/${p}.png`));
      }),
    );
    this.ready = true;
  }

  /** 取动作帧：char_action，按时间循环。 */
  act(char: string, action: string, t: number, fps = 8, loop = true): Frame | null {
    const list = this.actions.get(`${char}_${action}`) ?? this.actions.get(`${char}_idle`) ?? this.actions.get(`${char}_float`);
    if (!list || !list.length) return null;
    let i = Math.floor(Math.max(0, t) * fps);
    i = loop ? i % list.length : Math.min(i, list.length - 1);
    return list[i];
  }

  frame(name: string): Frame | null {
    return this.frames.get(name) ?? null;
  }
}
