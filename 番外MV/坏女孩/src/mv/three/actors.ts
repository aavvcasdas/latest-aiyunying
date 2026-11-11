import * as THREE from "three";
import atlasJson from "../../assets/cast_atlas.json";
import atlasData from "../../assets/atlasData";

export type Rect = [number, number, number, number];
export interface AtlasData {
  img: HTMLImageElement;
  s: Record<string, Rect>;
  tex: THREE.Texture;
  w: number;
  h: number;
}

export async function loadAtlas(): Promise<AtlasData> {
  const img = new Image();
  img.src = atlasData;
  await img.decode();
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const s = atlasJson.s as unknown as Record<string, Rect>;
  return { img, s, tex, w: atlasJson.w, h: atlasJson.h };
}

/** 每个像素对应多少世界单位（身高约 1.7；GPT 龙娘 2.0；大号鲸鱼娘与小号同高） */
function unitsPerPx(name: string) {
  if (name.startsWith("whale_big")) return 1.7 / 148;
  if (name.startsWith("gpt_boss")) return 2.0 / 176;
  if (name.startsWith("gpt_fly")) return 1.1 / 96;
  if (name.startsWith("p_")) return 1 / 64;
  return 1.7 / 88;
}

const VERT = /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FRAG = /* glsl */ `
#include <fog_pars_fragment>
uniform sampler2D map;
uniform vec4 rect;
uniform float flipX;
uniform float alpha;
uniform vec3 lightCol;
uniform vec3 tint;
uniform float tintA;
uniform vec3 sil;
uniform float silA;
uniform float flash;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  if (flipX > 0.5) uv.x = 1.0 - uv.x;
  vec4 c = texture2D(map, rect.xy + uv * rect.zw);
  if (c.a < 0.5) discard;
  vec3 col = c.rgb * lightCol;
  col = mix(col, tint, tintA);
  col = mix(col, sil, silA);
  col = mix(col, vec3(1.0), flash);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const PLANE = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
const SHADOW_G = new THREE.CircleGeometry(0.5, 24);

const WALK: Record<string, string> = {
  whale: "walk_whale_",
  claude: "walk_claude_",
  kimi: "walk_kimi_",
  gemini: "walk_gemini_",
  qwen: "walk_qwen_",
  zai: "walk_zai_",
  doubao: "walk_doubao_big_",
};

export type Pose = "front" | "side" | "wave" | "point";

/**
 * 纸片角色。引擎每帧先 reset()（隐藏 + 复位修饰量），镜头必须每帧重新 set / at。
 */
export class Actor {
  group = new THREE.Group();
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  shadow: THREE.Mesh;
  name = "";
  private x = 0;
  private y = 0;
  private z = 0;
  private sz = 1;
  private fl = false;
  private lf = 0;
  private bob = 0;
  private sqv = 0;
  private tl = 0;
  private al = 1;
  private tintA = 0;
  private silA = 0;
  private flashV = 0;
  private shadowOn = true;
  private faceYaw: number | null = null;
  private vis = false;

  constructor(public id: string, private A: AtlasData, private base = 1, public big = false) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          map: { value: null },
          rect: { value: new THREE.Vector4() },
          flipX: { value: 0 },
          alpha: { value: 1 },
          lightCol: { value: new THREE.Color(1, 1, 1) },
          tint: { value: new THREE.Color() },
          tintA: { value: 0 },
          sil: { value: new THREE.Color() },
          silA: { value: 0 },
          flash: { value: 0 },
        },
      ]),
      vertexShader: VERT,
      fragmentShader: FRAG,
      fog: true,
      side: THREE.DoubleSide,
    });
    this.mat.uniforms.map.value = A.tex;
    this.mesh = new THREE.Mesh(PLANE, this.mat);
    this.mesh.rotation.order = "YXZ";
    this.shadow = new THREE.Mesh(SHADOW_G, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.group.add(this.shadow, this.mesh);
    this.group.visible = false;
  }

  reset() {
    this.vis = false;
    this.sz = this.base;
    this.fl = false;
    this.lf = 0;
    this.bob = 0;
    this.sqv = 0;
    this.tl = 0;
    this.al = 1;
    this.tintA = 0;
    this.silA = 0;
    this.flashV = 0;
    this.shadowOn = true;
    this.faceYaw = null;
    return this;
  }

  set(name: string) {
    if (!this.A.s[name]) throw new Error(`图集里没有造型「${name}」（角色 ${this.id}）`);
    this.name = name;
    this.vis = true;
    return this;
  }
  /** 正面待机 + 自动眨眼 */
  front(T: number, phase = 0) {
    const blink = (T * 1.1 + phase + this.id.length * 0.37) % 3.4 < 0.13;
    const id = this.id;
    if (id === "whale") return this.set(this.big ? (blink ? "whale_big_blink" : "whale_big_idle") : blink ? "whale_blink" : "whale_idle");
    if (id === "gpt") return this.set(blink ? "gpt_boss_blink" : "gpt_boss_idle");
    if (id === "doubao") return this.set(blink ? "doubao_cage_1" : "doubao_cage_0");
    return this.set(`${id}_front_${blink ? 1 : 0}`);
  }
  /** 侧身站姿（面朝右；flip() 面朝左） */
  side() {
    const id = this.id;
    if (id === "whale" || id === "doubao") return this.set(`${WALK[id]}0`);
    if (id === "gpt") return this.set("gpt_boss_idle");
    return this.set(`${id}_side_0`);
  }
  pose(p: Pose, T = 0) {
    if (p === "front") return this.front(T);
    if (p === "side") return this.side();
    if (this.id === "whale") return this.set(`whale_${this.big ? "big_" : ""}${p}`);
    if (this.id === "gpt") return this.set(p === "point" ? "gpt_boss_cast0" : "gpt_boss_cast1");
    return this.front(T);
  }
  /**
   * 步态：按走过的距离取格（8 格一轮），脚底与位移一一对应，不打滑。
   * 一轮的位移 = 1.15 × 缩放（世界单位）；负距离倒着播。
   */
  walkBy(dist: number, cycle = 1.15) {
    const pre = WALK[this.id];
    if (!pre) return this.side();
    const L = cycle * this.sz;
    const ph = (((dist % L) + L) % L) / L;
    const i = Math.floor(ph * 8) % 8;
    this.bob = Math.abs(Math.sin(ph * Math.PI * 2)) * 0.035 * this.sz;
    return this.set(`${pre}${i}`);
  }
  /** 从 a 走到 b（x 轴），按进度 p；自动朝向 */
  walkX(a: number, b: number, p: number, y: number, z: number) {
    const x = a + (b - a) * p;
    this.walkBy(Math.abs(x - a));
    this.at(x, y, z);
    if (b < a) this.flip();
    return this;
  }
  at(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  flip(b = true) {
    this.fl = b;
    return this;
  }
  size(k: number) {
    this.sz = this.base * k;
    return this;
  }
  lift(h: number) {
    this.lf += h;
    return this;
  }
  sq(a: number) {
    this.sqv = a;
    return this;
  }
  tilt(r: number) {
    this.tl = r;
    return this;
  }
  alpha(a: number) {
    this.al = a;
    return this;
  }
  tint(hex: THREE.ColorRepresentation, a: number) {
    (this.mat.uniforms.tint.value as THREE.Color).set(hex);
    this.tintA = a;
    return this;
  }
  sil(hex: THREE.ColorRepresentation = 0x07050c, a = 1) {
    (this.mat.uniforms.sil.value as THREE.Color).set(hex);
    this.silA = a;
    return this;
  }
  flash(v: number) {
    this.flashV = v;
    return this;
  }
  noShadow() {
    this.shadowOn = false;
    return this;
  }
  /** 固定朝向（弧度），不再朝镜头转 */
  face(yaw: number) {
    this.faceYaw = yaw;
    return this;
  }
  hide() {
    this.vis = false;
    return this;
  }
  /** 说话 / 踩拍时轻轻一颠 */
  bounce(pulse: number, h = 0.06) {
    this.lf += pulse * h * this.sz;
    this.sqv -= pulse * 0.03;
    return this;
  }

  apply(cam: THREE.Camera, light: THREE.Color) {
    const ok = this.vis && this.al > 0.002 && this.name !== "";
    this.group.visible = ok;
    if (!ok) return;
    for (const v of [this.x, this.y, this.z, this.sz, this.lf, this.tl, this.al]) {
      if (!Number.isFinite(v)) throw new Error(`角色 ${this.id} 的坐标 / 缩放 / 透明度不是有限数`);
    }
    const r = this.A.s[this.name];
    const upp = unitsPerPx(this.name);
    const h = r[3] * upp * this.sz;
    const w = r[2] * upp * this.sz;
    this.group.position.set(this.x, this.y, this.z);
    this.mesh.scale.set(w * (1 + this.sqv), h * (1 - this.sqv), 1);
    const lift = this.lf + this.bob;
    this.mesh.position.y = lift;
    const yaw = this.faceYaw ?? Math.atan2(cam.position.x - this.x, cam.position.z - this.z);
    this.mesh.rotation.set(0, yaw, this.tl);
    const u = this.mat.uniforms;
    const AW = this.A.w;
    const AH = this.A.h;
    (u.rect.value as THREE.Vector4).set((r[0] + 0.02) / AW, 1 - (r[1] + r[3] - 0.02) / AH, (r[2] - 0.04) / AW, (r[3] - 0.04) / AH);
    u.flipX.value = this.fl ? 1 : 0;
    u.alpha.value = this.al;
    (u.lightCol.value as THREE.Color).copy(light);
    u.tintA.value = this.tintA;
    u.silA.value = this.silA;
    u.flash.value = this.flashV;
    this.mat.transparent = this.al < 0.999;
    this.mat.depthWrite = this.al >= 0.999;
    const sk = 1 / (1 + lift * 1.6);
    this.shadow.visible = this.shadowOn;
    this.shadow.position.set(0, 0.012, 0);
    this.shadow.scale.set(w * 0.78 * sk, w * 0.34 * sk, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.38 * this.al * sk;
  }
}
