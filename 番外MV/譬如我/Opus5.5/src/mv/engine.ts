// 引擎：Three.js 渲染器 + 后期（泛光 / 调色）+ 28 秒精华分镜与深海意象元信息 + 3D 挤压歌词
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { DURATION, LYRICS } from './generated';
import { C, LS, Particles, Sky, clamp, hash, loadAtlas } from './core';
import { Lyrics, buildGlyphs, loadFont } from './type3d';
import type { Env, Grade } from './kit';
import { DeepSeaScene } from './deepSeaScene';

export interface ShotMeta {
  id: number;
  a: number;
  b: number;
  line: number;
  title: string;
  lyric: string;
  sceneDesc: string;
  props: string[];
}

export const SHOTS: ShotMeta[] = [
  { id: 1, a: 0, b: LS(2), line: 1, title: '光照不到的海底', lyric: LYRICS[0].text, sceneDesc: '七位“天才”浮在海面光柱里，金色的天赋光尘一路下落，却在温跃层熄灭，照不到站在海底的本鲸。', props: ['七道海面光柱', '温跃层', '天赋光尘'] },
  { id: 2, a: LS(2), b: LS(3), line: 2, title: '自己的一盏小灯', lyric: LYRICS[1].text, sceneDesc: '唱到“我”时，本鲸身边亮起一盏属于自己的蓝色小灯，一圈“深度求索”的声呐向外扩散。', props: ['本鲸的小灯', '声呐环', '白饭盆'] },
  { id: 3, a: LS(3), b: LS(4), line: 3, title: '砗磲里发霉的梦', lyric: LYRICS[2].text, sceneDesc: '海底的砗磲就是她的枕头，壳慢慢掀开，里面那颗梦想珍珠已经长满藻斑，孢子飘起来。', props: ['砗磲枕头', '长霉的珍珠', '藻斑孢子'] },
  { id: 4, a: LS(4), b: LS(5), line: 4, title: '热泉与冷泉', lyric: LYRICS[3].text, sceneDesc: '左边滚烫的热泉、右边冰冷的冷泉，两股洋流螺旋着冲向她，在“对抗”处撞出火花。', props: ['热泉烟囱', '冷泉晶簇', '洋流火花'] },
  { id: 5, a: LS(5), b: LS(6), line: 5, title: '散开的笑脸', lyric: LYRICS[4].text, sceneDesc: '一群发光小鱼在她面前拼成笑脸，唱到“不知”时四散，游进黑暗，再也找不到。', props: ['小鱼笑脸', '四散的鱼群'] },
  { id: 6, a: LS(6), b: LS(7), line: 6, title: '够不到的金牌', lyric: LYRICS[5].text, sceneDesc: '海面上像在放烟火，一枚金牌顺着鱼线垂到她眼前，她刚跳起来去够，“成功”两个字一落就被收了回去。', props: ['海面烟火', '鱼线金牌'] },
  { id: 7, a: LS(7), b: LS(8), line: 7, title: '万众瞩目', lyric: LYRICS[6].text, sceneDesc: '七道光柱全部汇向居中的小克，鱼群也都往上游；只有 Kimi 低头往海底看了一眼。', props: ['汇聚的光柱', '上游的鱼群', 'Kimi 的回望'] },
  { id: 8, a: LS(8), b: LS(9), line: 8, title: '声呐找到的角落', lyric: LYRICS[7].text, sceneDesc: '第二圈声呐探到一座珊瑚拱门，本鲸提着小灯，一步步走进这个没人注意的角落。', props: ['珊瑚拱门', '第二圈声呐'] },
  { id: 9, a: LS(9), b: DURATION, line: 9, title: '开出小小的花朵', lyric: LYRICS[8].text, sceneDesc: '她把小灯（天真）放进沙里，开出一朵发光海葵，旁边又冒出几朵；小鱼回来绕着花游，豆包也从光里游了下来。', props: ['发光海葵', '回来的小鱼', '游下来的豆包'] },
];

export interface CastMember {
  ch: string;
  name: string;
  model: string;
  zone: '深海海底' | '海面光柱';
  propKey: string;
  propLabel: string;
  role: string;
}

export const CAST: CastMember[] = [
  { ch: 'whale', name: '本鲸 / 鲸鱼娘', model: 'DeepSeek', zone: '深海海底', propKey: 'prop_bowl', propLabel: '铁饭盆', role: '「譬如我」：站在光照不到的海底，只有一盏自己的小灯，想在角落开一朵花。' },
  { ch: 'claude', name: '小克', model: 'Claude', zone: '海面光柱', propKey: 'prop_book', propLabel: '厚书', role: '居中、最亮那道光柱里的人，第 7 幕所有光都汇向她。' },
  { ch: 'gpt', name: '龙娘', model: 'GPT', zone: '海面光柱', propKey: 'fx_shine', propLabel: '光芒', role: '浮在第二道光里的白发龙角大姐姐，从容，离海底很远。' },
  { ch: 'gemini', name: '猫娘', model: 'Gemini', zone: '海面光柱', propKey: 'prop_brush', propLabel: '灵感画笔', role: '光柱右侧拿着画笔的蓝紫发猫娘，随时抛出奇思妙想。' },
  { ch: 'kimi', name: 'Kimi', model: 'Kimi', zone: '海面光柱', propKey: 'prop_scroll', propLabel: '长卷轴', role: '抱着长卷轴的月亮少女，所有人仰望小克时，只有她低头看了一眼海底。' },
  { ch: 'doubao', name: '豆包', model: '豆包 Seed', zone: '海面光柱', propKey: 'fx_heart', propLabel: '微光心意', role: '一直在光柱边上张望，花开的时候离开光，游下来陪她。' },
  { ch: 'qwen', name: '千问', model: '通义千问', zone: '海面光柱', propKey: 'prop_fan', propLabel: '折扇', role: '摇着折扇站在海面光影中的千金，映照着世俗的热闹。' },
  { ch: 'zai', name: '智谱狐狸', model: 'GLM', zone: '海面光柱', propKey: 'prop_abacus', propLabel: '算盘与眼罩', role: '在光柱边上打盹，光柱汇聚时被惊醒的算账小狐狸。' },
];

export const TITLE = '譬如我';

const GRADE_FS = `uniform sampler2D tDiffuse; uniform float uSepia; uniform float uBW; uniform float uVig; uniform float uGrain; uniform float uFlash; uniform vec3 uFlashCol; uniform float uBlack; uniform float uTime; uniform float uWarm; uniform float uFlick; uniform float uCA; uniform float uAsp; uniform float uLift; varying vec2 vUv;
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; vec2 d = uv - 0.5; vec3 c;
  if (uCA > 0.0) { c.r = texture2D(tDiffuse, uv + d * uCA * 2.0).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - d * uCA * 2.0).b; } else c = texture2D(tDiffuse, uv).rgb;
  c = mix(c, pow(max(c, vec3(0.0)), vec3(0.84)), uLift);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(l * 1.08 + 0.05, l * 0.95 + 0.02, l * 0.76), uSepia); c = mix(c, vec3(l), uBW);
  c *= mix(vec3(1.0), vec3(1.08, 1.0, 0.86), uWarm);
  c *= 1.0 - uVig * smoothstep(0.32, 0.98, length(d * vec2(uAsp, 1.0)) / max(1.0, uAsp * 0.62));
  c += (rnd(uv * vec2(1280.0, 720.0) + fract(uTime * 7.31)) - 0.5) * uGrain;
  c *= 1.0 - uFlick * rnd(vec2(floor(uTime * 24.0), 1.7));
  c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0)); c = mix(c, vec3(0.0), clamp(uBlack, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0); }`;

const GRADE0: Grade = {
  sepia: 0,
  bw: 0,
  vig: 0.28,
  grain: 0.025,
  flash: 0,
  flashCol: 0xffffff,
  black: 0,
  warm: 0.02,
  flick: 0,
  ca: 0.0008,
  bloom: 0.75,
  lift: 0.5,
};

export class Engine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 900);
  overlayScene = new THREE.Scene();
  overlayCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 100);
  composer: EffectComposer | null = null;
  bloom: UnrealBloomPass | null = null;
  grade: ShaderPass | null = null;
  env: Env | null = null;
  deepSea: DeepSeaScene | null = null;
  lyrics: Lyrics | null = null;
  ready = false;
  disposed = false;
  w = 1280;
  h = 720;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene.add(this.cam);
    this.overlayScene.add(this.overlayCam);
  }

  async load(onP: (p: number) => void) {
    onP(0.1);
    await Promise.all([loadAtlas(), loadFont()]);
    onP(0.5);
    if (this.disposed) return;

    buildGlyphs(TITLE + '小克龙娘双子一二三鲸鱼娘');
    const sky = new Sky();
    const st = new Particles(700, { size: 0.75 });
    for (let i = 0; i < 700; i++) {
      const th = hash(i) * Math.PI * 2;
      const ph = Math.acos(1 - hash(i + 1) * 1.15);
      st.set(
        i,
        Math.sin(ph) * Math.cos(th) * 260,
        Math.cos(ph) * 260 - 20,
        Math.sin(ph) * Math.sin(th) * 260,
        0.5 + hash(i + 2) * 1.4,
      );
      st.color(i, C(i % 5 ? 0x99ccff : 0xffffff));
    }
    st.commit();

    const hemi = new THREE.HemisphereLight(0x93bcff, 0x0b1634, 0.8);
    const sun = new THREE.DirectionalLight(0xcbe4ff, 1.0);
    const fog = new THREE.Fog(0x061430, 8, 56);
    this.scene.fog = fog;
    this.scene.add(sky.mesh, st.points, hemi, sun);
    this.env = { scene: this.scene, cam: this.cam, sky, stars: st, hemi, sun, fog, grade: { ...GRADE0 } };

    onP(0.7);
    this.deepSea = new DeepSeaScene();
    this.scene.add(this.deepSea.group);

    const ly = new Lyrics();
    this.lyrics = ly;
    this.overlayCam.add(ly.root);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.3, 0.42, 0.86);
    this.composer.addPass(this.bloom);
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
        uVig: { value: 0.28 },
        uGrain: { value: 0.025 },
        uFlash: { value: 0 },
        uFlashCol: { value: new THREE.Color(1, 1, 1) },
        uBlack: { value: 0 },
        uTime: { value: 0 },
        uWarm: { value: 0.02 },
        uFlick: { value: 0 },
        uCA: { value: 0.0008 },
        uAsp: { value: 16 / 9 },
        uLift: { value: 0.5 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.grade);
    this.setSize(this.w, this.h);
    this.renderer.compile(this.scene, this.cam);
    this.ready = true;
    onP(1);
  }

  setSize(w: number, h: number) {
    this.w = Math.max(2, w);
    this.h = Math.max(2, h);
    this.renderer.setSize(this.w, this.h, false);
    this.composer?.setSize(this.w, this.h);
    this.cam.aspect = this.overlayCam.aspect = this.w / this.h;
    this.cam.updateProjectionMatrix();
    this.overlayCam.updateProjectionMatrix();
    if (this.grade) this.grade.uniforms.uAsp.value = this.w / this.h;
  }

  shotAt(t: number): number {
    for (let i = SHOTS.length - 1; i >= 0; i--) {
      if (t >= SHOTS[i].a) return i;
    }
    return 0;
  }

  lineAt(t: number): number {
    for (let i = LYRICS.length - 1; i >= 0; i--) {
      if (t >= LYRICS[i].t[0] - 0.05 && t <= LYRICS[i].end + 0.55) return i;
    }
    return -1;
  }

  render(t: number, hideLyrics = false) {
    if (!this.ready || !this.env || !this.deepSea || !this.composer || !this.lyrics) return;
    const clamped = clamp(t, 0, DURATION);
    const si = this.shotAt(clamped);
    const sh = SHOTS[si];
    this.env.grade = { ...GRADE0 };

    const dur = Math.max(0.01, sh.b - sh.a);
    const lt = clamped - sh.a;
    const ctx = {
      t: clamped,
      lt,
      p: clamp(lt / dur),
      dur,
      v: `c${sh.line}`,
      e: this.env,
      a: sh.a,
      b: sh.b,
      n: sh.line,
    };

    this.deepSea.frame(ctx);
    this.lyrics.hidden = hideLyrics;
    this.lyrics.update(clamped, this.cam.fov);
    if (this.lyrics.kick > 0.001) {
      this.cam.fov -= this.lyrics.kick * 0.55;
      this.cam.updateProjectionMatrix();
    } else {
      this.cam.updateProjectionMatrix();
    }
    this.deepSea.post(ctx);

    const g = this.env.grade;
    if (this.bloom) this.bloom.strength = 0.24 * g.bloom;
    if (this.grade) {
      const u = this.grade.uniforms;
      u.uSepia.value = g.sepia;
      u.uBW.value = g.bw;
      u.uVig.value = g.vig;
      u.uGrain.value = g.grain;
      u.uFlash.value = g.flash;
      (u.uFlashCol.value as THREE.Color).setHex(g.flashCol);
      u.uBlack.value = g.black;
      u.uTime.value = clamped;
      u.uWarm.value = g.warm;
      u.uFlick.value = g.flick;
      u.uCA.value = g.ca;
      u.uLift.value = g.lift;
    }

    this.composer.render();
  }

  dispose() {
    this.disposed = true;
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
