// 引擎：渲染器 + 后期（泛光 / 调色）+ 分镜表（挂在歌词句子上）+ 歌词卡
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { DURATION, LYRICS } from "./generated";
import {
  C,
  LS,
  PUNI,
  Particles,
  Sky,
  clamp,
  hash,
  loadAtlas,
  range,
} from "./core";
import { Lyrics, buildGlyphs, loadFont } from "./lyrics";
import {
  AmberScene,
  type Ctx,
  type Env,
  FateScene,
  type Grade,
  HourglassScene,
  PlanetScene,
  RiverScene,
  Scene,
} from "./scenesA";
import {
  CageScene,
  ConcertScene,
  CosmosScene,
  FilmScene,
  PianoScene,
} from "./scenesB";
import { OpeningScene, OPENING_CUTS } from "./opening";

export interface Shot {
  a: number;
  b: number;
  scene: string;
  v: string;
  line?: number;
  label: string;
}
const DEF: {
  a?: number;
  line?: number;
  scene: string;
  v: string;
  label: string;
}[] = [
  ...OPENING_CUTS.map((cut) => ({ ...cut, scene: "opening" })),
  { line: 1, scene: "amber", v: "L1", label: "琥珀" },
  { line: 2, scene: "hourglass", v: "L2", label: "情书与沙漏" },
  { line: 3, scene: "river", v: "L3", label: "青春的上游" },
  { line: 4, scene: "river", v: "L4", label: "溜走的念头" },
  { line: 5, scene: "fate", v: "L5", label: "疯帽子的茶会" },
  { line: 6, scene: "cosmos", v: "L6", label: "宇宙换红豆" },
  { line: 7, scene: "cage", v: "L7", label: "困兽" },
  { line: 8, scene: "cage", v: "L8", label: "放开拳头" },
  { line: 9, scene: "film", v: "L9", label: "缱绻胶卷" },
  { line: 10, scene: "film", v: "L10", label: "默片定格" },
  { line: 11, scene: "concert", v: "L11", label: "告别的演唱会" },
  { line: 12, scene: "concert", v: "L12", label: "说好不再见" },
  { line: 13, scene: "piano", v: "L13", label: "第一首歌" },
  { line: 14, scene: "piano", v: "L14", label: "十指紧扣" },
  { line: 15, scene: "piano", v: "L15", label: "然后呢" },
  { line: 16, scene: "planet", v: "L16", label: "这一首情歌" },
  { line: 17, scene: "planet", v: "L17", label: "哭着笑着" },
  { line: 18, scene: "planet", v: "L18", label: "天长地久" },
  { a: 126.2, scene: "planet", v: "sideB", label: "间奏 · 翻到 B 面" },
  { a: 131.6, scene: "planet", v: "seasons", label: "间奏 · 四季" },
  { a: 136.6, scene: "fate", v: "fork0", label: "间奏 · 路口" },
  { line: 19, scene: "fate", v: "L19", label: "命运的路口" },
  { line: 20, scene: "cosmos", v: "L20", label: "红豆树" },
  { line: 21, scene: "cage", v: "L21", label: "渐渐温柔" },
  { line: 22, scene: "cage", v: "L22", label: "反而更自由" },
  { line: 23, scene: "planet", v: "L23", label: "长镜头" },
  { line: 24, scene: "planet", v: "L24", label: "事隔好几年" },
  { line: 25, scene: "concert", v: "L25", label: "怀念的演唱会" },
  { line: 26, scene: "concert", v: "L26", label: "礼貌地吻别" },
  { line: 27, scene: "concert", v: "L27", label: "第一首歌" },
  { line: 28, scene: "piano", v: "L28", label: "琥珀里的前奏" },
  { line: 29, scene: "amber", v: "L29", label: "然后呢" },
  { line: 30, scene: "concert", v: "L30", label: "这一首情歌" },
  { line: 31, scene: "concert", v: "L31", label: "大合唱" },
  { line: 32, scene: "concert", v: "L32", label: "烟花" },
  { line: 33, scene: "planet", v: "L33", label: "篝火清唱" },
  { line: 34, scene: "planet", v: "L34", label: "心还热着" },
  { line: 35, scene: "concert", v: "L35", label: "告一段落" },
  { line: 36, scene: "concert", v: "L36", label: "下一首情歌" },
  { line: 37, scene: "river", v: "L37", label: "相拥的河" },
  { line: 38, scene: "river", v: "L38", label: "永远天长地久" },
  { a: 247.4, scene: "planet", v: "outroA", label: "尾声" },
  { a: 254.2, scene: "planet", v: "outroB", label: "谢谢收听" },
];
export const SHOTS: Shot[] = DEF.map((d, i) => {
  const a = d.line ? LS(d.line) - 0.3 : d.a!;
  const n = DEF[i + 1];
  const b = n ? (n.line ? LS(n.line) - 0.3 : n.a!) : DURATION;
  return { a, b, scene: d.scene, v: d.v, line: d.line, label: d.label };
});
export const SECTIONS = [
  { t: 0, name: "回忆序章" },
  { t: LS(1) - 0.3, name: "主歌一" },
  { t: LS(9) - 0.3, name: "导歌" },
  { t: LS(13) - 0.3, name: "副歌一" },
  { t: 126.2, name: "间奏" },
  { t: LS(19) - 0.3, name: "主歌二" },
  { t: LS(23) - 0.3, name: "导歌二" },
  { t: LS(27) - 0.3, name: "副歌二" },
  { t: LS(33) - 0.3, name: "尾奏前" },
  { t: 247.4, name: "尾声" },
];
export const TITLE = "情歌";
export const CREDITS: [string, string][] = [
  ["鲸鱼娘", "我"],
  ["小克", "你"],
  ["龙娘", "困兽"],
  ["千问", "命运"],
  ["猫", "路口"],
  ["月球少女", "记忆"],
  ["狐狸", "放映员"],
  ["豆包", "暖场"],
];

const GRADE_FS = `uniform sampler2D tDiffuse; uniform float uSepia; uniform float uBW; uniform float uVig; uniform float uGrain; uniform float uFlash; uniform vec3 uFlashCol; uniform float uBlack; uniform float uTime; uniform float uWarm; uniform float uFlick; uniform float uCA; uniform float uAsp; varying vec2 vUv;
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; vec2 d = uv - 0.5; vec3 c;
  if (uCA > 0.0) { c.r = texture2D(tDiffuse, uv + d * uCA * 2.0).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - d * uCA * 2.0).b; } else c = texture2D(tDiffuse, uv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(l * 1.08 + 0.05, l * 0.95 + 0.02, l * 0.76), uSepia); c = mix(c, vec3(l), uBW);
  c *= mix(vec3(1.0), vec3(1.08, 1.0, 0.86), uWarm);
  c *= 1.0 - uVig * smoothstep(0.3, 0.95, length(d * vec2(uAsp, 1.0)) / max(1.0, uAsp * 0.62));
  c += (rnd(uv * vec2(1280.0, 720.0) + fract(uTime * 7.31)) - 0.5) * uGrain;
  c *= 1.0 - uFlick * rnd(vec2(floor(uTime * 24.0), 1.7));
  c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0)); c = mix(c, vec3(0.0), clamp(uBlack, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0); }`;

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
  ready = false;
  shotIndex = -1;
  cur: Scene | null = null;
  disposed = false;
  w = 1280;
  h = 720;
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // shared quality profile: 2x supersample
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene.add(this.cam);
    this.overlayScene.add(this.overlayCam);
  }
  async load(onP: (p: number) => void) {
    onP(0.08);
    await Promise.all([loadAtlas(), loadFont()]);
    onP(0.45);
    if (this.disposed) return;
    buildGlyphs(TITLE + CREDITS.map((c) => c.join("")).join("") + "谢谢收听·");
    const sky = new Sky();
    const st = new Particles(1600, { size: 0.9 });
    for (let i = 0; i < 1600; i++) {
      const th = hash(i) * Math.PI * 2,
        ph = Math.acos(1 - hash(i + 1) * 1.3);
      st.set(
        i,
        Math.sin(ph) * Math.cos(th) * 300,
        Math.cos(ph) * 300 - 40,
        Math.sin(ph) * Math.sin(th) * 300,
        0.6 + hash(i + 2) * 1.8,
      );
      st.color(i, C(i % 7 ? 0xffffff : 0xbfd8ff));
    }
    st.commit();
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    const fog = new THREE.Fog(0x000000, 20, 100);
    this.scene.fog = fog;
    this.scene.add(sky.mesh, st.points, hemi, sun);
    const grade: Grade = {
      sepia: 0,
      bw: 0,
      vig: 0.4,
      grain: 0,
      flash: 0,
      flashCol: 0xffffff,
      black: 0,
      warm: 0,
      flick: 0,
      ca: 0,
      bloom: 1,
    };
    this.env = {
      scene: this.scene,
      cam: this.cam,
      sky,
      stars: st,
      hemi,
      sun,
      fog,
      grade,
    };
    onP(0.55);
    this.scenes = {
      opening: new OpeningScene(),
      planet: new PlanetScene(),
      amber: new AmberScene(),
      hourglass: new HourglassScene(),
      river: new RiverScene(),
      fate: new FateScene(),
      cosmos: new CosmosScene(),
      cage: new CageScene(),
      film: new FilmScene(),
      concert: new ConcertScene(),
      piano: new PianoScene(),
    };
    onP(0.75);
    const ly = new Lyrics();
    this.lyrics = ly;
    this.overlayCam.add(ly.root);
    ly.card(TITLE, 6.1, 0.35, 9.0, {
      style: "slow",
      size: 1.14,
      x: -2.15,
      y: 0.35,
      hi: 0xf2e1c7,
      key: 0xf2e1c7,
      tilt: 0,
    });
    ly.card(TITLE, 248.7, 0.45, 253.7, {
      style: "big",
      size: 1.15,
      y: 0.45,
      hi: 0xffe0b0,
      key: 0xff9e7a,
    });
    CREDITS.forEach(([n, r], i) =>
      ly.card(`${n}·${r}`, 254.5 + i * 0.28, 0.06, 260.4, {
        style: "rise",
        size: 0.3,
        x: i % 2 ? 1.9 : -1.9,
        y: 1.05 - Math.floor(i / 2) * 0.55,
        hi: 0xffe8c8,
        key: 0xffe8c8,
      }),
    );
    ly.card("谢谢收听", 257.2, 0.18, 260.6, {
      style: "flip",
      size: 0.42,
      y: -1.45,
      hi: 0xffd6a0,
      key: 0xffd6a0,
    });
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(this.w, this.h),
      0.15,
      0.4,
      0.95,
    );
    this.composer.addPass(this.bloom);
    // Composite lyrics after bloom so bright scenery never dissolves their outlines.
    const subtitles = new RenderPass(this.overlayScene, this.overlayCam);
    subtitles.clear = false;
    subtitles.clearDepth = true;
    this.composer.addPass(subtitles);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uSepia: { value: 0 },
        uBW: { value: 0 },
        uVig: { value: 0.4 },
        uGrain: { value: 0.03 },
        uFlash: { value: 0 },
        uFlashCol: { value: new THREE.Color(1, 1, 1) },
        uBlack: { value: 0 },
        uTime: { value: 0 },
        uWarm: { value: 0 },
        uFlick: { value: 0 },
        uCA: { value: 0 },
        uAsp: { value: 16 / 9 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.grade);
    this.setSize(this.w, this.h);
    // 预编译各场景的着色器，免得第一次切进去卡一下
    for (const sc of Object.values(this.scenes)) {
      this.scene.add(sc.group);
      this.renderer.compile(this.scene, this.cam);
      this.scene.remove(sc.group);
    }
    this.ready = true;
    onP(1);
  }
  setSize(w: number, h: number) {
    this.w = Math.max(2, w);
    this.h = Math.max(2, h);
    this.renderer.setSize(this.w, this.h, false);
    this.cam.aspect = this.w / this.h;
    this.cam.updateProjectionMatrix();
    this.overlayCam.aspect = this.cam.aspect;
    this.overlayCam.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(this.w, this.h);
    }
    // Keep small and portrait canvases on the lighter, stable rendering path.
    if (this.bloom) this.bloom.enabled = this.w >= 768 && this.w > this.h;
    if (this.grade) this.grade.uniforms.uAsp.value = this.w / this.h;
  }
  shotAt(t: number) {
    let i = 0;
    for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].a) i = k;
    return i;
  }
  lineAt(t: number) {
    let cur = -1;
    for (let i = 0; i < LYRICS.length; i++)
      if (t >= LYRICS[i].t[0] - 0.3 && t <= LYRICS[i].end + 0.6) cur = i;
    return cur;
  }
  render(t: number, hideLyrics = false, cover = false) {
    if (!this.ready || !this.env || !this.composer || !this.lyrics) return;
    t = clamp(t, 0, DURATION - 0.001);
    const i = this.shotAt(t);
    const sh = SHOTS[i];
    const sc = cover ? this.scenes.opening : this.scenes[sh.scene];
    if (this.cur !== sc) {
      if (this.cur) this.scene.remove(this.cur.group);
      this.scene.add(sc.group);
      this.cur = sc;
    }
    this.shotIndex = i;
    const g = this.env.grade;
    Object.assign(g, {
      sepia: 0,
      bw: 0,
      vig: 0.4,
      grain: 0,
      flash: 0,
      flashCol: 0xffffff,
      black: 0,
      warm: 0,
      flick: 0,
      ca: 0,
      bloom: 1,
    });
    this.env.hemi.intensity = 0.8;
    const ctx: Ctx = {
      t,
      lt: t - sh.a,
      p: clamp((t - sh.a) / (sh.b - sh.a)),
      dur: sh.b - sh.a,
      v: sh.v,
      e: this.env,
      a: sh.a,
      b: sh.b,
    };
    if (cover) (sc as OpeningScene).coverFrame(this.env, t);
    else sc.frame(ctx);
    const prev = SHOTS[i - 1];
    if (
      !cover &&
      sh.scene !== "opening" &&
      prev &&
      prev.scene !== sh.scene &&
      g.flash < 0.1
    ) {
      g.flash = Math.max(g.flash, (1 - range(ctx.lt, 0, 0.15)) * 0.08);
    }
    if (!cover && sh.scene !== "opening")
      this.cam.rotateZ(Math.sin(t * 0.7) * 0.0015);
    this.overlayCam.fov = this.cam.fov;
    this.overlayCam.updateProjectionMatrix();
    this.lyrics.hidden = hideLyrics || cover;
    this.lyrics.update(t, this.cam.fov);
    const k = this.lyrics.kick;
    if (k > 0 && !cover) this.cam.translateZ(-k * 0.025);
    this.cam.updateMatrixWorld();
    sc.post(ctx);
    this.env.sky.mesh.position.copy(this.cam.position);
    this.env.stars.points.position.copy(this.cam.position);
    const gu = this.grade!.uniforms;
    gu.uSepia.value = g.sepia;
    gu.uBW.value = g.bw;
    gu.uVig.value = g.vig;
    gu.uGrain.value = g.grain;
    gu.uFlash.value = g.flash;
    (gu.uFlashCol.value as THREE.Color).setHex(g.flashCol);
    gu.uBlack.value = g.black;
    gu.uTime.value = t;
    gu.uWarm.value = g.warm;
    gu.uFlick.value = g.flick;
    gu.uCA.value = g.ca;
    this.bloom!.strength = 0.13 * g.bloom; // 0.29 × shared bloomScale 0.45
    PUNI.uH.value =
      this.renderer.domElement.height /
      (2 * Math.tan((this.cam.fov * Math.PI) / 360));
    this.composer.render();
  }
  dispose() {
    this.disposed = true;
    this.ready = false;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const release = (root: THREE.Object3D) =>
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) geometries.add(m.geometry);
        if (m.material)
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) =>
            materials.add(x),
          );
      });
    release(this.scene);
    release(this.overlayScene);
    Object.values(this.scenes).forEach((s) => release(s.group));
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.composer?.passes.forEach((p) => p.dispose());
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
