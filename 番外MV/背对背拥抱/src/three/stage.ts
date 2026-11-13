import * as THREE from "three";
import { CAST } from "@/data/cast";
import type { Cue, LookId, Shot } from "@/lib/mv";
import { FH, FW, LOOKS, easeInOut } from "@/lib/mv";
import { Actor, loadAtlas, type Atlas } from "@/three/actors";
import { FxSystem } from "@/three/fx";
import { bumpFontEpoch, makeSky, makeStars, sprite } from "@/three/kit";
import { buildProp, buildSets, tickProp, type SetPiece } from "@/three/sets";
import { WordCards } from "@/three/words";

/* ------------------------------------------------------------------ *
 * 舞台：渲染器 + 场景 + 三盏灯 + 镜头。
 *   setCue(cue)：硬切到一个镜头（搭景显隐、放人、摆道具、撒特效、摆机位）
 *   update(t, energy)：每帧推进（look 渐变、机位推拉、纸片人、特效、字牌、景的呼吸）
 * ------------------------------------------------------------------ */

interface LookState {
  top: THREE.Color;
  hor: THREE.Color;
  low: THREE.Color;
  sun: THREE.Color;
  amb: THREE.Color;
  sunI: number;
  ambI: number;
  fogNear: number;
  fogFar: number;
  stars: number;
  dir: THREE.Vector3;
}

function lookState(id: LookId): LookState {
  const L = LOOKS[id];
  return {
    top: new THREE.Color(L.top),
    hor: new THREE.Color(L.hor),
    low: new THREE.Color(L.low),
    sun: new THREE.Color(L.sun),
    amb: new THREE.Color(L.amb),
    sunI: L.sunI,
    ambI: L.ambI,
    fogNear: L.fog[0],
    fogFar: L.fog[1],
    stars: L.stars,
    dir: new THREE.Vector3(...L.dir).normalize(),
  };
}

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, FW / FH, 0.1, 700);
  readonly words = new WordCards();
  private hud = new THREE.Scene();
  private atlas: Atlas | null = null;
  private sets: Record<string, SetPiece>;
  private sky = makeSky();
  private stars = makeStars();
  private hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.5);
  private sun = new THREE.DirectionalLight(0xffffff, 2.5);
  private fill = new THREE.AmbientLight(0xffffff, 0.25);
  private orb: THREE.Sprite;
  private fog = new THREE.Fog(0xffffff, 10, 100);
  private fx = new FxSystem();
  private actors: Actor[] = [];
  private props: THREE.Object3D[] = [];
  private propGroup = new THREE.Group();
  private cue: Cue | null = null;
  private cur: LookState = lookState("dusk");
  private target: LookState = lookState("dusk");
  private lastT = 0;
  private camShake = new THREE.Vector3();
  pointer = { x: 0, y: 0 };
  fxOn = true;
  showTags = false;
  disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    // 出片模式（?render=1）跑在无显卡的机器上，纯 SwiftShader 软件光栅化：
    //   · 关抗锯齿、关软阴影（观感只差边缘一点点硬）
    //   · 内部按 0.75 倍像素渲，再被 2D 合成放大到 1600×900
    //     像素纸片人本来就带颗粒，柔一点反而更像印刷品；换来 2 倍速度
    const q = new URLSearchParams(window.location.search);
    const cheap = q.has("render");
    const ratio = cheap ? Number(q.get("ratio") || 0.75) : Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !cheap, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(FW, FH, false);
    this.renderer.shadowMap.enabled = !cheap;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.fog = this.fog;
    this.scene.add(this.sky, this.stars, this.hemi, this.fill, this.sun, this.sun.target, this.camera, this.fx.group, this.propGroup);
    // 字牌画在第二遍（清过深度）：镜头前的牌永远不会被树、房子挡住
    this.hud.add(this.words.group, new THREE.HemisphereLight(0xffffff, 0x998877, 2.2));

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.camera.left = -22;
    this.sun.shadow.camera.right = 22;
    this.sun.shadow.camera.top = 22;
    this.sun.shadow.camera.bottom = -22;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.02;

    this.orb = sprite("glow", 90, 0xffe0a0, true, 0.95);
    this.orb.material.fog = false;
    this.scene.add(this.orb);

    this.sets = buildSets();
    for (const s of Object.values(this.sets)) {
      s.g.visible = false;
      this.scene.add(s.g);
    }
    this.applyLook(this.cur, true);

    // 字体就绪后重画带字的贴图
    if (document.fonts?.load) {
      document.fonts.load('32px "ZCOOL KuaiLe"').then(() => {
        bumpFontEpoch();
        if (this.cue) this.words.setCue(this.cue);
      });
    }
  }

  async ready(atlasUrl: string) {
    this.atlas = await loadAtlas(atlasUrl);
    if (this.cue) this.setCue(this.cue, true);
  }

  /* ---------------- 切镜 ---------------- */
  setCue(cue: Cue, force = false) {
    if (!force && this.cue && this.cue.i === cue.i) return;
    this.cue = cue;
    const shot = cue.shot;
    const look = LOOKS[shot.look];

    for (const s of Object.values(this.sets)) {
      s.g.visible = s.id === shot.set;
      if (s.id === shot.set) s.recolor(look);
    }
    this.target = lookState(shot.look);

    // 人
    for (const a of this.actors) {
      this.scene.remove(a.g);
      a.dispose();
    }
    this.actors = [];
    this.lastT = cue.start; // 进新镜从该镜起点重新计时，别把上一镜的时间差当成 dt
    if (this.atlas) {
      for (const p of shot.cast) {
        const pl = this.showTags && !p.tag ? { ...p, tag: CAST[p.id].name } : p;
        const a = new Actor(pl, this.atlas, look);
        this.scene.add(a.g);
        this.actors.push(a);
      }
    }
    // 道具
    for (const o of this.props) this.propGroup.remove(o);
    this.props = (shot.props ?? []).map((spec) => {
      const o = buildProp(spec);
      this.propGroup.add(o);
      return o;
    });
    // 特效
    this.fx.spawn(this.fxOn ? (shot.fx ?? []) : [], look, cue.i + 1, cue.start);
    // 字牌
    this.words.setCue(cue);
    // 机位：硬切
    this.placeCamera(shot, 0);
  }

  private placeCamera(shot: Shot, u: number) {
    const c = shot.cam;
    const e = easeInOut(u);
    const p0 = c.pos;
    const p1 = c.to?.pos ?? c.pos;
    const l0 = c.look;
    const l1 = c.to?.look ?? c.look;
    this.camera.position.set(p0[0] + (p1[0] - p0[0]) * e, p0[1] + (p1[1] - p0[1]) * e, p0[2] + (p1[2] - p0[2]) * e);
    const lx = l0[0] + (l1[0] - l0[0]) * e;
    const ly = l0[1] + (l1[1] - l0[1]) * e;
    const lz = l0[2] + (l1[2] - l0[2]) * e;
    // 鼠标视差：轻轻横移机位（不是转头），看上去像立体书在手里微微晃
    this.camera.position.x += this.pointer.x * 0.25;
    this.camera.position.y += -this.pointer.y * 0.12;
    this.camera.position.add(this.camShake);
    this.camera.lookAt(lx, ly, lz);
    this.camera.fov = c.fov ?? 40;
  }

  private applyLook(s: LookState, hard = false) {
    const u = (this.sky.material as THREE.ShaderMaterial).uniforms;
    (u.top.value as THREE.Color).copy(s.top);
    (u.hor.value as THREE.Color).copy(s.hor);
    (u.low.value as THREE.Color).copy(s.low);
    this.fog.color.copy(s.hor);
    this.fog.near = s.fogNear;
    this.fog.far = s.fogFar;
    this.sun.color.copy(s.sun);
    this.sun.intensity = s.sunI;
    this.sun.position.copy(s.dir).multiplyScalar(40);
    this.sun.target.position.set(0, 0, -2);
    this.hemi.color.copy(s.amb);
    this.hemi.groundColor.copy(s.amb).multiplyScalar(0.45);
    this.hemi.intensity = s.ambI;
    (this.stars.material as THREE.PointsMaterial).opacity = s.stars;
    this.orb.position.copy(s.dir).multiplyScalar(430);
    this.orb.material.color.copy(s.sun);
    this.orb.visible = this.cue ? LOOKS[this.cue.shot.look].orb !== "none" : true;
    const osz = this.cue && LOOKS[this.cue.shot.look].orb === "moon" ? 60 : 110;
    this.orb.scale.set(osz, osz, 1);
    if (hard) this.cur = s;
  }

  /* ---------------- 每帧 ---------------- */
  update(t: number, energy: number) {
    if (this.disposed) return;
    const dt = Math.min(0.1, Math.max(0, t - this.lastT));
    this.lastT = t;
    const k = 1 - Math.exp(-dt * 6);

    // look 渐变
    const c = this.cur;
    const g = this.target;
    c.top.lerp(g.top, k);
    c.hor.lerp(g.hor, k);
    c.low.lerp(g.low, k);
    c.sun.lerp(g.sun, k);
    c.amb.lerp(g.amb, k);
    c.sunI += (g.sunI - c.sunI) * k;
    c.ambI += (g.ambI - c.ambI) * k;
    c.fogNear += (g.fogNear - c.fogNear) * k;
    c.fogFar += (g.fogFar - c.fogFar) * k;
    c.stars += (g.stars - c.stars) * k;
    c.dir.lerp(g.dir, k).normalize();
    this.applyLook(c);

    const cue = this.cue;
    if (cue) {
      const lt = Math.max(0, t - cue.start);
      const u = Math.min(1, lt / Math.max(0.1, cue.end - cue.start));
      // 能量：机位轻微呼吸
      this.camShake.set(Math.sin(t * 0.9) * 0.02, Math.sin(t * 1.3) * 0.015 + energy * 0.02, 0);
      this.placeCamera(cue.shot, u);
      this.camera.fov = (cue.shot.cam.fov ?? 40) - energy * 1.4;
      this.camera.updateProjectionMatrix();

      const camPos = this.camera.position;
      for (const a of this.actors) a.update(lt, energy, camPos);
      for (const o of this.props) tickProp(o, t, energy);
      this.fx.update(t, energy);
      this.words.follow(this.camera);
      this.words.update(t, energy);
      const set = this.sets[cue.shot.set];
      set?.tick(t, energy);
    }
    this.renderer.render(this.scene, this.camera);
    if (this.words.group.visible) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.hud, this.camera);
      this.renderer.autoClear = true;
    }
  }

  setFx(on: boolean) {
    this.fxOn = on;
    if (this.cue) this.fx.spawn(on ? (this.cue.shot.fx ?? []) : [], LOOKS[this.cue.shot.look], this.cue.i + 1, this.cue.start);
  }

  dispose() {
    this.disposed = true;
    for (const a of this.actors) a.dispose();
    this.fx.clear();
    this.words.clear();
    this.renderer.dispose();
  }
}
