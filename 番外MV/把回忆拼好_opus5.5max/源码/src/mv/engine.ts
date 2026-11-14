// 引擎：一个镜头 = 一次性搭景 build(kit) + 逐帧纯函数 update(f)（只读 f 里的时间，任意跳帧得到同一帧）。
// 世界画在第一遍，3D 歌词条画在第二遍（清深度后叠上去，永远不被布景挡住）。
import * as THREE from 'three';
import { Actor, Sprite3, loadAtlas, type Atlas } from './actors';
import { loadFont, makeWord, preloadGlyphs, type WordOpts } from './glyphs';
import { LyricRig } from './lyricsRig';
import { LYRICS, ONSET, RMS } from './data';
import { clamp, glowSprite, hashStr, mulberry, pieceGeo, skyDome, toon, type C, type SkyOpts, type Tabs, type V3 } from './kit';

export interface Cam { p: V3; l: V3; fov?: number; roll?: number }
export interface Out extends Cam { white?: number; black?: number; frame?: number }
/** 每帧给镜头的时间：T 全片秒、t 镜头内秒、u 镜头进度、e 音量、hit 鼓点脉冲、at(句, 字) 第几句第几个字的实测起唱时刻 */
export interface F { T: number; t: number; u: number; dur: number; e: number; hit: number; at: (line: number, ch?: number) => number; end: (line: number) => number }
export interface ShotSpec { id: string; from: [number, number] | null; name: string; lyric: string; note: string; cast: string[]; build: (k: Kit) => (f: F) => Out }
export interface ShotDef extends ShotSpec { t0: number; t1: number }
export interface Cell { m: THREE.Mesh; ix: number; iz: number; x: number; z: number; tabs: Tabs }

export class Kit {
  root = new THREE.Group();
  sprites: Sprite3[] = [];
  follow: THREE.Object3D[] = [];
  fog: THREE.Fog | null = null;
  bg = new THREE.Color(0x101018);
  rnd: () => number;
  constructor(public atlas: Atlas, seed: number) { this.rnd = mulberry(seed); }
  add<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T { o.position.set(x, y, z); this.root.add(o); return o; }
  actor(id: string, size = 1): Actor {
    const a = new Actor(this.atlas, id, size);
    this.sprites.push(a); this.root.add(a.mesh); if (a.shadow) this.root.add(a.shadow);
    return a;
  }
  thing(key: string, size = 1, shadow = false): Sprite3 {
    const s = new Sprite3(this.atlas, size, shadow); s.set(key);
    this.sprites.push(s); this.root.add(s.mesh); if (s.shadow) this.root.add(s.shadow);
    return s;
  }
  setFog(color: C, near: number, far: number) { this.fog = new THREE.Fog(color, near, far); this.bg.set(color); }
  sky(top: C, mid: C, bot: C, o?: SkyOpts): THREE.Mesh { const m = skyDome(top, mid, bot, o); this.root.add(m); this.follow.push(m); return m; }
  lights(o: { hemi?: [C, C, number]; dir?: [C, number, number, number, number]; amb?: [C, number] }) {
    const r: { hemi?: THREE.HemisphereLight; dir?: THREE.DirectionalLight; amb?: THREE.AmbientLight } = {};
    if (o.hemi) { r.hemi = new THREE.HemisphereLight(o.hemi[0], o.hemi[1], o.hemi[2]); this.root.add(r.hemi); }
    if (o.dir) { r.dir = new THREE.DirectionalLight(o.dir[0], o.dir[1]); r.dir.position.set(o.dir[2], o.dir[3], o.dir[4]); this.root.add(r.dir); }
    if (o.amb) { r.amb = new THREE.AmbientLight(o.amb[0], o.amb[1]); this.root.add(r.amb); }
    return r;
  }
  piece(tabs: Tabs, color: C | THREE.Material | THREE.Material[], o: { depth?: number; size?: number; flat?: boolean } = {}): THREE.Mesh {
    const flat = o.flat ?? true;
    const mat = color instanceof THREE.Material || Array.isArray(color) ? color : toon(color);
    const m = new THREE.Mesh(pieceGeo(tabs, o.depth ?? 0.22, flat), mat);
    const s = o.size ?? 1;
    if (flat) m.scale.set(s, 1, s); else m.scale.set(s, s, 1);
    this.root.add(m);
    return m;
  }
  /** 一整片互相咬合的拼图地面 */
  board(nx: number, nz: number, size: number, color: (ix: number, iz: number) => C, o: { depth?: number; open?: boolean; y?: number; cx?: number; cz?: number } = {}): Cell[] {
    const rs = () => (this.rnd() < 0.5 ? 1 : -1);
    const H: number[][] = [], V: number[][] = [];
    for (let ix = 0; ix < nx; ix++) { H.push([]); V.push([]); for (let iz = 0; iz < nz; iz++) { H[ix].push(rs()); V[ix].push(rs()); } }
    const cells: Cell[] = [];
    const ox = (o.cx ?? 0) - ((nx - 1) * size) / 2, oz = (o.cz ?? 0) - ((nz - 1) * size) / 2;
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
      const near = iz < nz - 1 || o.open ? V[ix][iz] : 0;
      const far = iz > 0 ? -V[ix][iz - 1] : o.open ? rs() : 0;
      const right = ix < nx - 1 || o.open ? H[ix][iz] : 0;
      const left = ix > 0 ? -H[ix - 1][iz] : o.open ? rs() : 0;
      const tabs: Tabs = [near, right, far, left];
      const m = this.piece(tabs, color(ix, iz), { depth: o.depth, size });
      const x = ox + ix * size, z = oz + iz * size;
      m.position.set(x, o.y ?? 0, z);
      cells.push({ m, ix, iz, x, z, tabs });
    }
    return cells;
  }
  glow(color: C, size: number, opacity = 1): THREE.Sprite { const s = glowSprite(color, size, opacity); this.root.add(s); return s; }
  word(text: string, o: WordOpts = {}) { const w = makeWord(text, o); this.root.add(w.group); return w; }
}

export class Engine {
  renderer: THREE.WebGLRenderer;
  world = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 1400);
  overlay = new THREE.Scene();
  ocam = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 100);
  lyric: LyricRig | null = null;
  atlas: Atlas | null = null;
  ready = false;
  shotIndex = 0;
  fx = { white: 0, black: 0, frame: 0 };
  private built = new Map<string, { kit: Kit; update: (f: F) => Out }>();
  private cur: string | null = null;

  constructor(canvas: HTMLCanvasElement, public shots: ShotDef[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.autoClear = false;
    this.ocam.position.set(0, 0, 12); this.ocam.lookAt(0, 0, 0);
    this.overlay.add(new THREE.AmbientLight(0xffffff, 1.35));
    const dl = new THREE.DirectionalLight(0xffffff, 2.1); dl.position.set(-2, 4, 6); this.overlay.add(dl);
  }

  async load(progress: (p: number) => void) {
    this.atlas = await loadAtlas(); progress(0.12);
    await loadFont(); progress(0.2);
    preloadGlyphs(LYRICS.map((l) => l.text).join('')); progress(0.32);
    this.lyric = new LyricRig(); this.overlay.add(this.lyric.root); progress(0.38);
    for (let i = 0; i < this.shots.length; i++) {
      const b = this.get(this.shots[i]);
      this.world.add(b.kit.root); this.world.fog = b.kit.fog;
      try { this.renderer.compile(this.world, this.cam); } catch { /* 编译失败留到首帧再报 */ }
      this.world.remove(b.kit.root);
      progress(0.38 + (0.62 * (i + 1)) / this.shots.length);
      await new Promise((r) => setTimeout(r, 0));
    }
    this.renderer.compile(this.overlay, this.ocam);
    this.ready = true;
  }

  private get(s: ShotDef) {
    let b = this.built.get(s.id);
    if (!b) { const kit = new Kit(this.atlas!, hashStr(s.id)); const update = s.build(kit); b = { kit, update }; this.built.set(s.id, b); }
    return b;
  }

  setSize(w: number, h: number) {
    if (w < 2 || h < 2) return;
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
    this.ocam.aspect = w / h;
    // 竖屏 / 窄屏时把歌词条整体拉远，保证一句十五个字也放得下
    this.ocam.position.z = 12 * Math.max(1, (16 / 9) / (w / h));
    this.ocam.updateProjectionMatrix();
  }

  shotAt(T: number) { let i = 0; for (let j = 0; j < this.shots.length; j++) if (T >= this.shots[j].t0) i = j; return i; }

  /** 鼓点脉冲：最近几帧里起音强度按 0.12 秒衰减取最大 */
  pulse(T: number) {
    const f = Math.floor(T * 30); let v = 0;
    for (let k = 0; k < 8; k++) { const j = f - k; if (j < 0 || j >= ONSET.length) continue; v = Math.max(v, ONSET[j] * Math.exp(-(T - j / 30) / 0.12)); }
    return clamp(v);
  }

  render(T: number) {
    if (!this.ready || !this.lyric) return;
    T = clamp(T, 0, 59.995);
    const i = this.shotAt(T); this.shotIndex = i;
    const s = this.shots[i]; const b = this.get(s);
    if (this.cur !== s.id) {
      if (this.cur) { const old = this.built.get(this.cur); if (old) this.world.remove(old.kit.root); }
      this.world.add(b.kit.root); this.world.fog = b.kit.fog; this.cur = s.id;
    }
    for (const sp of b.kit.sprites) sp.begin();
    const fi = Math.min(RMS.length - 1, Math.floor(T * 30));
    const f: F = {
      T, t: T - s.t0, dur: s.t1 - s.t0, u: clamp((T - s.t0) / (s.t1 - s.t0)), e: RMS[fi] ?? 0, hit: this.pulse(T),
      at: (l, c = 0) => { const L = LYRICS[l]; return L.t[Math.max(0, Math.min(c, L.t.length - 1))]; },
      end: (l) => LYRICS[l].end,
    };
    let out: Out;
    try { out = b.update(f); } catch (e) { console.error(`[shot ${s.id}]`, e); out = { p: [0, 2, 8], l: [0, 1, 0] }; }
    const c = this.cam;
    const dr = 0.035;
    c.position.set(out.p[0] + Math.sin(T * 0.9) * dr, out.p[1] + Math.sin(T * 1.3 + 1) * dr * 0.6, out.p[2] + Math.sin(T * 0.7 + 2) * dr * 0.5);
    c.up.set(0, 1, 0); c.lookAt(out.l[0], out.l[1], out.l[2]);
    if (out.roll) c.rotateZ(out.roll);
    const fov = out.fov ?? 40;
    if (Math.abs(c.fov - fov) > 1e-4) { c.fov = fov; c.updateProjectionMatrix(); }
    for (const sp of b.kit.sprites) if (sp.mesh.visible) sp.mesh.rotation.set(0, Math.atan2(c.position.x - sp.mesh.position.x, c.position.z - sp.mesh.position.z), 0);
    for (const o of b.kit.follow) {
      o.position.copy(c.position);
      const u = ((o as THREE.Mesh).material as THREE.ShaderMaterial).uniforms;
      if (u && u.time) u.time.value = T;
    }
    this.lyric.update(T, f.hit);
    this.renderer.setClearColor(b.kit.fog ? b.kit.fog.color : b.kit.bg, 1);
    this.renderer.clear();
    this.renderer.render(this.world, c);
    this.renderer.clearDepth();
    this.renderer.render(this.overlay, this.ocam);
    this.fx.white = clamp(out.white ?? 0); this.fx.black = clamp(out.black ?? 0); this.fx.frame = clamp(out.frame ?? 0);
  }
}
