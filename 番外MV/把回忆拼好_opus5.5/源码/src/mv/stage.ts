import * as THREE from 'three';
import { LyricLayer } from './lyrics';
import { LINES, TITLE_START, DURATION } from './timing';
import { clamp } from './kit';

export interface Runtime {
  group: THREE.Group;
  update(t: number, lt: number): void;
}
export interface ShotDef {
  id: string;
  name: string; // 分镜说明
  build(S: Stage): Runtime;
}

export interface LightOpt {
  bg?: THREE.ColorRepresentation;
  sky?: THREE.ColorRepresentation;
  ground?: THREE.ColorRepresentation;
  hemi?: number;
  sun?: number;
  sunColor?: THREE.ColorRepresentation;
  sunPos?: [number, number, number];
  fog?: [THREE.ColorRepresentation, number, number] | null;
  exposure?: number;
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 600);
  hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
  sun = new THREE.DirectionalLight(0xffffff, 1.5);
  lyrics = new LyricLayer();
  shots: { def: ShotDef; start: number; end: number; rt: Runtime }[] = [];
  flash = 0;
  fade = 0;
  bgColor = new THREE.Color();
  fogObj = new THREE.Fog(0x000000, 1e5, 1e6);
  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.autoClear = false;
    this.scene.add(this.hemi, this.sun, this.sun.target);
  }
  /** 每个镜头在自己的 update 里调一次 */
  light(o: LightOpt) {
    this.bgColor.set(o.bg ?? 0x000000);
    this.scene.background = this.bgColor;
    this.hemi.color.set(o.sky ?? 0xffffff);
    this.hemi.groundColor.set(o.ground ?? 0x888888);
    this.hemi.intensity = o.hemi ?? 1.2;
    this.sun.color.set(o.sunColor ?? 0xffffff);
    this.sun.intensity = o.sun ?? 1.5;
    const p = o.sunPos ?? [4, 10, 6];
    this.sun.position.set(p[0], p[1], p[2]);
    if (o.fog) {
      this.fogObj.color.set(o.fog[0]);
      this.fogObj.near = o.fog[1];
      this.fogObj.far = o.fog[2];
    } else {
      this.fogObj.near = 1e5;
      this.fogObj.far = 1e6;
    }
    this.scene.fog = this.fogObj;
    this.renderer.toneMappingExposure = o.exposure ?? 1.0;
  }
  cam(pos: [number, number, number], look: [number, number, number], fov = 40) {
    this.camera.position.set(...pos);
    this.camera.lookAt(...look);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
  setShots(defs: ShotDef[]) {
    // 每句一个镜头 + 片尾标题镜；切点比歌词早两帧
    const starts = LINES.map((l, i) => (i === 0 ? 0 : l.start - 2 / 30));
    starts.push(TITLE_START - 2 / 30);
    if (defs.length !== starts.length) throw new Error(`镜头数 ${defs.length} 与句数 ${starts.length} 不一致`);
    defs.forEach((def, i) => {
      const rt = def.build(this);
      rt.group.visible = false;
      this.scene.add(rt.group);
      this.shots.push({ def, start: starts[i], end: i + 1 < starts.length ? starts[i + 1] : DURATION + 1, rt });
    });
  }
  current(t: number) {
    for (let i = this.shots.length - 1; i >= 0; i--) if (t >= this.shots[i].start) return i;
    return 0;
  }
  /** 出封面用：置 true 后不画歌词条（封面只要主题，不要字幕碎片） */
  hideLyrics = false;
  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.lyrics.resize(w / h);
  }
  render(t: number) {
    const i = this.current(t);
    this.shots.forEach((s, j) => (s.rt.group.visible = j === i));
    const s = this.shots[i];
    s.rt.update(t, t - s.start);
    if (!this.hideLyrics) this.lyrics.update(t);
    // 切镜白闪（很短）与片尾淡出
    this.flash = clamp(1 - (t - s.start) / 0.12) * (i === 0 ? 0 : 0.35);
    this.fade = clamp((t - (DURATION - 0.8)) / 0.8);
    const r = this.renderer;
    r.clear();
    r.render(this.scene, this.camera);
    if (this.hideLyrics) return;
    r.clearDepth();
    r.render(this.lyrics.scene, this.lyrics.camera);
  }
}
