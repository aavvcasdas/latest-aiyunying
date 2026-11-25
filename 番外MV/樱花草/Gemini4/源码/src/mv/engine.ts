// 《樱花草》软3D绘本 MV 确定性渲染引擎
import * as THREE from 'three';
import { loadCastAtlas } from './actors';
import {
  clamp01,
  createSkyDome,
  createStarField,
  ease,
  LOOKS,
  type LookName,
  seg,
} from './kit';
import { buildSoftGlyphAtlas, loadLyricFont, SoftLyricsHUD } from './lyrics3d';
import { SHOTS_A } from './shotsA';
import { SHOTS_B } from './shotsB';
import { SHOTS_C } from './shotsC';
import { beatAt, DURATION, SHOT_SLOTS, shotSlotAt } from './timeline';
import { type CamState, type FrameCtx, type ShotDef, StageKit } from './types';

export const ALL_SHOTS: ShotDef[] = [...SHOTS_A, ...SHOTS_B, ...SHOTS_C];

export const SHOT_MAP: Record<string, ShotDef> = (() => {
  const m: Record<string, ShotDef> = {};
  for (const s of ALL_SHOTS) {
    if (m[s.id]) throw new Error(`重复的分镜 ID: ${s.id}`);
    m[s.id] = s;
  }
  for (const slot of SHOT_SLOTS) {
    if (!m[slot.id]) throw new Error(`时间轴引用了未定义的分镜 ID: ${slot.id}`);
  }
  return m;
})();

interface BuiltShot {
  def: ShotDef;
  kit: StageKit;
  update: (f: FrameCtx) => CamState;
}

export class MVEngine {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 320);

  private readonly sky = createSkyDome();
  private readonly stars = createStarField(480);
  private readonly fog = new THREE.Fog(0x1f4959, 14, 68);
  private readonly hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1.0);
  private readonly keyLight = new THREE.DirectionalLight(0xfff4de, 1.35);
  private readonly rimLight = new THREE.DirectionalLight(0xffadc8, 0.6);
  private readonly stageHolder = new THREE.Group();
  private readonly fadeMat: THREE.MeshBasicMaterial;
  private readonly fadeMesh: THREE.Mesh;

  private lyricsHUD: SoftLyricsHUD | null = null;
  private readonly builtShots = new Map<string, BuiltShot>();
  private mountedShot: BuiltShot | null = null;
  private currentLook: LookName | null = null;
  private width = 1280;
  private height = 720;
  private dpr = 1;
  private readyFlag = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene.fog = this.fog;
    this.scene.add(this.sky.mesh);
    this.scene.add(this.stars.points);
    this.scene.add(this.hemi);
    this.scene.add(this.keyLight);
    this.scene.add(this.rimLight);
    this.scene.add(this.stageHolder);
    this.scene.add(this.camera);

    // 相机前转场柔光幕（处理副歌前柔白绽放与片头片尾淡入淡出）
    this.fadeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      fog: false,
    });
    this.fadeMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), this.fadeMat);
    this.fadeMesh.position.set(0, 0, -2.5);
    this.fadeMesh.renderOrder = 1200;
    this.fadeMesh.visible = false;
    this.camera.add(this.fadeMesh);
  }

  async init(): Promise<void> {
    await Promise.all([loadCastAtlas(), loadLyricFont()]);
    if (this.disposed) return;
    buildSoftGlyphAtlas();
    this.lyricsHUD = new SoftLyricsHUD();
    this.camera.add(this.lyricsHUD.root);
    this.readyFlag = true;
  }

  isReady(): boolean {
    return this.readyFlag;
  }

  setSize(w: number, h: number, dpr = 1): void {
    const cw = Math.max(16, Math.round(w));
    const ch = Math.max(9, Math.round(h));
    this.width = cw;
    this.height = ch;
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cw, ch, false);
    this.camera.aspect = cw / ch;
    this.camera.updateProjectionMatrix();
  }

  private applyLook(name: LookName, T: number): void {
    const spec = LOOKS[name];
    if (this.currentLook !== name) {
      this.currentLook = name;
      this.sky.top.setHex(spec.skyTop);
      this.sky.mid.setHex(spec.skyMid);
      this.sky.bot.setHex(spec.skyBot);
      this.fog.color.setHex(spec.fog);
      this.fog.near = spec.fogNear;
      this.fog.far = spec.fogFar;
      this.hemi.color.setHex(spec.hemiSky);
      this.hemi.groundColor.setHex(spec.hemiGround);
      this.hemi.intensity = spec.hemiInt;
      this.keyLight.color.setHex(spec.keyCol);
      this.keyLight.intensity = spec.keyInt;
      this.keyLight.position.set(...spec.keyPos);
      this.rimLight.color.setHex(spec.rimCol);
      this.rimLight.intensity = spec.rimInt;
      this.rimLight.position.set(...spec.rimPos);
    }
    this.stars.points.visible = spec.stars > 0.01;
    if (spec.stars > 0.01) {
      this.stars.mat.opacity = spec.stars * (0.82 + 0.16 * Math.sin(T * 1.9));
      this.stars.points.rotation.y = T * 0.008;
    }
  }

  private getBuiltShot(id: string): BuiltShot {
    let b = this.builtShots.get(id);
    if (!b) {
      const def = SHOT_MAP[id];
      const kit = new StageKit();
      const update = def.build(kit);
      b = { def, kit, update };
      this.builtShots.set(id, b);
    }
    return b;
  }

  /** 给定绝对时间 rawT，纯函数确定性渲染该帧 */
  renderAt(rawT: number, showLyrics = true, audioEnergy = 0): void {
    if (!this.readyFlag || this.disposed) return;
    const T = Math.max(0, Math.min(DURATION - 0.001, rawT));
    const { slot } = shotSlotAt(T);
    const shot = this.getBuiltShot(slot.id);

    if (this.mountedShot !== shot) {
      if (this.mountedShot) {
        this.stageHolder.remove(this.mountedShot.kit.root);
      }
      this.stageHolder.add(shot.kit.root);
      this.mountedShot = shot;
    }

    this.applyLook(shot.def.look, T);
    const t = Math.max(0, T - slot.a);
    const dur = Math.max(0.05, slot.b - slot.a);
    const u = clamp01(t / dur);
    const bt = beatAt(T);

    shot.kit.beginFrame();
    const cs = shot.update({ T, t, u, dur, bt });

    // 更新相机空间软3D逐字+逐词字幕，并获得关键词落点微推力
    const kick = this.lyricsHUD ? this.lyricsHUD.update(T, cs.fov, showLyrics) : 0;

    const finalFov = cs.fov - kick * 0.42 - audioEnergy * 0.35;
    if (Math.abs(this.camera.fov - finalFov) > 0.002) {
      this.camera.fov = finalFov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(cs.p[0], cs.p[1], cs.p[2]);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(cs.l[0], cs.l[1], cs.l[2]);
    if (cs.roll) this.camera.rotation.z += cs.roll;

    // 让所有角色与像素道具卡水平朝向相机
    shot.kit.faceCamera(this.camera.position);

    // 转场柔光处理（闪白 / 黑场淡入淡出）
    const fx = shot.def.fx;
    let fadeOp = 0;
    let fadeHex = 0xfff8fb;
    if (fx?.fadeIn && t < 0.95) {
      fadeOp = 1 - ease(seg(t, 0, 0.95));
      fadeHex = 0x0d0b1a;
    } else if (fx?.fadeOut && u > 0.72) {
      fadeOp = ease(seg(u, 0.72, 0.99));
      fadeHex = 0x0d0b1a;
    } else if (fx?.whiteIn && t < 0.38) {
      fadeOp = (1 - ease(seg(t, 0, 0.38))) * 0.78;
      fadeHex = 0xfff7fa;
    } else if (fx?.whiteOut && dur - t < 0.32) {
      fadeOp = ease(seg(dur - t, 0.32, 0)) * 0.78;
      fadeHex = 0xfff7fa;
    }

    if (fadeOp > 0.005) {
      this.fadeMesh.visible = true;
      this.fadeMat.color.setHex(fadeHex);
      this.fadeMat.opacity = fadeOp;
    } else {
      this.fadeMesh.visible = false;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /** 离线出片与封面静帧抓拍钩子（clean=true 时隐藏软3D字幕条） */
  captureDataURL(t: number, clean = false, targetWidth?: number): string {
    const prevW = this.width;
    const prevH = this.height;
    const prevDpr = this.dpr;
    if (targetWidth && targetWidth > 0) {
      const targetH = Math.round((targetWidth * 9) / 16);
      if (targetWidth !== prevW || targetH !== prevH || prevDpr !== 1) {
        this.setSize(targetWidth, targetH, 1);
      }
    }
    this.renderAt(t, !clean, 0);
    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.93);
    if (targetWidth && (prevW !== this.width || prevH !== this.height || prevDpr !== this.dpr)) {
      this.setSize(prevW, prevH, prevDpr);
    }
    return dataUrl;
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.dispose();
  }
}
