// 引擎：渲染器 + 后期（泛光 / 调色）+ 分镜表（挂在歌词句子上）+ 立体大字歌词
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { BEAT, BEAT0, DURATION, LYRICS } from './generated';
import { C, LE, LS, PUNI, Particles, Sky, clamp, hash, loadAtlas, range } from './core';
import { Lyrics, REP, buildGlyphs, loadFont } from './type3d';
import type { Ctx, Env, Grade, Scene } from './kit';
import { RoomScene, StageScene, VoidScene } from './scenes1';
import { CornerScene, HallScene, SeaScene } from './scenes2';

export interface Shot { a: number; b: number; scene: string; v: string; line: number; rep: number; label: string }
type Row = [string, string, string];
const CH: Row[] = [
  ['stage', 'c1', '那些没有天赋的人'], ['void', 'c2', '譬如我'], ['room', 'c3', '枕头下发霉的梦'], ['void', 'c4', '热忱与自卑'], ['void', 'c5', '笑容的下落'],
  ['stage', 'c6', '世俗的成功'], ['stage', 'c7', '万众瞩目的那一个'], ['corner', 'c8', '某个角落'], ['corner', 'c9', '小小的花朵'],
];
const VS: Row[] = [
  ['room', 'v10', '涂破的稿纸'], ['room', 'v11', '落入俗套的名字'], ['room', 'v12', '倾注所有'], ['room', 'v13', '还是想坚持'],
  ['void', 'v14', '平庸二字'], ['hall', 'v15', '茫茫人世'], ['sea', 'v16', '渺小如我'], ['sea', 'v17', '改写命运的诗'],
];
const BR: Row[] = [['hall', 'b18', '名垂青史'], ['hall', 'b19', '人们却只'], ['stage', 'b20', '天才的故事']];
const DEF: { a?: number; line?: number; scene: string; v: string; label: string }[] = [];
const add = (from: number, rows: Row[]) => rows.forEach(([scene, v, label], i) => DEF.push({ line: from + i, scene, v, label }));
add(1, CH);
DEF.push({ a: LE(9) + 0.5, scene: 'corner', v: 'title', label: '间奏 · 譬如我' });
add(10, VS); add(18, BR); add(21, CH);
DEF.push({ a: LE(29) + 0.5, scene: 'sea', v: 'dive', label: '间奏 · 深度求索' });
add(30, BR); add(33, CH);
const startOf = (d: (typeof DEF)[number], i: number) => (i === 0 ? 0 : d.line ? LS(d.line) - 0.12 : d.a!);
export const SHOTS: Shot[] = DEF.map((d, i) => ({
  a: startOf(d, i), b: DEF[i + 1] ? startOf(DEF[i + 1], i + 1) : DURATION,
  scene: d.scene, v: d.v, line: d.line ?? 0, rep: d.line ? REP[d.line - 1] : 0, label: d.label,
}));
export const SECTIONS = [
  { t: 0, name: '副歌一' }, { t: LE(9) + 0.5, name: '间奏' }, { t: LS(10) - 0.12, name: '主歌' }, { t: LS(18) - 0.12, name: '桥段' },
  { t: LS(21) - 0.12, name: '副歌二' }, { t: LE(29) + 0.5, name: '深潜' }, { t: LS(30) - 0.12, name: '桥段二' }, { t: LS(33) - 0.12, name: '副歌三' },
];
export const TITLE = '譬如我';
export const CAST: { ch: string; name: string; model: string; role: string }[] = [
  { ch: 'whale', name: '鲸鱼娘', model: 'DeepSeek', role: '譬如我：暗处那个没有天赋的人' },
  { ch: 'claude', name: '小克', model: 'Claude', role: '首席天才' },
  { ch: 'gpt', name: '龙娘', model: 'GPT', role: '天才次席' },
  { ch: 'gemini', name: 'Gemini', model: 'Gemini', role: '领奖台上的天才' },
  { ch: 'kimi', name: 'Kimi', model: 'Kimi', role: '回头看了她一眼的人' },
  { ch: 'doubao', name: '豆包', model: '豆包', role: '台下的人，后来的朋友' },
  { ch: 'qwen', name: '千问', model: '通义千问', role: '茫茫人世' },
  { ch: 'zai', name: '智谱', model: '智谱', role: '茫茫人世' },
];
/** 从 from 之后的第一拍起，连着 n 拍 */
const beats = (from: number, n: number) => { const k = Math.ceil((from - BEAT0) / BEAT); return Array.from({ length: n }, (_, i) => BEAT0 + (k + i) * BEAT); };

const GRADE_FS = `uniform sampler2D tDiffuse; uniform float uSepia; uniform float uBW; uniform float uVig; uniform float uGrain; uniform float uFlash; uniform vec3 uFlashCol; uniform float uBlack; uniform float uTime; uniform float uWarm; uniform float uFlick; uniform float uCA; uniform float uAsp; uniform float uLift; varying vec2 vUv;
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; vec2 d = uv - 0.5; vec3 c;
  if (uCA > 0.0) { c.r = texture2D(tDiffuse, uv + d * uCA * 2.0).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - d * uCA * 2.0).b; } else c = texture2D(tDiffuse, uv).rgb;
  c = mix(c, pow(max(c, vec3(0.0)), vec3(0.78)), uLift);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(l * 1.08 + 0.05, l * 0.95 + 0.02, l * 0.76), uSepia); c = mix(c, vec3(l), uBW);
  c *= mix(vec3(1.0), vec3(1.08, 1.0, 0.86), uWarm);
  c *= 1.0 - uVig * smoothstep(0.3, 0.95, length(d * vec2(uAsp, 1.0)) / max(1.0, uAsp * 0.62));
  c += (rnd(uv * vec2(1280.0, 720.0) + fract(uTime * 7.31)) - 0.5) * uGrain;
  c *= 1.0 - uFlick * rnd(vec2(floor(uTime * 24.0), 1.7));
  c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0)); c = mix(c, vec3(0.0), clamp(uBlack, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0); }`;
const GRADE0: Grade = { sepia: 0, bw: 0, vig: 0.25, grain: 0.03, flash: 0, flashCol: 0xffffff, black: 0, warm: 0.08, flick: 0, ca: 0.0012, bloom: 0.8, lift: 0.66 };

export class Engine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 900);
  overlayScene = new THREE.Scene();
  overlayCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 100);
  composer: EffectComposer | null = null;
  bloom: UnrealBloomPass | null = null;
  grade: ShaderPass | null = null;
  env: Env | null = null;
  scenes: Record<string, Scene> = {};
  lyrics: Lyrics | null = null;
  ready = false; shotIndex = -1; cur: Scene | null = null; disposed = false; w = 1280; h = 720;
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene.add(this.cam); this.overlayScene.add(this.overlayCam);
  }
  async load(onP: (p: number) => void) {
    onP(0.08);
    await Promise.all([loadAtlas(), loadFont()]);
    onP(0.45);
    if (this.disposed) return;
    buildGlyphs(TITLE + '深度求索鲸鱼娘番外音乐影像');
    const sky = new Sky();
    const st = new Particles(1200, { size: 0.9 });
    for (let i = 0; i < 1200; i++) {
      const th = hash(i) * Math.PI * 2, ph = Math.acos(1 - hash(i + 1) * 1.3);
      st.set(i, Math.sin(ph) * Math.cos(th) * 300, Math.cos(ph) * 300 - 40, Math.sin(ph) * Math.sin(th) * 300, 0.6 + hash(i + 2) * 1.8);
      st.color(i, C(i % 7 ? 0xffffff : 0xbfd8ff));
    }
    st.commit();
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    const fog = new THREE.Fog(0x000000, 20, 100);
    this.scene.fog = fog; this.scene.add(sky.mesh, st.points, hemi, sun);
    this.env = { scene: this.scene, cam: this.cam, sky, stars: st, hemi, sun, fog, grade: { ...GRADE0 } };
    onP(0.55);
    this.scenes = { stage: new StageScene(), void: new VoidScene(), room: new RoomScene(), corner: new CornerScene(), hall: new HallScene(), sea: new SeaScene() };
    onP(0.75);
    const ly = new Lyrics(); this.lyrics = ly; this.overlayCam.add(ly.root);
    // 间奏一：片名
    const tb = beats(LE(9) + 0.9, 6);
    ly.card({ s: '***譬/***如/***我', ax: 0, ay: 0.78, S: 0.3, rot: [0.08, 0, 0], fx: 'zoom', pal: 'deep' }, [tb[0], tb[1], tb[2]], LS(10) - 0.35);
    ly.card({ s: '鲸鱼娘/番外/音乐影像', ax: 0, ay: -0.12, S: 0.17, rot: [0.08, 0, 0], fx: 'type', pal: 'blue' }, '鲸鱼娘番外音乐影像'.split('').map((_, i) => tb[3] + i * 0.07), LS(10) - 0.35);
    // 间奏二：深度求索
    const td = beats(LE(29) + 4.2, 4);
    ly.card({ s: '**深/**度/**求/**索', ax: 0, ay: -1.2, S: 0.42, rot: [-0.1, 0, 0], fx: 'rise', pal: 'deep' }, td, LS(30) - 0.6);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.33, 0.4, 0.88);
    this.composer.addPass(this.bloom);
    // 歌词在泛光之后单独合成，亮场景不会把字的轮廓糊掉
    const subtitles = new RenderPass(this.overlayScene, this.overlayCam);
    subtitles.clear = false; subtitles.clearDepth = true;
    this.composer.addPass(subtitles);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, uSepia: { value: 0 }, uBW: { value: 0 }, uVig: { value: 0.4 }, uGrain: { value: 0.03 }, uFlash: { value: 0 },
        uFlashCol: { value: new THREE.Color(1, 1, 1) }, uBlack: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 }, uFlick: { value: 0 }, uCA: { value: 0 }, uAsp: { value: 16 / 9 }, uLift: { value: 0.42 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.grade);
    this.setSize(this.w, this.h);
    // 预编译各场景的着色器，免得第一次切进去卡一下
    for (const sc of Object.values(this.scenes)) { this.scene.add(sc.group); this.renderer.compile(this.scene, this.cam); this.scene.remove(sc.group); }
    this.ready = true;
    onP(1);
  }
  setSize(w: number, h: number) {
    this.w = Math.max(2, w); this.h = Math.max(2, h);
    this.renderer.setSize(this.w, this.h, false);
    this.cam.aspect = this.w / this.h;
    if (this.cam.view?.enabled) {
      this.cam.view.fullWidth = this.cam.aspect;
      this.cam.view.width = this.cam.aspect;
    }
    this.cam.updateProjectionMatrix();
    this.overlayCam.aspect = this.cam.aspect; this.overlayCam.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(this.w, this.h); }
    if (this.bloom) this.bloom.enabled = this.w >= 640 && this.w > this.h;
    if (this.grade) this.grade.uniforms.uAsp.value = this.w / this.h;
  }
  shotAt(t: number) { let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].a) i = k; return i; }
  lineAt(t: number) {
    let cur = -1;
    for (let i = 0; i < LYRICS.length; i++) if (t >= LYRICS[i].t[0] - 0.12 && t <= LYRICS[i].end + 0.5) cur = i;
    return cur;
  }
  render(t: number, hideLyrics = false) {
    if (!this.ready || !this.env || !this.composer || !this.lyrics) return;
    t = clamp(t, 0, DURATION - 0.001);
    const i = this.shotAt(t); const sh = SHOTS[i]; const sc = this.scenes[sh.scene];
    if (this.cur !== sc) { if (this.cur) this.scene.remove(this.cur.group); this.scene.add(sc.group); this.cur = sc; }
    this.shotIndex = i;
    const g = this.env.grade; Object.assign(g, GRADE0);
    const ctx: Ctx = { t, lt: t - sh.a, p: clamp((t - sh.a) / (sh.b - sh.a)), dur: sh.b - sh.a, v: sh.v, e: this.env, a: sh.a, b: sh.b, n: sh.line, rep: sh.rep };
    sc.frame(ctx);
    // 硬切：每个镜头头两帧给一点白，像文字 PV 的闪切
    if (i > 0) g.flash = Math.max(g.flash, (1 - range(ctx.lt, 0, 0.12)) * (SHOTS[i - 1].scene !== sh.scene ? 0.16 : 0.07));
    if (t < 0.3) g.black = Math.max(g.black, 1 - range(t, 0, 0.25));
    this.cam.rotateZ(Math.sin(t * 0.7) * 0.0015);
    this.overlayCam.fov = this.cam.fov; this.overlayCam.updateProjectionMatrix();
    this.lyrics.hidden = hideLyrics;
    this.lyrics.update(t, this.cam.fov);
    const k = hideLyrics ? 0 : this.lyrics.kick;
    if (k > 0) { this.cam.translateZ(-k * 0.035); g.ca += k * 0.004; }
    this.cam.updateMatrixWorld();
    sc.post(ctx);
    this.env.sky.mesh.position.copy(this.cam.position);
    this.env.stars.points.position.copy(this.cam.position);
    const gu = this.grade!.uniforms;
    gu.uSepia.value = g.sepia; gu.uBW.value = g.bw; gu.uVig.value = g.vig; gu.uGrain.value = g.grain; gu.uFlash.value = g.flash;
    (gu.uFlashCol.value as THREE.Color).setHex(g.flashCol);
    gu.uBlack.value = g.black; gu.uTime.value = t; gu.uWarm.value = g.warm; gu.uFlick.value = g.flick; gu.uCA.value = g.ca; gu.uLift.value = g.lift;
    this.bloom!.strength = 0.3 * g.bloom;
    PUNI.uH.value = this.renderer.domElement.height / (2 * Math.tan((this.cam.fov * Math.PI) / 360));
    this.composer.render();
  }
  dispose() {
    this.disposed = true; this.ready = false;
    const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
    const release = (root: THREE.Object3D) => root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) geometries.add(m.geometry);
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => materials.add(x));
    });
    release(this.scene); release(this.overlayScene);
    Object.values(this.scenes).forEach((s) => release(s.group));
    geometries.forEach((x) => x.dispose()); materials.forEach((x) => x.dispose());
    this.composer?.passes.forEach((p) => p.dispose()); this.composer?.dispose();
    this.renderer.dispose();
  }
}
