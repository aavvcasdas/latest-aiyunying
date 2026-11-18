// 主渲染引擎：Three.js 场景管理 + UnrealBloom 柔光 + 古风电影调色 + 独立清晰三维逐字逐词歌词合成
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  DURATION,
  type SceneKey,
  type Shot,
  beatPulse,
  energyAt,
  shotAt,
} from './timeline';
import {
  ParticleField,
  Sky,
  clamp,
  glowTex,
  hash,
  loadAtlas,
  range,
} from './core';
import { Lyrics3DRig, buildGlyphAtlas, loadLyricFont } from './lyrics3d';
import {
  type BaseScene,
  CanyonRoadScene,
  type Env,
  type GradeState,
  GuqinGroveScene,
  InkScrollScene,
  LanternPathScene,
  SakuraTreeScene,
  SunsetCoastScene,
  WaterPavilionScene,
} from './scenesA';
import {
  BattlefieldScene,
  CloudPeaksScene,
  DragonSwordScene,
  MirrorLakeScene,
  RainBridgeScene,
  SnowSummitScene,
  SpiritSkyScene,
  WeddingHallScene,
} from './scenesB';

const GRADE_VS = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const GRADE_FS = `uniform sampler2D tDiffuse;
uniform float uVig;
uniform float uGrain;
uniform float uWarm;
uniform float uCool;
uniform float uSat;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform float uBlack;
uniform float uCA;
uniform float uTime;
varying vec2 vUv;

float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = vUv;
  vec2 d = uv - 0.5;
  vec3 c;
  if (uCA > 0.0001) {
    c.r = texture2D(tDiffuse, uv + d * uCA * 2.0).r;
    c.g = texture2D(tDiffuse, uv).g;
    c.b = texture2D(tDiffuse, uv - d * uCA * 2.0).b;
  } else {
    c = texture2D(tDiffuse, uv).rgb;
  }
  // 柔和电影 S 曲线与饱和度
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, uSat);
  // 春樱暖金与霜雪冷蓝调色
  c *= mix(vec3(1.0), vec3(1.07, 1.0, 0.91), clamp(uWarm, 0.0, 1.0));
  c *= mix(vec3(1.0), vec3(0.9, 0.97, 1.09), clamp(uCool, 0.0, 1.0));
  // 自然电影暗角
  float dist = length(d * vec2(1.35, 1.0));
  c *= 1.0 - uVig * smoothstep(0.34, 0.92, dist);
  // 细腻胶片颗粒（确定性随时间跳动）
  float g = (rnd(uv * vec2(960.0, 540.0) + fract(uTime * 11.7)) - 0.5) * uGrain;
  c += g;
  // 刹那闪白与淡入淡出黑场
  c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0));
  c = mix(c, vec3(0.0), clamp(uBlack, 0.0, 1.0));
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

export class MvEngine {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.08, 900);
  overlayScene = new THREE.Scene();
  overlayCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 100);
  composer: EffectComposer | null = null;
  bloom: UnrealBloomPass | null = null;
  gradePass: ShaderPass | null = null;
  env: Env | null = null;
  scenes: Partial<Record<SceneKey, BaseScene>> = {};
  activeScene: BaseScene | null = null;
  lyrics: Lyrics3DRig | null = null;
  ready = false;
  disposed = false;
  width = 1280;
  height = 720;
  lastShot: Shot | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.scene.add(this.cam);
    this.overlayScene.add(this.overlayCam);
  }

  async init(onProgress?: (p: number) => void) {
    onProgress?.(0.1);
    await Promise.all([loadAtlas(), loadLyricFont()]);
    if (this.disposed) return;
    onProgress?.(0.45);

    buildGlyphAtlas();
    onProgress?.(0.62);

    // 全局天穹、繁星与三点灯光
    const sky = new Sky();
    const starField = new ParticleField(900, { map: glowTex(), scale: 0.72, opacity: 0.35, additive: true });
    for (let i = 0; i < 900; i++) {
      const th = hash(i * 2.1) * Math.PI * 2;
      const ph = Math.acos(1 - hash(i * 5.3) * 0.88);
      const R = 290;
      starField.set(
        i,
        Math.sin(ph) * Math.cos(th) * R,
        Math.cos(ph) * R,
        Math.sin(ph) * Math.sin(th) * R,
        0.55 + hash(i * 8.7) * 1.35,
        0,
      );
      starField.setColor(i, i % 5 === 0 ? 0xffd6e7 : i % 3 === 0 ? 0xbae6fd : 0xffffff);
    }
    starField.commit(true);

    const hemi = new THREE.HemisphereLight(0xfff0f5, 0x382840, 0.95);
    const sun = new THREE.DirectionalLight(0xffe6c8, 1.25);
    sun.position.set(8, 14, -20);
    const rim = new THREE.PointLight(0xffb3c6, 1.2, 24);
    rim.position.set(0, 2.8, 2.5);
    const fog = new THREE.Fog(0xf7c6d0, 14, 68);
    this.scene.fog = fog;
    this.scene.add(sky.mesh, starField.points, hemi, sun, rim);

    const grade: GradeState = {
      vig: 0.38, grain: 0.022, warm: 0.25, cool: 0, sat: 1.06,
      flash: 0, flashCol: 0xffffff, black: 0, ca: 0, bloom: 1.0,
    };
    this.env = { scene: this.scene, cam: this.cam, sky, stars: starField.points, hemi, sun, rim, fog, grade };

    // 注册全部 15 座原创三维古风场景（按需构建、秒开首屏）
    this.scenes = {
      sakuraTree: new SakuraTreeScene(),
      inkScroll: new InkScrollScene(),
      lanternPath: new LanternPathScene(),
      canyonRoad: new CanyonRoadScene(),
      guqinGrove: new GuqinGroveScene(),
      sunsetCoast: new SunsetCoastScene(),
      waterPavilion: new WaterPavilionScene(),
      dragonSword: new DragonSwordScene(),
      cloudPeaks: new CloudPeaksScene(),
      battlefield: new BattlefieldScene(),
      mirrorLake: new MirrorLakeScene(),
      rainBridge: new RainBridgeScene(),
      weddingHall: new WeddingHallScene(),
      snowSummit: new SnowSummitScene(),
      spiritSky: new SpiritSkyScene(),
    };
    // 预构建首屏古樱场景
    this.scenes.sakuraTree!.ensureBuilt(this.scene);
    onProgress?.(0.78);

    // 三维逐字逐词歌词挂在独立后期相机上（不受泛光糊边影响，字口锐利立体）
    const lyrics = new Lyrics3DRig();
    this.lyrics = lyrics;
    this.overlayCam.add(lyrics.root);

    // 后期管线：场景渲染 → 柔和泛光 → 古风电影调色 → 色彩空间输出
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 0.17, 0.42, 0.88);
    this.composer.addPass(this.bloom);
    this.gradePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uVig: { value: 0.38 },
        uGrain: { value: 0.022 },
        uWarm: { value: 0.25 },
        uCool: { value: 0 },
        uSat: { value: 1.06 },
        uFlash: { value: 0 },
        uFlashCol: { value: new THREE.Color(0xffffff) },
        uBlack: { value: 0 },
        uCA: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: GRADE_VS,
      fragmentShader: GRADE_FS,
    });
    this.composer.addPass(this.gradePass);
    this.composer.addPass(new OutputPass());

    this.ready = true;
    onProgress?.(1.0);
  }

  resize(w: number, h: number, dpr?: number) {
    const cw = Math.max(2, Math.round(w));
    const ch = Math.max(2, Math.round(h));
    const ratio = dpr ?? Math.min(window.devicePixelRatio || 1, 1.5);
    this.width = cw;
    this.height = ch;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(cw, ch, false);
    const aspect = cw / ch;
    this.cam.aspect = aspect;
    this.cam.updateProjectionMatrix();
    this.overlayCam.aspect = aspect;
    this.overlayCam.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(ratio);
      this.composer.setSize(cw, ch);
    }
    if (this.bloom) {
      this.bloom.resolution.set(Math.round(cw * 0.5), Math.round(ch * 0.5));
    }
  }

  setLyricsVisible(visible: boolean) {
    if (this.lyrics) this.lyrics.hidden = !visible;
  }

  renderAt(rawT: number): Shot | null {
    if (!this.ready || !this.env || !this.lyrics || !this.composer || !this.gradePass || !this.bloom) {
      return null;
    }
    const t = clamp(rawT, 0, DURATION);
    const shot = shotAt(t);
    this.lastShot = shot;

    // 切换分镜场景
    const nextScene = this.scenes[shot.scene];
    if (nextScene && nextScene !== this.activeScene) {
      if (this.activeScene) this.activeScene.root.visible = false;
      nextScene.ensureBuilt(this.scene);
      nextScene.root.visible = true;
      this.activeScene = nextScene;
    }

    // 重置本帧默认调色参数（保证任意跳转 100% 确定性）
    const g = this.env.grade;
    g.vig = 0.36; g.grain = 0.02; g.warm = 0.2; g.cool = 0; g.sat = 1.06;
    g.flash = 0; g.flashCol = 0xffffff; g.black = 0; g.ca = 0; g.bloom = 1.0;

    // 先求值歌词以获取本帧关键词落拍的相机推力 kick
    this.lyrics.update(t, this.cam.fov);

    const dt = Math.max(0, t - shot.a);
    const u = range(t, shot.a, shot.b);
    const pulse = beatPulse(t, 5.2);
    const energy = energyAt(t);

    this.activeScene?.update({
      t, u, dt, shot, pulse, energy,
      kick: this.lyrics.kick,
      env: this.env,
    });

    // 始终用当前镜头最终 FOV 同步三维歌词层，保证任意回跳 100% 逐像素一致
    if (this.overlayCam.fov !== this.cam.fov) {
      this.overlayCam.fov = this.cam.fov;
      this.overlayCam.updateProjectionMatrix();
    }
    this.lyrics.update(t, this.cam.fov);

    // 应用后期调色与泛光（丝滑电影柔光，保留人物五官锐度）
    this.bloom.strength = 0.16 * g.bloom;
    const gu = this.gradePass.uniforms;
    gu.uVig.value = g.vig;
    gu.uGrain.value = g.grain;
    gu.uWarm.value = g.warm;
    gu.uCool.value = g.cool;
    gu.uSat.value = g.sat;
    gu.uFlash.value = g.flash;
    gu.uFlashCol.value.setHex(g.flashCol);
    gu.uBlack.value = g.black;
    gu.uCA.value = g.ca;
    gu.uTime.value = t;

    this.renderer.autoClear = true;
    this.composer.render();

    // 泛光与调色之后单独叠加三维逐字逐词歌词（黑场淡出时同步隐藏）
    if (!this.lyrics.hidden && g.black < 0.96) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.overlayScene, this.overlayCam);
      this.renderer.autoClear = true;
    }

    return shot;
  }

  /** 离线确定性出帧钩子（兼容 shoot_opus_mv.mjs / shoot_vite_mv.mjs 与剧照下载） */
  captureFrame(t: number, clean = false, targetWidth?: number, mime: 'image/jpeg' | 'image/png' = 'image/jpeg'): string {
    const prevHidden = this.lyrics?.hidden ?? false;
    const prevW = this.width, prevH = this.height;
    if (targetWidth && Math.abs(targetWidth - prevW) > 2) {
      this.resize(targetWidth, Math.round((targetWidth * 9) / 16), 1);
    }
    if (this.lyrics) this.lyrics.hidden = clean;
    this.renderAt(t);
    const dataUrl = this.canvas.toDataURL(mime, 0.92);
    if (this.lyrics) this.lyrics.hidden = prevHidden;
    if (targetWidth && Math.abs(targetWidth - prevW) > 2) {
      this.resize(prevW, prevH);
      this.renderAt(t);
    }
    return dataUrl;
  }

  dispose() {
    this.disposed = true;
    this.composer?.dispose();
    this.renderer.dispose();
  }
}
