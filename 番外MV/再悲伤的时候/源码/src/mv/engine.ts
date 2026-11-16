// 引擎：three.js 世界（RenderPass）→ 泛光 → 调色/转场（闪白、黑场、眼皮、热浪、色散、颗粒）→ 输出；
// 歌词字卡在最上层单独渲染，保持清晰。render(t) 只读时间 t。
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { loadAtlas, makeTextures } from './core';
import { makeSets, type Sets } from './sets';
import { FONT, Subtitles, loadFont } from './subs';
import { SHOTS, gradeDefaults, shotAt } from './shots';

export const W = 1280, H = 720;   // 出片 1080p：镜头与字卡都是世界单位/世界空间，放大分辨率不改构图
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uFlash: { value: 0 }, uFade: { value: 0 }, uLid: { value: 0 }, uWarp: { value: 0 }, uSat: { value: 1 }, uVign: { value: 0.35 }, uSplit: { value: 0 }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uTint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFlash, uFade, uLid, uWarp, uSat, uVign, uSplit, uTime, uGrain; uniform vec3 uTint; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      if (uWarp > 0.0) { float band = smoothstep(0.2, 0.45, uv.y) * (1.0 - smoothstep(0.5, 0.78, uv.y)); uv.x += sin(uv.y*95.0 + uTime*9.0) * 0.0045 * uWarp * band; uv.y += sin(uv.x*55.0 + uTime*6.0) * 0.002 * uWarp * band; }
      vec3 c;
      if (uSplit > 0.0) { c.r = texture2D(tDiffuse, uv + vec2(uSplit*0.012, 0.0)).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - vec2(uSplit*0.012, 0.0)).b; }
      else c = texture2D(tDiffuse, uv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat) * uTint;
      vec2 d = vUv - 0.5; c *= 1.0 - uVign * smoothstep(0.2, 0.85, length(d * vec2(1.0, 0.72)) * 1.3);
      c += (h(vUv * 917.0 + fract(uTime * 7.0)) - 0.5) * uGrain * (0.4 + l);
      c = mix(c, vec3(1.0), clamp(uFlash, 0.0, 1.0)); c = mix(c, vec3(0.0), clamp(uFade, 0.0, 1.0));
      if (uLid > 0.001) { float x = (vUv.x - 0.5) * 2.0; float edge = (1.0 - uLid) * 0.8 * (1.0 - 0.38 * x * x); float m = smoothstep(edge - 0.015, edge + 0.01, abs(vUv.y - 0.5)); c = mix(c, vec3(0.0), m); }
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class MV {
  renderer: THREE.WebGLRenderer; composer: EffectComposer; rp: RenderPass; bloom: UnrealBloomPass; grade: ShaderPass;
  cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 1000); S: Sets; subs: Subtitles; lastShot = -1;
  static async create(canvas: HTMLCanvasElement, onP?: (p: number) => void) {
    await loadFont(); onP?.(0.3); await loadAtlas(); onP?.(0.5); makeTextures(FONT);
    const mv = new MV(canvas); onP?.(0.65);
    // 预热：每个镜头渲一帧，把着色器编译掉，播放时不卡
    for (let i = 0; i < SHOTS.length; i++) { const s = SHOTS[i]; mv.render((s.from + Math.min(s.to, 50.8)) / 2); onP?.(0.65 + (0.35 * (i + 1)) / SHOTS.length); await new Promise((r) => setTimeout(r, 0)); }
    mv.render(0); return mv;
  }
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1); this.renderer.setSize(W, H, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.S = makeSets(); this.subs = new Subtitles();
    this.composer = new EffectComposer(this.renderer);
    this.rp = new RenderPass(this.S.pier.scene, this.cam); this.composer.addPass(this.rp);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.42, 0.84); this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader); this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass()); this.composer.setSize(W, H);
  }
  /** 渲染第 t 秒（任意跳转） */
  render(t: number) {
    const G = gradeDefaults(); const { shot, index } = shotAt(t);
    const scene = shot.fn(t, t - shot.from, this.S, this.cam, G); this.lastShot = index;
    this.rp.scene = scene; this.rp.camera = this.cam;
    this.bloom.strength = G.bloom; const u = this.grade.uniforms;
    u.uFlash.value = G.flash; u.uFade.value = G.fade; u.uLid.value = G.lid; u.uWarp.value = G.warp; u.uSat.value = G.sat; u.uVign.value = G.vign;
    u.uSplit.value = G.split; u.uTime.value = t; u.uGrain.value = G.grain; (u.uTint.value as THREE.Vector3).set(G.tint[0], G.tint[1], G.tint[2]);
    this.composer.render();
    this.subs.update(t);
    this.renderer.autoClear = false; this.renderer.clearDepth(); this.renderer.render(this.subs.scene, this.subs.cam); this.renderer.autoClear = true;
  }
}
