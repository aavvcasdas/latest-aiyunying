import * as THREE from 'three';
import { Actor, loadAtlas, PixelThing, type AtlasData, type CharId } from './actors';
import { beatAt, clamp, seg, SONG_DURATION, type Beat, type Cam } from './core';
import { cardTintVec, createSkyDome, LOOKS } from './kit';
import { buildGlyphAtlas, loadLyricsFont, Lyrics3DManager } from './lyrics3d';
import { SHOTS_PART1 } from './shotsPart1';
import { SHOTS_PART2 } from './shotsPart2';
import type { ShotDef, ShotFrame, ShotKit } from './shotTypes';
import { SHOT_PLAN, type LookPreset, type ShotMeta } from './timeline';

interface BuiltShot {
  meta: ShotMeta;
  root: THREE.Group;
  actors: Actor[];
  things: PixelThing[];
  update: (f: ShotFrame) => Cam;
}

export interface FrameTelemetry {
  t: number;
  shot: ShotMeta;
  beat: Beat;
  whiteFlash: number;
  blackFade: number;
  lyricKick: number;
}

export class MVEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sky: ReturnType<typeof createSkyDome>;
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private fog: THREE.Fog;
  private shots: BuiltShot[] = [];
  private lyrics!: Lyrics3DManager;
  private currentLook: LookPreset | null = null;
  private cardTint = new THREE.Vector3(1, 1, 1);
  private lyricOffset = 0;
  private ready = false;
  atlas: AtlasData | null = null;
  private basePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  // Fullscreen post overlay (white flash / black fade) baked into the canvas so MP4 export keeps the transitions
  private overlayScene = new THREE.Scene();
  private overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private overlayMat = new THREE.MeshBasicMaterial({
    color: 0xfff8e6,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  });
  private overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.overlayMat);

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: true, // required for reliable canvas.captureStream() MP4 export
    });
    this.overlayMesh.visible = false;
    this.overlayScene.add(this.overlayMesh);
    this.renderer.setPixelRatio(this.basePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog(0x261844, 20, 90);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 320);
    this.scene.add(this.camera);

    this.sky = createSkyDome();
    this.scene.add(this.sky.mesh);

    this.hemi = new THREE.HemisphereLight(0xffe4a0, 0x2a1b47, 1.0);
    this.dir = new THREE.DirectionalLight(0xffd573, 1.6);
    this.dir.position.set(7, 15, 8);
    this.rim = new THREE.DirectionalLight(0x9b6bff, 0.7);
    this.rim.position.set(-8, 8, -10);
    this.scene.add(this.hemi, this.dir, this.rim);
  }

  async init(): Promise<AtlasData> {
    const [atlas] = await Promise.all([loadAtlas(), loadLyricsFont()]);
    this.atlas = atlas;

    // Build crisp 3D glyph atlas after ZCOOL KuaiLe has finished loading
    buildGlyphAtlas('不小心惹了上帝奇迹');
    this.lyrics = new Lyrics3DManager();
    this.camera.add(this.lyrics.root);

    const defsById = new Map<string, ShotDef>();
    for (const d of [...SHOTS_PART1, ...SHOTS_PART2]) {
      defsById.set(d.id, d);
    }

    // Build all 11 shots upfront for zero-hitch playback and instant scrubbing
    for (const meta of SHOT_PLAN) {
      const def = defsById.get(meta.id);
      if (!def) continue;
      const root = new THREE.Group();
      root.visible = false;
      const actors: Actor[] = [];
      const things: PixelThing[] = [];
      const kit: ShotKit = {
        root,
        add: <T extends THREE.Object3D>(obj: T, x = 0, y = 0, z = 0) => {
          obj.position.set(x, y, z);
          root.add(obj);
          return obj;
        },
        actor: (id: CharId, baseSize = 1) => {
          const a = new Actor(atlas, id, baseSize);
          root.add(a.holder);
          actors.push(a);
          return a;
        },
        thing: (key: string, baseSize = 1) => {
          const th = new PixelThing(atlas, key, baseSize);
          root.add(th.holder);
          things.push(th);
          return th;
        },
      };
      const update = def.build(kit);
      this.scene.add(root);
      this.shots.push({ meta, root, actors, things, update });
    }

    this.ready = true;
    return atlas;
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** During MP4 export force pixelRatio=1 so captureStream records exactly the requested resolution */
  setExportMode(on: boolean) {
    this.renderer.setPixelRatio(on ? 1 : this.basePixelRatio);
  }

  setLyricsVisible(visible: boolean) {
    if (this.lyrics) this.lyrics.hidden = !visible;
  }

  setLyricOffset(offsetSeconds: number) {
    this.lyricOffset = offsetSeconds;
  }

  private applyLook(look: LookPreset) {
    if (this.currentLook === look) return;
    this.currentLook = look;
    const spec = LOOKS[look];
    this.sky.mat.uniforms.cTop.value.setHex(spec.skyTop);
    this.sky.mat.uniforms.cMid.value.setHex(spec.skyMid);
    this.sky.mat.uniforms.cBot.value.setHex(spec.skyBot);
    this.fog.color.setHex(spec.fog);
    this.fog.near = spec.fogNear;
    this.fog.far = spec.fogFar;
    this.hemi.color.setHex(spec.hemiSky);
    this.hemi.groundColor.setHex(spec.hemiGnd);
    this.hemi.intensity = spec.hemiInt;
    this.dir.color.setHex(spec.dirColor);
    this.dir.intensity = spec.dirInt;
    this.dir.position.set(...spec.dirPos);
    this.rim.color.setHex(spec.rimColor);
    this.rim.intensity = spec.rimInt;
    this.cardTint.copy(cardTintVec(look));
  }

  renderAt(rawT: number, audioEnergy = 0): FrameTelemetry {
    const T = clamp(rawT, 0, SONG_DURATION);
    const bt = beatAt(T);

    if (!this.ready || this.shots.length === 0) {
      return {
        t: T,
        shot: SHOT_PLAN[0],
        beat: bt,
        whiteFlash: 0,
        blackFade: 0,
        lyricKick: 0,
      };
    }

    // Locate active shot cleanly
    let active = this.shots[this.shots.length - 1];
    for (const s of this.shots) {
      if (T >= s.meta.start && T < s.meta.end) {
        active = s;
        break;
      }
    }

    for (const s of this.shots) {
      s.root.visible = s === active;
    }

    this.applyLook(active.meta.look);

    const dur = Math.max(0.05, active.meta.end - active.meta.start);
    const localT = clamp(T - active.meta.start, 0, dur);
    const u = clamp(localT / dur, 0, 1);

    // Reset per-frame transient actor & prop modifiers
    for (const a of active.actors) a.begin();
    for (const th of active.things) th.begin();

    const frameCam = active.update({
      u,
      t: localT,
      T,
      dur,
      bt,
      audioEnergy,
    });

    // Update 3D word & char beat-synced kinetic subtitles (returns 0..1 keyword kick!)
    const lyricT = T + this.lyricOffset;
    this.lyrics.update(lyricT, frameCam.fov);
    const kick = this.lyrics.kick;

    // Subtle tactile camera punch on keyword hits & audio bass peaks
    const fovPunch = kick * 1.45 + audioEnergy * 0.45;
    this.camera.fov = Math.max(24, frameCam.fov - fovPunch);
    this.camera.position.set(
      frameCam.pos[0],
      frameCam.pos[1] + kick * 0.04,
      frameCam.pos[2]
    );
    this.camera.lookAt(frameCam.look[0], frameCam.look[1], frameCam.look[2]);
    if (frameCam.roll) {
      this.camera.rotateZ(frameCam.roll);
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // Keep sky dome centered on camera
    this.sky.mesh.position.copy(this.camera.position);

    // Commit billboard orientation & lighting tint to all pixel actors & props
    for (const a of active.actors) a.commit(this.camera, this.cardTint);
    for (const th of active.things) th.commit(this.camera, this.cardTint);

    // Smooth cinematic flash / fade transitions between acts (computed before render so they bake into the canvas)
    let whiteFlash = 0;
    if (active.meta.whiteIn) whiteFlash = Math.max(whiteFlash, 1 - seg(localT, 0, 0.22));
    if (active.meta.whiteOut) whiteFlash = Math.max(whiteFlash, seg(localT, dur - 0.18, dur));

    let blackFade = 0;
    if (active.meta.fadeIn) blackFade = Math.max(blackFade, 1 - seg(localT, 0, 0.18));
    if (T > SONG_DURATION - 0.35) blackFade = Math.max(blackFade, seg(T, SONG_DURATION - 0.35, SONG_DURATION));

    this.renderer.render(this.scene, this.camera);

    // Bake the flash/fade into the frame via a fullscreen overlay pass
    if (whiteFlash > 0.003 || blackFade > 0.003) {
      if (whiteFlash >= blackFade) {
        this.overlayMat.color.setHex(0xfff8e6);
        this.overlayMat.opacity = whiteFlash;
      } else {
        this.overlayMat.color.setHex(0x07050f);
        this.overlayMat.opacity = blackFade;
      }
      this.overlayMesh.visible = true;
      this.renderer.autoClear = false;
      this.renderer.render(this.overlayScene, this.overlayCam);
      this.renderer.autoClear = true;
    } else {
      this.overlayMesh.visible = false;
    }

    return {
      t: T,
      shot: active.meta,
      beat: bt,
      whiteFlash,
      blackFade,
      lyricKick: kick,
    };
  }

  dispose() {
    this.renderer.dispose();
  }
}
