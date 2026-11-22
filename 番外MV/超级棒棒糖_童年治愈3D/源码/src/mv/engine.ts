// MvEngine：给一个时间点，画出这一帧（3D + 歌词条）。无随机、无累积状态，可以任意跳帧。
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { LINES, SHOTS, SONG, beatIndex, drumsOn, type Line } from './data';
import { Actor, CANDY, Lollipop, Ribbon, Shared, Thing, WHO, type Who, clamp, ease, seg } from './kit';
import { FX, World, ZONE_ORIGIN, resolvePal, type Pal } from './world';
import { SHOT_FNS, setShotCamera, type Ctx, type Post } from './shots';

export interface EngineOpts { atlasUrl: string; fontUrl: string; shadows?: boolean; bloom?: boolean }
export const FONT_FAMILY = 'MvKuaiLe';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1 }, vig: { value: 0.4 }, grain: { value: 0.02 }, time: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, fadeCol: { value: new THREE.Color(0, 0, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat; uniform float vig; uniform float grain; uniform float time; uniform float flash; uniform float fade; uniform vec3 fadeCol; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722)); col = mix(vec3(l), col, sat);
      vec2 d = vUv - 0.5; d.x *= 1.3; float v = smoothstep(0.95, 0.22, length(d)); col *= mix(1.0 - vig, 1.0, v);
      col += (rnd(vUv * 917.0 + time) - 0.5) * grain;
      col = mix(col, vec3(1.0), clamp(flash, 0.0, 1.0)); col = mix(col, fadeCol, clamp(fade, 0.0, 1.0));
      gl_FragColor = vec4(col, c.a); }`,
};

export function shotIndexAt(T: number) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (T >= SHOTS[i].s) return i;
  return 0;
}

export class MvEngine {
  out: HTMLCanvasElement; g: CanvasRenderingContext2D; opts: EngineOpts;
  gl!: THREE.WebGLRenderer; scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 2200);
  composer!: EffectComposer; bloom!: UnrealBloomPass; grade!: ShaderPass;
  S = new Shared(); world!: World; fx!: FX; A!: Record<Who, Actor>; L!: Lollipop; R!: Ribbon; card!: Thing; basket!: Thing;
  hemi = new THREE.HemisphereLight('#ffffff', '#888888', 0.8); sun = new THREE.DirectionalLight('#ffffff', 1.5); amb = new THREE.AmbientLight('#ffffff', 0.3);
  W = 1280; H = 720; ready = false; lastShot = -1;
  private look = new THREE.Vector3(); private afters: (() => void)[] = []; private pal: Pal = resolvePal('morning');
  constructor(out: HTMLCanvasElement, opts: EngineOpts) {
    this.out = out; this.opts = opts;
    const g = out.getContext('2d'); if (!g) throw new Error('Canvas2D 不可用'); this.g = g;
  }

  async load() {
    const res = await fetch(this.opts.fontUrl); if (!res.ok) throw new Error('模板字体加载失败：' + this.opts.fontUrl);
    const face = new FontFace(FONT_FAMILY, await res.arrayBuffer()); await face.load(); document.fonts.add(face);
    await this.S.load(this.opts.atlasUrl);
    const glc = document.createElement('canvas');
    this.gl = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(1); this.gl.outputColorSpace = THREE.SRGBColorSpace; this.gl.toneMapping = THREE.NeutralToneMapping;
    this.gl.shadowMap.enabled = this.opts.shadows !== false; this.gl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.fog = new THREE.FogExp2('#ffffff', 0.01);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.amb);
    this.world = new World(this.S, this.scene); this.fx = new FX(this.S, this.scene);
    const actors = {} as Record<Who, Actor>; WHO.forEach((w) => (actors[w] = new Actor(this.S, w, this.scene))); this.A = actors;
    this.L = new Lollipop(this.S, this.scene); this.R = new Ribbon(this.S, this.scene);
    this.card = new Thing(this.S, 'prop_card', this.scene); this.card.k = 1.6;
    this.basket = new Thing(this.S, 'prop_basket', this.scene); this.basket.k = 1.4;
    const rt = new THREE.WebGLRenderTarget(this.W, this.H, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.gl, rt);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.W / 2, this.H / 2), 0.4, 0.5, 0.8);
    if (this.opts.bloom !== false) this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader); this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
    setShotCamera(this.cam);
    // 预检：每个镜头都要有编排函数
    for (const s of SHOTS) if (!SHOT_FNS[s.id]) throw new Error('缺镜头编排 ' + s.id);
    this.resize(this.out.width || 1280, this.out.height || 720);
    this.ready = true;
  }

  resize(w: number, h: number) {
    w = Math.max(64, Math.round(w)); h = Math.max(36, Math.round(h));
    this.W = w; this.H = h; this.out.width = w; this.out.height = h;
    if (!this.gl) return;
    this.gl.setSize(w, h, false); this.composer.setSize(w, h);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }

  private resetProps(T: number) {
    const P = this.world.park; const s11 = SHOTS.find((s) => s.id === 'S11')!.s;
    P.steps.forEach((m) => (m.visible = false));
    P.blocks.forEach((m) => { m.visible = T >= s11; m.position.y = 0.2; m.scale.set(1, 1, 1); });
    P.queue.forEach((m) => { m.visible = false; m.scale.setScalar(1); });
    const R = this.world.room; R.door.rotation.y = 0;
    (R.shaft.material as THREE.MeshBasicMaterial).opacity = 0; (R.doorLight.material as THREE.MeshBasicMaterial).color.set('#151838');
  }

  /** 画第 T 秒（只读 T） */
  render(Tin: number) {
    if (!this.ready) return;
    const T = clamp(Tin, 0, SONG.duration - 0.001);
    const i = shotIndexAt(T); const m = SHOTS[i]; const fn = SHOT_FNS[m.id]; this.lastShot = i;
    WHO.forEach((w) => this.A[w].reset()); this.L.hide(); this.L.lit = 1; this.L.spin = 0; this.R.hide(); this.card.hide(); this.basket.hide(); this.fx.reset();
    this.resetProps(T);
    this.S.origin.copy(ZONE_ORIGIN[m.zone]); this.world.setZone(m.zone); this.pal = resolvePal(m.pal);
    const post: Post = { flash: 0, fade: 0, fadeWhite: false };
    const b = beatIndex(T); const pulse = drumsOn(T) ? Math.exp(-(b - Math.floor(b)) * 5) : 0;
    this.afters = [];
    const ctx: Ctx = {
      T, t: T - m.s, u: clamp((T - m.s) / (m.e - m.s)), d: m.e - m.s, s: m.s, e: m.e, b, pulse,
      cam: (px, py, pz, lx, ly, lz, fov = 45, roll = 0) => {
        const o = this.S.origin; this.cam.position.set(px + o.x, py + o.y, pz + o.z); this.look.set(lx + o.x, ly + o.y, lz + o.z);
        this.cam.up.set(0, 1, 0); this.cam.lookAt(this.look); if (roll) this.cam.rotateZ(roll);
        if (this.cam.fov !== fov) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
        this.cam.updateMatrixWorld();
      },
      A: this.A, L: this.L, R: this.R, card: this.card, basket: this.basket, W: this.world, fx: this.fx, post,
      pal: (a, bb, k) => { this.pal = resolvePal(a, bb ?? a, k ?? 0); },
      after: (f) => { this.afters.push(f); },
    };
    fn(ctx);
    this.applyPal(this.pal);
    WHO.forEach((w) => this.A[w].update(T, this.cam));
    this.afters.forEach((f) => f());
    this.L.update(T, this.cam);
    if (this.card.mesh.visible) this.card.update(T, this.cam);
    this.world.update(T, this.pal, this.cam, pulse);
    this.fx.finish(T, this.cam, this.look, this.pal);
    this.sun.target.position.copy(this.look); this.sun.position.copy(this.look).addScaledVector(this.pal.sunDir, 45); this.sun.target.updateMatrixWorld();
    const gu = this.grade.uniforms;
    gu.sat.value = this.pal.sat; gu.vig.value = this.pal.vig; gu.flash.value = post.flash; gu.fade.value = post.fade; gu.time.value = Math.floor(T * 30) % 97;
    (gu.fadeCol.value as THREE.Color).setRGB(post.fadeWhite ? 1 : 0, post.fadeWhite ? 1 : 0, post.fadeWhite ? 1 : 0);
    this.bloom.strength = this.pal.bloom; this.gl.toneMappingExposure = this.pal.exposure;
    this.composer.render();
    this.g.drawImage(this.gl.domElement, 0, 0, this.W, this.H);
    drawOverlay(this.g, this.W, this.H, T);
  }

  private applyPal(p: Pal) {
    const fog = this.scene.fog as THREE.FogExp2; fog.color.copy(p.fog); fog.density = p.fogD;
    this.hemi.color.copy(p.hemiSky); this.hemi.groundColor.copy(p.hemiGround); this.hemi.intensity = p.hemiI;
    this.sun.color.copy(p.sun); this.sun.intensity = p.sunI; this.amb.intensity = p.amb; this.S.tint.copy(p.sprite);
  }

  /** 出片钩子用：渲染并返回 JPEG */
  snapshot(T: number, w = 1280, h = 720, q = 0.94) {
    if (this.W !== w || this.H !== h) this.resize(w, h);
    this.render(T); return this.out.toDataURL('image/jpeg', q);
  }

  dispose() { this.ready = false; try { this.composer?.dispose(); this.gl?.dispose(); this.gl?.forceContextLoss(); } catch { /* 已释放 */ } }
}

// ───────── 歌词条与片名（只用模板字体里有的常用字） ─────────
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
const backOut = (t: number) => { const c = 1.7; const x = clamp(t) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };

function drawTitle(g: CanvasRenderingContext2D, W: number, H: number, alpha: number, prog: number, size: number, cy: number) {
  if (alpha <= 0.001) return;
  const text = SONG.title;
  g.save(); g.globalAlpha = alpha; g.font = `${size}px ${FONT_FAMILY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(255,170,210,0.85)'; g.shadowBlur = size * 0.4; g.lineWidth = size * 0.17; g.strokeStyle = '#ffffff'; g.strokeText(text, W / 2, cy);
  g.shadowBlur = 0; g.lineWidth = size * 0.055; g.strokeStyle = '#ff8fb8'; g.strokeText(text, W / 2, cy);
  g.fillStyle = '#fff3f8'; g.fillText(text, W / 2, cy);
  const tw = g.measureText(text).width, x0 = W / 2 - tw / 2;
  g.save(); g.beginPath(); g.rect(x0 - 4, cy - size, (tw + 8) * clamp(prog), size * 2); g.clip();
  const gr = g.createLinearGradient(x0, 0, x0 + tw, 0); CANDY.forEach((c, i) => gr.addColorStop(i / (CANDY.length - 1), c));
  g.fillStyle = gr; g.fillText(text, W / 2, cy); g.restore();
  g.restore();
}

function drawLyric(g: CanvasRenderingContext2D, W: number, H: number, l: Line, T: number, alpha: number) {
  const size = Math.round(H * 0.058), chars = [...l.text], sp = size * 0.06;
  g.save(); g.font = `${size}px ${FONT_FAMILY}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const widths = chars.map((ch) => g.measureText(ch).width); const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  const padX = size * 0.95, padY = size * 0.42, bw = total + padX * 2, bh = size + padY * 2;
  const pop = 0.82 + 0.18 * backOut(seg(T, l.s - 0.14, l.s + 0.12));
  g.globalAlpha = alpha; g.translate(W / 2, H * 0.865); g.scale(pop, pop);
  g.shadowColor = 'rgba(80,50,120,0.28)'; g.shadowBlur = size * 0.55; g.shadowOffsetY = size * 0.12;
  roundRect(g, -bw / 2, -bh / 2, bw, bh, bh / 2); g.fillStyle = 'rgba(255,252,247,0.9)'; g.fill();
  g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  const edge = g.createLinearGradient(-bw / 2, 0, bw / 2, 0); CANDY.forEach((c, i) => edge.addColorStop(i / (CANDY.length - 1), c));
  g.lineWidth = Math.max(2, size * 0.075); g.strokeStyle = edge; g.stroke();
  [-1, 1].forEach((sd, j) => { g.beginPath(); g.arc(sd * (bw / 2 - padX * 0.48), 0, size * 0.16, 0, Math.PI * 2); g.fillStyle = CANDY[(j * 3 + Math.floor(T * 2)) % 6]; g.fill(); });
  const fill = g.createLinearGradient(-total / 2, 0, total / 2, 0); fill.addColorStop(0, '#ff5f9e'); fill.addColorStop(0.5, '#ff8a3d'); fill.addColorStop(1, '#f2a900');
  const fe = l.fe ?? l.e; const prog = seg(T, l.s, fe) * chars.length;
  let x = -total / 2;
  chars.forEach((ch, i) => {
    const k = clamp(prog - i); const by = k > 0 && k < 1 ? -size * 0.09 * Math.sin(k * Math.PI) : 0;
    g.fillStyle = '#ab9fc4'; g.fillText(ch, x, by);
    if (k > 0) { g.save(); g.beginPath(); g.rect(x - 1, -size, widths[i] * k + 2, size * 2); g.clip(); g.fillStyle = fill; g.fillText(ch, x, by); g.restore(); }
    x += widths[i] + sp;
  });
  g.restore();
}

export function drawOverlay(g: CanvasRenderingContext2D, W: number, H: number, T: number) {
  const L1 = LINES[0];
  if (T < 2.4) drawTitle(g, W, H, ease(seg(T, 0, 0.5)) * (1 - seg(T, 2.0, 2.35)), seg(T, L1.s, L1.e), Math.round(H * 0.15), H * 0.4);
  if (T > 69.4) drawTitle(g, W, H, ease(seg(T, 69.6, 70.5)), 1, Math.round(H * 0.12), H * 0.3);
  for (const l of LINES) {
    if (l.i === 1) continue; // 第一句「超级棒棒糖」就是片名本身：片名逐字染色代替歌词条
    const next = LINES[l.i]?.s ?? Infinity; const a0 = l.s - 0.14, a1 = Math.min(l.e + 0.3, next - 0.08);
    if (T < a0 || T > a1) continue;
    drawLyric(g, W, H, l, T, Math.min(seg(T, a0, a0 + 0.16), 1 - seg(T, a1 - 0.18, a1)));
  }
}
