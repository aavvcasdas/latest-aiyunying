import * as THREE from "three";
import { CAST, type CharId } from "@/data/cast";
import { ATLAS_H, ATLAS_W, framesIn, has, rect } from "@/lib/atlas";
import type { Look, Placement } from "@/lib/mv";
import { labelTex } from "@/three/kit";
import actionsJson from "@/data/castActions.json";

/* ------------------------------------------------------------------ *
 * 纸片人：图集像素角色贴在一块立在地上的平面上（永远朝镜头转，另加 ry 转身角）。
 *   - 像素着色器在任意缩放下保持锐利（texel 边缘按屏幕导数抗锯齿）
 *   - 透明 / 剪影 / 染色 / 闪白 都是 uniform
 *   - 投影：alphaTest 深度材质，纸片在地上留一条真影子；脚下再压一枚接触阴影
 * ------------------------------------------------------------------ */

export const UNITS_PER_PX = 1.7 / 90; // 身高约 1.7 个世界单位

export interface Atlas {
  tex: THREE.Texture;
}

export function loadAtlas(url: string): Promise<Atlas> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        resolve({ tex });
      },
      undefined,
      reject,
    );
  });
}

const VERT = `
varying vec2 vUv;
#include <common>
#include <fog_pars_vertex>
void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = `
uniform sampler2D map; uniform vec2 texSize; uniform vec4 rect;
uniform vec3 tint; uniform float tintAmt; uniform vec3 silColor; uniform float sil;
uniform vec3 shade; uniform float alpha; uniform float flash;
varying vec2 vUv;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec2 px = vec2(rect.x + vUv.x * rect.z, rect.y + (1.0 - vUv.y) * rect.w);
  px = clamp(px, rect.xy + 0.5, rect.xy + rect.zw - 0.5);
  vec2 seam = floor(px + 0.5);
  vec2 fw = max(fwidth(px), vec2(1e-4));
  vec2 uvp = seam + clamp((px - seam) / fw, -0.5, 0.5);
  vec2 tuv = vec2(uvp.x / texSize.x, 1.0 - uvp.y / texSize.y);
  vec4 c = texture2D(map, tuv);
  if (c.a < 0.1) discard;
  vec3 col = c.rgb * shade;
  col = mix(col, 1.0 - (1.0 - col) * (1.0 - tint), tintAmt);
  col = mix(col, silColor, sil);
  col = mix(col, vec3(1.0), flash);
  gl_FragColor = vec4(col, c.a * alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

const PLANE = new THREE.PlaneGeometry(1, 1);
PLANE.translate(0, 0.5, 0);
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 24);
SHADOW_GEO.rotateX(-Math.PI / 2);

/* ------------------------------------------------------------------ *
 * 派生动作（通用模板 cast/source/bake_actions.mjs 烘出来的）：
 *   actions[角色][动作] = { label, fps, loop, frames, fx, size }
 *   frames 是图集里的格名，按 fps 逐格播；loop 的回绕，不循环的播完定格在最后一格。
 *   没给 act 的角色走 idle（八格呼吸 + 眨眼），比原来「一格 + 偶尔眨眼」自然得多。
 * ------------------------------------------------------------------ */
export interface ActionMeta {
  label: string;
  fps: number;
  loop: boolean;
  frames: string[];
  fx: string | null;
  size: [number, number];
}
const ACT_FILE = actionsJson as unknown as {
  actions: Record<string, Record<string, ActionMeta>>;
  props: string[];
  propsOf: Record<string, string[]>;
  fx: Record<string, string[]>;
};
export const ACTIONS = ACT_FILE.actions;

/** 表情贴：fx_heart → 若干格，按 6Hz 循环 */
export const EMOTES = ACT_FILE.fx;

/** 动作播到第几格。t 从动作开始算起，负数一律停在第 0 格 */
export function actionFrame(meta: ActionMeta, t: number): number {
  const n = meta.frames.length;
  const i = Math.floor(Math.max(0, t) * meta.fps + 1e-6);
  return meta.loop ? i % n : Math.min(n - 1, i);
}

type Anim =
  | { kind: "walk"; frames: string[] }
  | { kind: "blink"; a: string; b: string; period: number }
  | { kind: "flap"; a: string; b: string }
  | { kind: "still"; cell: string }
  | { kind: "act"; meta: ActionMeta; offset: number };

/** 每个角色一个固定的小相位，站一排时呼吸不同步 */
function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 97;
  return h / 97;
}

/** 造型格 + 动画方式（和模板的 front / walk / set 口径一致） */
export function resolveAnim(p: Placement): Anim {
  const m = CAST[p.id];
  if (p.cell && has(p.cell)) {
    if (p.cell.startsWith("gpt_fly")) return { kind: "flap", a: "gpt_fly_0", b: "gpt_fly_1" };
    return { kind: "still", cell: p.cell };
  }
  if (p.walk && m.cells.walkPrefix) return { kind: "walk", frames: framesIn(m.cells.walkPrefix) };
  if (p.pose && m.cells.poses[p.pose]) {
    const cell = m.cells.poses[p.pose];
    if (cell.startsWith("gpt_fly")) return { kind: "flap", a: "gpt_fly_0", b: "gpt_fly_1" };
    if (cell === "gpt_boss_cast0") return { kind: "blink", a: "gpt_boss_cast0", b: "gpt_boss_cast1", period: 0.9 };
    return { kind: "still", cell };
  }
  // 派生动作优先于脸部/待机的静态格：给了 act 就播那个，没给就播 idle（呼吸 + 眨眼）。
  // 每个人的 seed 错开一点，一片人站着时不会像齐步走。
  const acts = ACTIONS[p.id] ?? {};
  const name = p.act ?? (acts.idle ? "idle" : acts.float ? "float" : null);
  if (name) {
    const meta = acts[name];
    if (!meta) {
      throw new Error(`[cast] ${p.id} 没有动作「${name}」（可用：${Object.keys(acts).join("、")}）`);
    }
    return { kind: "act", meta, offset: seedOf(p.id) * 1.3 };
  }
  if (p.face === "side" && m.cells.side) return { kind: "blink", a: m.cells.side[0], b: m.cells.side[1], period: 4.6 };
  if (m.cells.front) return { kind: "blink", a: m.cells.front[0], b: m.cells.front[1], period: p.id === "gpt" ? 5.2 : 4.2 };
  return { kind: "still", cell: m.cells.portrait };
}

export class Actor {
  readonly g = new THREE.Group();
  readonly plane: THREE.Mesh;
  readonly mat: THREE.ShaderMaterial;
  readonly shadow: THREE.Mesh;
  readonly depthTex: THREE.Texture;
  readonly anim: Anim;
  readonly p: Placement;
  cell = "";
  private wear: THREE.Mesh | null = null;
  private tag: THREE.Sprite | null = null;
  private w = 1;
  private h = 1.7;

  constructor(p: Placement, atlas: Atlas, look: Look) {
    this.p = p;
    this.anim = resolveAnim(p);
    this.mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          map: { value: null },
          texSize: { value: new THREE.Vector2(ATLAS_W, ATLAS_H) },
          rect: { value: new THREE.Vector4(0, 0, 1, 1) },
          tint: { value: new THREE.Color(p.tint ?? "#ffffff") },
          tintAmt: { value: p.tint ? 0.55 : 0 },
          silColor: { value: new THREE.Color(look.ink) },
          sil: { value: p.sil ? 1 : 0 },
          // 场景光的「气氛色」：日光色往白里拉一半，纸片人跟着光变暖变冷
          shade: { value: new THREE.Color(look.sun).lerp(new THREE.Color(0xffffff), 0.5) },
          alpha: { value: p.alpha ?? 1 },
          flash: { value: 0 },
        },
      ]),
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      fog: true,
      toneMapped: false,
    });
    this.mat.uniforms.map.value = atlas.tex;

    this.depthTex = atlas.tex.clone();
    this.depthTex.needsUpdate = true;

    this.plane = new THREE.Mesh(PLANE, this.mat);
    this.plane.castShadow = !p.sil && (p.alpha ?? 1) > 0.6;
    this.plane.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.depthTex,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    this.g.add(this.plane);

    this.shadow = new THREE.Mesh(
      SHADOW_GEO,
      new THREE.MeshBasicMaterial({ color: 0x08050f, transparent: true, opacity: p.sil ? 0.12 : 0.26, depthWrite: false }),
    );
    this.shadow.position.y = 0.012;
    this.g.add(this.shadow);

    const first =
      this.anim.kind === "walk"
        ? this.anim.frames[0]
        : this.anim.kind === "still"
          ? this.anim.cell
          : this.anim.kind === "act"
            ? this.anim.meta.frames[0]
            : this.anim.a;
    this.setCell(first);

    if (p.wear) this.addWear(p.wear);
    if (p.tag) this.addTag(p.tag);
  }

  setCell(name: string) {
    if (name === this.cell) return;
    this.cell = name;
    const [x, y, w, h] = rect(name);
    const k = UNITS_PER_PX * (this.p.size ?? 1);
    this.w = w * k;
    this.h = h * k;
    (this.mat.uniforms.rect.value as THREE.Vector4).set(x, y, w, h);
    this.depthTex.repeat.set(w / ATLAS_W, h / ATLAS_H);
    this.depthTex.offset.set(x / ATLAS_W, 1 - (y + h) / ATLAS_H);
    this.shadow.scale.set(this.w * 0.62, 1, this.w * 0.26);
    if (this.wear) this.wear.position.y = this.h + 0.02;
    if (this.tag) this.tag.position.y = this.h + 0.55;
  }

  private addWear(kind: NonNullable<Placement["wear"]>) {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 48;
    const c = cv.getContext("2d")!;
    c.lineJoin = "round";
    c.lineWidth = 3;
    if (kind === "crown") {
      c.fillStyle = "#ffd166";
      c.strokeStyle = "#8a5a12";
      c.beginPath();
      c.moveTo(6, 44);
      c.lineTo(10, 12);
      c.lineTo(22, 28);
      c.lineTo(32, 4);
      c.lineTo(42, 28);
      c.lineTo(54, 12);
      c.lineTo(58, 44);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#ff8fa3";
      c.beginPath();
      c.arc(32, 20, 4, 0, Math.PI * 2);
      c.fill();
    } else if (kind === "bow") {
      c.fillStyle = "#f78fb3";
      c.strokeStyle = "#8a3352";
      c.beginPath();
      c.moveTo(32, 24);
      c.lineTo(6, 8);
      c.lineTo(6, 40);
      c.closePath();
      c.moveTo(32, 24);
      c.lineTo(58, 8);
      c.lineTo(58, 40);
      c.closePath();
      c.fill();
      c.stroke();
    } else {
      c.strokeStyle = "#ffe9a8";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(32, 44, 26, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      c.fillStyle = "#bff3ff";
      c.beginPath();
      c.arc(32, 16, 6, 0, Math.PI * 2);
      c.fill();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    m.position.set(0, this.h + 0.02, 0.02);
    m.renderOrder = 2;
    this.wear = m;
    this.g.add(m);
  }

  private addTag(text: string) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(text), transparent: true, depthWrite: false }));
    s.scale.set(1.9, 1.9, 1);
    s.position.set(0, this.h + 0.55, 0);
    s.renderOrder = 3;
    this.tag = s;
    this.g.add(s);
  }

  /** t：镜头内的本地时间（秒）；energy：音乐能量；cam：镜头位置 */
  update(t: number, energy: number, cam: THREE.Vector3) {
    const p = this.p;
    // 造型
    if (this.anim.kind === "walk") {
      const n = this.anim.frames.length;
      const u = p.move ? Math.min(1, t / p.move) : 1;
      const dist = Math.abs(p.x - (p.from?.x ?? p.x)) + Math.abs(p.z - (p.from?.z ?? p.z));
      const moving = !p.move || u < 1 || dist === 0;
      const i = moving ? Math.floor(t / 0.125) % n : 0;
      this.setCell(this.anim.frames[i]);
    } else if (this.anim.kind === "blink") {
      const ph = (t + 1.3) % this.anim.period;
      this.setCell(ph > this.anim.period - 0.18 ? this.anim.b : this.anim.a);
    } else if (this.anim.kind === "flap") {
      this.setCell(Math.floor(t / 0.17) % 2 === 0 ? this.anim.a : this.anim.b);
    } else if (this.anim.kind === "act") {
      // 动作从 actAt 秒开始算；seed 相位让一排人不同步
      const at = p.actAt ?? 0;
      const i = actionFrame(this.anim.meta, t - at + this.anim.offset);
      this.setCell(this.anim.meta.frames[i]);
    }

    // 走位
    const u = p.move ? Math.min(1, t / p.move) : 1;
    const fx = p.from?.x ?? p.x;
    const fz = p.from?.z ?? p.z;
    const x = fx + (p.x - fx) * u;
    const z = fz + (p.z - fz) * u;
    let y = p.lift ?? 0;
    const walking = this.anim.kind === "walk" && (!p.move || u < 1);
    if (walking) y += 0.04 * Math.abs(Math.sin(t * Math.PI * 4));
    if (p.talk) y += 0.03 * Math.abs(Math.sin(t * Math.PI * 3));
    if (p.fly || this.anim.kind === "flap") y += 0.22 * Math.sin(t * 2.1) + 0.1;
    y += energy * 0.05;
    this.g.position.set(x, y, z);
    this.shadow.position.y = 0.012 - y;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = (p.sil ? 0.12 : 0.26) * Math.max(0.25, 1 - y * 0.35);

    // 朝镜头 + 转身
    const yaw = Math.atan2(cam.x - x, cam.z - z);
    this.g.rotation.y = yaw + THREE.MathUtils.degToRad(p.ry ?? 0);
    this.plane.rotation.z = THREE.MathUtils.degToRad(p.tilt ?? 0);
    const sx = (p.flip ? -1 : 1) * this.w;
    const sy = this.h * (1 + energy * 0.045);
    this.plane.scale.set(sx, sy, 1);
  }

  dispose() {
    this.mat.dispose();
    this.depthTex.dispose();
    (this.shadow.material as THREE.Material).dispose();
    if (this.wear) {
      (this.wear.material as THREE.MeshBasicMaterial).map?.dispose();
      (this.wear.material as THREE.Material).dispose();
    }
    if (this.tag) this.tag.material.dispose();
  }
}

export type { CharId };
