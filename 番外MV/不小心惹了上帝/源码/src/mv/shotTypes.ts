import * as THREE from 'three';
import type { Actor, CharId, PixelThing } from './actors';
import type { Beat, Cam } from './core';

export interface ShotFrame {
  u: number;
  t: number;
  T: number;
  dur: number;
  bt: Beat;
  audioEnergy: number;
}

export interface ShotKit {
  root: THREE.Group;
  add: <T extends THREE.Object3D>(obj: T, x?: number, y?: number, z?: number) => T;
  actor: (id: CharId, baseSize?: number) => Actor;
  thing: (key: string, baseSize?: number) => PixelThing;
}

export interface ShotDef {
  id: string;
  build: (k: ShotKit) => (f: ShotFrame) => Cam;
}
