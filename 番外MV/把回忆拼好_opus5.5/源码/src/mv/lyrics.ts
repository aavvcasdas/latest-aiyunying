import * as THREE from 'three';
import { LINES, TITLE_START, lineAt } from './timing';
import { glyphGeo } from './glyphs';
import { pieceGeo, pop, clamp, easeIn, rnd, std } from './kit';

// 关键词的配色：按句意挑（冷词偏灰蓝，暖词偏橙粉）
const KEY_COLORS: Record<string, [number, number]> = {
  渺小: [0xb8c4d6, 0x34405a],
  真实存在: [0xf4c04e, 0xb2392f],
  祈愿: [0xcfe0ff, 0x2d4c8a],
  挫败: [0x7c8494, 0xf2f2f2],
  遇见你: [0xffc9a8, 0xb2392f],
  光明: [0xffe27a, 0xd2601a],
  广袤无垠: [0x9ed8f0, 0x1d5d8c],
  大海: [0x4fa8e0, 0xffffff],
  有你在: [0xffd1dc, 0xc23a5e],
  取代: [0xf4c04e, 0xb2392f],
  灰暗: [0x6e7380, 0xdedede],
  发呆: [0xb7bcc6, 0x3a3f4c],
  拨开: [0xffe27a, 0xd2601a],
  阴霾: [0x5a6070, 0xe8e8e8],
  快乐: [0xffd36e, 0xd8462e],
  淘汰: [0x8a8f99, 0xffffff],
  情话: [0xff9fb8, 0xffffff],
  转瞬即逝: [0xc6b4ff, 0x40308a],
  烟花: [0xff7aa8, 0xfff2a8],
  绽放: [0xffb3d1, 0xb3205e],
  一刹那: [0xfff2a8, 0xc23a5e],
  无法自拔: [0xff8fb1, 0xffffff],
  时差: [0x2d3a6e, 0xffe27a],
  骗自己: [0xc9b8a8, 0x5a3f2e],
  放下: [0xe8dccb, 0x8a5a44],
  炙热: [0xff7a4a, 0xfff2a8],
  爱自己: [0xffb3c7, 0xc23a5e],
};

const TILE = 0.86;
const tileGeo = () => pieceGeo(1, 1, -1, -1, 0.14, 1);

interface Built {
  group: THREE.Group;
  tiles: THREE.Group[];
  key: boolean[];
}

export class LyricLayer {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100);
  built = new Map<number, Built>();
  constructor() {
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb0a090, 1.6));
    const d = new THREE.DirectionalLight(0xffffff, 1.8);
    d.position.set(-3, 5, 8);
    this.scene.add(d);
  }
  private build(n: number): Built {
    const ln = LINES[n];
    const chars = [...ln.text];
    const group = new THREE.Group();
    const tiles: THREE.Group[] = [];
    const key = chars.map((_, k) => ln.keys.some(([a, b]) => k >= a && k < b));
    const gap = TILE * 1.0;
    chars.forEach((ch, k) => {
      const kw = ln.keys.find(([a, b]) => k >= a && k < b);
      const word = kw ? [...ln.text].slice(kw[0], kw[1]).join('') : '';
      const [tc, gc] = kw ? KEY_COLORS[word] ?? [0xf4c04e, 0xb2392f] : [0xf6efe0, 0x4a3628];
      const holder = new THREE.Group();
      const tile = new THREE.Mesh(tileGeo(), [std(tc, { roughness: 0.6 }), std(new THREE.Color(tc).multiplyScalar(0.78), { roughness: 0.8 })]);
      tile.scale.setScalar(TILE);
      holder.add(tile);
      const g = new THREE.Mesh(glyphGeo(ch, 0.16), [std(gc, { roughness: 0.4 }), std(new THREE.Color(gc).multiplyScalar(0.55))]);
      g.scale.setScalar(TILE * 0.74);
      g.position.z = 0.16;
      holder.add(g);
      holder.position.x = (k - (chars.length - 1) / 2) * gap;
      group.add(holder);
      tiles.push(holder);
    });
    group.position.set(0, -4.25, 0);
    this.scene.add(group);
    const b = { group, tiles, key };
    this.built.set(n, b);
    return b;
  }
  update(t: number) {
    this.built.forEach((b) => (b.group.visible = false));
    if (t >= TITLE_START) return;
    const n = lineAt(t);
    const ln = LINES[n];
    const b = this.built.get(n) ?? this.build(n);
    b.group.visible = true;
    const exit = clamp((t - (ln.end - 0.22)) / 0.22);
    // 当前在唱的词
    let curKey = -1;
    ln.keys.forEach(([a, bb], i) => {
      if (t >= ln.chars[a] && (bb >= ln.chars.length || t < ln.chars[bb] + 0.4)) curKey = i;
    });
    b.tiles.forEach((h, k) => {
      const s = t - ln.chars[k];
      const p = pop(s, 0.42);
      const isKey = b.key[k];
      const inCur = curKey >= 0 && k >= ln.keys[curKey][0] && k < ln.keys[curKey][1];
      const sc = p * (isKey ? 1.12 : 1) * (inCur ? 1 + 0.08 * Math.max(0, Math.sin(s * 9)) * Math.exp(-s * 1.5) : 1);
      h.scale.setScalar(Math.max(0.0001, sc));
      h.rotation.x = (1 - p) * -1.4;
      h.rotation.z = (1 - p) * (rnd(k, n) - 0.5) * 1.2 + (isKey ? Math.sin(t * 3 + k) * 0.04 : 0);
      h.position.y = (1 - p) * 1.2 + (isKey && s > 0 ? 0.18 * Math.exp(-s * 3) * Math.abs(Math.sin(s * 10)) : 0);
      h.position.z = isKey ? 0.25 : 0;
      // 退场：一块块翻落
      if (exit > 0) {
        const e = easeIn(clamp(exit * 1.6 - k * 0.04));
        h.position.y -= e * 3;
        h.rotation.x += e * 1.6;
      }
      h.visible = s > 0;
    });
  }
  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
