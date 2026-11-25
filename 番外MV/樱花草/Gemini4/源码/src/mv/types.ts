// 分镜与相机公共类型及运镜工具
import * as THREE from 'three';
import { Actor, type CharId, PixelProp, type PropKey } from './actors';
import { ease, lerp, type LookName } from './kit';
import type { BeatState } from './timeline';

export interface CamState {
  p: [number, number, number];
  l: [number, number, number];
  fov: number;
  roll?: number;
}

export interface FrameCtx {
  T: number;      // 全曲绝对时间（秒）
  t: number;      // 当前镜头内相对时间（秒）
  u: number;      // 当前镜头进度 0..1
  dur: number;    // 当前镜头总时长（秒）
  bt: BeatState;  // 74 BPM 实测拍点与双搏心跳状态
}

export interface ShotFx {
  whiteIn?: boolean;
  whiteOut?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export interface ShotDef {
  id: string;
  title: string;
  lyric: string;
  cast: CharId[];
  look: LookName;
  note: string;
  fx?: ShotFx;
  build: (k: StageKit) => (f: FrameCtx) => CamState;
}

export class StageKit {
  readonly root = new THREE.Group();
  readonly actors: Actor[] = [];
  readonly props: PixelProp[] = [];

  add<T extends THREE.Object3D>(obj: T, x = 0, y = 0, z = 0): T {
    obj.position.set(x, y, z);
    this.root.add(obj);
    return obj;
  }

  actor(id: CharId, scale = 1): Actor {
    const a = new Actor(id, scale);
    this.actors.push(a);
    this.root.add(a.holder);
    return a;
  }

  prop(key: PropKey, scale = 1): PixelProp {
    const p = new PixelProp(key, scale);
    this.props.push(p);
    this.root.add(p.holder);
    return p;
  }

  beginFrame(): void {
    for (const a of this.actors) a.begin();
  }

  faceCamera(camPos: THREE.Vector3): void {
    for (const a of this.actors) a.faceCamera(camPos);
    for (const p of this.props) p.faceCamera(camPos);
  }
}

export const cam = (
  p: [number, number, number],
  l: [number, number, number],
  fov = 38,
  roll = 0
): CamState => ({ p, l, fov, roll });

export function glide(a: CamState, b: CamState, u: number, smooth = true): CamState {
  const k = smooth ? ease(u) : u;
  return {
    p: [lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k), lerp(a.p[2], b.p[2], k)],
    l: [lerp(a.l[0], b.l[0], k), lerp(a.l[1], b.l[1], k), lerp(a.l[2], b.l[2], k)],
    fov: lerp(a.fov, b.fov, k),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, k),
  };
}

export const beatBounce = (bt: BeatState, amt = 0.055) =>
  bt.pulse * amt * (bt.down ? 1 : 0.65);
