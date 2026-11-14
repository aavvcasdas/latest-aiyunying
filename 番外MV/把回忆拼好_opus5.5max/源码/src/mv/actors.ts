// 角色：分支图集里的八位像素角色，当作 3D 世界里的 2D 纸片（绕 Y 轴面向相机）。
// 规矩照抄模板：缺素材直接报错、每帧重新摆、换姿势硬切。
import * as THREE from 'three';
import atlasUrl from './assets/atlas.png';
import { ATLAS_H, ATLAS_RECTS, ATLAS_W } from './data';
import { shadowTexture, type C } from './kit';

export const ATLAS_URL: string = atlasUrl;
export interface Atlas { img: HTMLImageElement; tex: THREE.Texture }

export function loadAtlas(): Promise<Atlas> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.flipY = false; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
      resolve({ img, tex });
    };
    img.onerror = () => reject(new Error('角色图集加载失败'));
    img.src = atlasUrl;
  });
}

const frameCache = new Map<string, string[]>();
export function framesOf(prefix: string): string[] {
  let f = frameCache.get(prefix);
  if (!f) { f = []; while (ATLAS_RECTS[`${prefix}${f.length}`]) f.push(`${prefix}${f.length}`); frameCache.set(prefix, f); }
  return f;
}

export const PX = 1.7 / 90; // 每个像素在世界里多长（标准角色约 90 像素高 ≈ 1.7 米）
const planeGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const shadowGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

const VERT = `varying vec2 vUv;
#include <common>
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
const FRAG = `uniform sampler2D map; uniform vec4 rect; uniform float flip; uniform vec3 tint; uniform float sil; uniform vec3 silColor; uniform float alpha; uniform float glow;
varying vec2 vUv;
#include <common>
#include <fog_pars_fragment>
void main(){
  vec2 uv = vUv; if (flip > 0.5) uv.x = 1.0 - uv.x;
  vec2 st = vec2(rect.x + uv.x * rect.z, rect.y + (1.0 - uv.y) * rect.w);
  vec4 c = texture2D(map, st);
  if (c.a < 0.5) discard;
  float th = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (alpha < 0.999 && th > alpha) discard;
  vec3 rgb = mix(c.rgb * tint, silColor, sil) + vec3(glow);
  gl_FragColor = vec4(rgb, 1.0);
#include <fog_fragment>
#include <colorspace_fragment>
}`;

export interface Look { flip?: boolean; tint?: C; sil?: number; silColor?: C; alpha?: number; glow?: number; s?: number }

export class Sprite3 {
  mesh: THREE.Mesh; mat: THREE.ShaderMaterial; shadow: THREE.Mesh | null = null; key = '';
  constructor(public atlas: Atlas, public size = 1, withShadow = true) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        map: { value: atlas.tex }, rect: { value: new THREE.Vector4(0, 0, 1, 1) }, flip: { value: 0 },
        tint: { value: new THREE.Color(1, 1, 1) }, sil: { value: 0 }, silColor: { value: new THREE.Color(0x6b7190) }, alpha: { value: 1 }, glow: { value: 0 },
      },
      vertexShader: VERT, fragmentShader: FRAG, fog: true, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(planeGeo, this.mat);
    if (withShadow) {
      this.shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTexture(), color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false }));
    }
  }
  /** 换造型格；缺格直接抛错（不拿别的造型顶替） */
  set(key: string): this {
    const r = ATLAS_RECTS[key];
    if (!r) throw new Error(`[cast] 图集里没有「${key}」`);
    if (key !== this.key) { this.key = key; (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0] / ATLAS_W, r[1] / ATLAS_H, r[2] / ATLAS_W, r[3] / ATLAS_H); }
    this.mesh.scale.set(r[2] * PX * this.size, r[3] * PX * this.size, 1);
    return this;
  }
  at(x: number, y: number, z: number, ground = y): this {
    this.mesh.position.set(x, y, z); this.mesh.visible = true;
    if (this.shadow) {
      const lift = Math.max(0, y - ground);
      this.shadow.position.set(x, ground + 0.025, z + 0.02); this.shadow.visible = true;
      const k = 1 / (1 + lift * 0.6);
      this.shadow.scale.set(this.mesh.scale.x * 0.85 * k, 1, this.mesh.scale.x * 0.38 * k);
    }
    return this;
  }
  look(o: Look): this {
    const u = this.mat.uniforms;
    if (o.flip !== undefined) u.flip.value = o.flip ? 1 : 0;
    if (o.tint !== undefined) (u.tint.value as THREE.Color).set(o.tint);
    if (o.sil !== undefined) u.sil.value = o.sil;
    if (o.silColor !== undefined) (u.silColor.value as THREE.Color).set(o.silColor);
    if (o.alpha !== undefined) u.alpha.value = o.alpha;
    if (o.glow !== undefined) u.glow.value = o.glow;
    if (o.s !== undefined) this.mesh.scale.multiplyScalar(o.s);
    return this;
  }
  /** 引擎每帧调用：复位修饰量并先藏起来，镜头里 at() 过的才出现 */
  begin() {
    const u = this.mat.uniforms;
    u.flip.value = 0; (u.tint.value as THREE.Color).setRGB(1, 1, 1); u.sil.value = 0; u.alpha.value = 1; u.glow.value = 0;
    this.mesh.visible = false; if (this.shadow) this.shadow.visible = false;
  }
}

export class Actor extends Sprite3 {
  constructor(atlas: Atlas, public id: string, size = 1) { super(atlas, size, true); }
  /** name：idle / wave / sad / hop / walk / read …；t 是动作开始后的秒数 */
  play(name: string, t: number, fps = 8, loop = true): this {
    const prefix = name === 'walk' ? `walk_${this.id}_` : `act_${this.id}_${name}_`;
    const fr = framesOf(prefix);
    if (!fr.length) throw new Error(`[cast] ${this.id} 没有动作「${name}」`);
    const i = Math.floor(Math.max(0, t) * fps + 1e-6);
    return this.set(loop ? fr[i % fr.length] : fr[Math.min(fr.length - 1, i)]);
  }
}
