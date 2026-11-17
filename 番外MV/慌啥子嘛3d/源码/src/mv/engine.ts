// 引擎：渲染器 + 后期（泛光 / 调色 / 微醺晃动）+ 分镜调度 + 软 3D 歌词卡
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { DURATION, LYRICS } from './data';
import { LS, barStart, clamp, kick, loadAtlas, range, timeOfBeat } from './core';
import { Lyrics, buildGlyphs, loadFont } from './lyrics3d';
import { World } from './world';
import { type Ctx, type Grade, SHOTS, bindShots } from './shots';

export const TITLE = '慌啥子嘛';
export const CREDITS: [string, string][] = [['鲸鱼娘', '主角'], ['千问', '慌啥子嘛'], ['月球少女', '月亮'], ['小克', '花会开'], ['龙娘', '风'], ['猫', '节拍'], ['狐狸', '完美'], ['豆包', '好运']];

const GRADE_FS = `uniform sampler2D tDiffuse; uniform float uVig; uniform float uGrain; uniform float uFlash; uniform float uBlack; uniform float uTime; uniform float uWarm; uniform float uSway; uniform float uSat; uniform float uAsp; varying vec2 vUv;
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; vec2 d = uv - 0.5;
  if (uSway > 0.0) uv += vec2(sin(uv.y * 8.0 + uTime * 2.1) * 0.006, cos(uv.x * 6.0 + uTime * 1.7) * 0.005) * uSway;
  vec3 c = texture2D(tDiffuse, uv).rgb;
  if (uSway > 0.0) { vec3 c2 = texture2D(tDiffuse, uv + vec2(0.006 * sin(uTime * 1.3), 0.003) * uSway).rgb; c = mix(c, c2, 0.4 * uSway); }
  float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat);
  c *= mix(vec3(1.0), vec3(1.08, 1.0, 0.88), uWarm);
  c *= 1.0 - uVig * smoothstep(0.35, 0.95, length(d * vec2(uAsp, 1.0)) / max(1.0, uAsp * 0.62));
  c += (rnd(uv * vec2(1280.0, 720.0) + fract(uTime * 7.31)) - 0.5) * uGrain;
  c = mix(c, vec3(1.0, 0.98, 0.94), clamp(uFlash, 0.0, 1.0)); c = mix(c, vec3(0.0), clamp(uBlack, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0); }`;

export class Engine {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 900);
  composer: EffectComposer | null = null; bloom: UnrealBloomPass | null = null; grade: ShaderPass | null = null;
  world: World | null = null; lyrics: Lyrics | null = null; ready = false; shotIndex = -1; w = 1280; h = 720;
  G: Grade = { bloom: 1, vig: 0.35, warm: 0, sway: 0, flash: 0, black: 0, sat: 1.05, grain: 0.025, blur: 0 };
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.NeutralToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.add(this.cam);
  }
  async load(onP: (p: number) => void) {
    onP(0.08); await Promise.all([loadAtlas(), loadFont()]); onP(0.45);
    buildGlyphs(TITLE + CREDITS.map((c) => c.join('·')).join('') + '鲸鱼娘番外慢慢来');
    this.world = new World(this.scene); onP(0.65);
    bindShots(this.world, this.cam, this.G);
    const ly = new Lyrics(); this.lyrics = ly; this.cam.add(ly.root);
    // 片名：四个字踩在第 4~7 拍上
    ly.card(TITLE, timeOfBeat(4), 0.4615, 6.9, { size: 0.95, y: 0.35, style: 'calm', pal: [0xfff4e0, 0xffb347, 0xff8a5c, 0x7a3b2e] });
    ly.card('鲸鱼娘番外', timeOfBeat(9), 0.23, 6.95, { size: 0.36, y: -0.5, style: 'calm', pal: [0xffffff, 0xffffff, 0xffd6a0, 0x5b3a6b] });
    CREDITS.forEach(([n, r], i) => ly.card(`${n}·${r}`, LYRICS[35].end + 1.2 + i * 0.46, 0.06, barStart(93) - 0.3, { size: 0.3, style: 'calm', x: i % 2 ? 2.1 : -2.1, y: 1.25 - Math.floor(i / 2) * 0.55, pal: [0xfff7ea, 0xfff7ea, 0xffd6a0, 0x4b2d6b] }));
    ly.card('慌啥子嘛 慢慢来', barStart(93) + 0.2, 0.4615, DURATION - 1.2, { size: 0.7, y: 0.2, style: 'sleep', pal: [0xfff4e0, 0xffb347, 0xff8a5c, 0x7a3b2e] });
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.25, 0.5, 0.9); this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uVig: { value: 0.35 }, uGrain: { value: 0.025 }, uFlash: { value: 0 }, uBlack: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 }, uSway: { value: 0 }, uSat: { value: 1 }, uAsp: { value: 16 / 9 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.grade);
    this.setSize(this.w, this.h);
    this.render(0.01); this.render(LS(6)); this.render(LS(18)); // 预热着色器
    this.ready = true; onP(1);
  }
  setSize(w: number, h: number) {
    this.w = Math.max(2, w); this.h = Math.max(2, h);
    this.renderer.setSize(this.w, this.h, false); this.cam.aspect = this.w / this.h; this.cam.updateProjectionMatrix();
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(this.w, this.h); }
    if (this.grade) this.grade.uniforms.uAsp.value = this.w / this.h;
  }
  shotAt(t: number) { let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].a) i = k; return i; }
  lineAt(t: number) { let cur = -1; for (let i = 0; i < LYRICS.length; i++) if (t >= LYRICS[i].t[0] - 0.3 && t <= LYRICS[i].end + 0.5) cur = i; return cur; }
  render(t: number, hideLyrics = false) {
    const W = this.world; if (!W || !this.composer || !this.lyrics) return;
    t = clamp(t, 0, DURATION - 0.001);
    const i = this.shotAt(t); const sh = SHOTS[i]; this.shotIndex = i;
    Object.assign(this.G, { bloom: 1, vig: 0.35, warm: 0, sway: 0, flash: 0, black: 0, sat: 1.05, grain: 0.025 });
    W.reset();
    const ctx: Ctx = { t, lt: t - sh.a, p: clamp((t - sh.a) / (sh.b - sh.a)), dur: sh.b - sh.a, a: sh.a, b: sh.b };
    sh.f(ctx);
    // 切镜：一点点白闪 + 推一下
    const cut = 1 - range(ctx.lt, 0, 0.25); if (i > 0 && this.G.flash < 0.15) this.G.flash = Math.max(this.G.flash, cut * 0.12);
    // 副歌的底鼓：镜头轻轻呼吸
    const chorus = (t > SHOTS[3].a && t < SHOTS[7].a) || (t > SHOTS[15].a && t < SHOTS[23].a) || (t > SHOTS[33].a && t < SHOTS[41].a);
    const kb = kick(t) * (chorus ? 1 : 0.35);
    this.cam.translateZ(-kb * 0.12 - cut * 0.15);
    this.cam.rotateZ(Math.sin(t * 0.7) * 0.004 + Math.sin(t * 1.9) * 0.002);
    this.lyrics.hidden = hideLyrics; this.lyrics.update(t, this.cam.fov);
    const k = this.lyrics.kick; if (k > 0) { this.cam.translateZ(-k * 0.06); this.cam.rotateZ(Math.sin(t * 50) * 0.003 * k); }
    this.cam.updateMatrixWorld();
    for (const a of Object.values(W.cast)) a.update(t, this.cam); for (const p of W.props) p.update(t, this.cam);
    W.sky.position.copy(this.cam.position); W.stars.points.position.copy(this.cam.position);
    const g = this.G; const gu = this.grade!.uniforms;
    gu.uVig.value = g.vig; gu.uGrain.value = g.grain; gu.uFlash.value = g.flash; gu.uBlack.value = g.black; gu.uTime.value = t; gu.uWarm.value = g.warm; gu.uSway.value = g.sway; gu.uSat.value = g.sat;
    this.bloom!.strength = (0.2 + kb * 0.1) * g.bloom;
    this.composer.render();
  }
}
