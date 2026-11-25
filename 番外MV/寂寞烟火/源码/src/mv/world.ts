import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ZoneId } from './data';
import { Actor, BenyuSprite, FireworkSystem3D, SharedResources, Thing, VoxelKeyword3D, WHO, hash, type Who } from './kit';
import { createMirrorPoolSurface, createTwilightOcean, createTwilightSky } from './shaders';

import viaductUrl from '../assets/models/viaduct_bridge.glb?url';
import seaArchUrl from '../assets/models/sea_arch_pillars.glb?url';
import nightPathUrl from '../assets/models/coastal_lamp_pine.glb?url';
import timeShoreUrl from '../assets/models/time_tea_pavilion.glb?url';
import footbridgeUrl from '../assets/models/arched_footbridge.glb?url';
import mirrorPoolUrl from '../assets/models/mirror_pavilion.glb?url';
import dreamArchUrl from '../assets/models/dream_crescent_arch.glb?url';
import observatoryUrl from '../assets/models/star_astrolabe.glb?url';
import harborUrl from '../assets/models/harbor_lighthouse.glb?url';
import storyPropsUrl from '../assets/models/origami_boat_rainbow.glb?url';
import dawnUrl from '../assets/models/dawn_breakwater.glb?url';

export interface MoodPalette {
  zenith: string;
  upper: string;
  lower: string;
  horizon: string;
  fog: string;
  fogDensity: number;
  oceanDeep: string;
  oceanShallow: string;
  ambient: string;
  ambientInt: number;
  keyColor: string;
  keyInt: number;
  actorTint: string;
  starBoost: number;
  oceanY: number;
  oceanVisible: boolean;
  warmReflectX: number;
  warmReflectStr: number;
}

export const MOODS: Record<string, MoodPalette> = {
  twilightDusk: {
    zenith: '#252842',
    upper: '#45415e',
    lower: '#6f6076',
    horizon: '#9d888e',
    fog: '#7c6d7e',
    fogDensity: 0.016,
    oceanDeep: '#2e4562',
    oceanShallow: '#436283',
    ambient: '#9ba6c8',
    ambientInt: 1.05,
    keyColor: '#ffe0b2',
    keyInt: 1.35,
    actorTint: '#f5eef5',
    starBoost: 0.68,
    oceanY: -1.1,
    oceanVisible: true,
    warmReflectX: 0,
    warmReflectStr: 0.72,
  },
  deepLonelyNight: {
    zenith: '#14182b',
    upper: '#252a45',
    lower: '#3c3d59',
    horizon: '#59546e',
    fog: '#2d314c',
    fogDensity: 0.036,
    oceanDeep: '#1d2d44',
    oceanShallow: '#2b425f',
    ambient: '#6879a8',
    ambientInt: 0.65,
    keyColor: '#9fb4e0',
    keyInt: 0.65,
    actorTint: '#cad6f0',
    starBoost: 0.55,
    oceanY: -1.6,
    oceanVisible: true,
    warmReflectX: 0,
    warmReflectStr: 0.28,
  },
  warmLanternNight: {
    zenith: '#1f233b',
    upper: '#3b3957',
    lower: '#64566c',
    horizon: '#947e85',
    fog: '#554d63',
    fogDensity: 0.02,
    oceanDeep: '#283d58',
    oceanShallow: '#3e5a7a',
    ambient: '#a79fc4',
    ambientInt: 0.98,
    keyColor: '#ffd999',
    keyInt: 1.55,
    actorTint: '#fff3e0',
    starBoost: 0.72,
    oceanY: -1.5,
    oceanVisible: true,
    warmReflectX: 0.5,
    warmReflectStr: 0.9,
  },
  starryCosmos: {
    zenith: '#11152a',
    upper: '#23284a',
    lower: '#3f3e66',
    horizon: '#6a5e7e',
    fog: '#2c2f4f',
    fogDensity: 0.015,
    oceanDeep: '#1d2f49',
    oceanShallow: '#2d4768',
    ambient: '#899cd4',
    ambientInt: 0.95,
    keyColor: '#d9ecff',
    keyInt: 1.25,
    actorTint: '#eef5ff',
    starBoost: 1.35,
    oceanY: -3.2,
    oceanVisible: true,
    warmReflectX: 0,
    warmReflectStr: 0.45,
  },
  fireworksHarbor: {
    zenith: '#1b2038',
    upper: '#363858',
    lower: '#5e556e',
    horizon: '#8a7a87',
    fog: '#4c4b66',
    fogDensity: 0.014,
    oceanDeep: '#263e5b',
    oceanShallow: '#3d5c7c',
    ambient: '#a5a7cc',
    ambientInt: 1.05,
    keyColor: '#ffdfaa',
    keyInt: 1.4,
    actorTint: '#faf2eb',
    starBoost: 0.9,
    oceanY: -0.68,
    oceanVisible: true,
    warmReflectX: 5.5,
    warmReflectStr: 0.95,
  },
  silverDawn: {
    zenith: '#46617d',
    upper: '#70879d',
    lower: '#ab9fa0',
    horizon: '#dfd1be',
    fog: '#b9b2ad',
    fogDensity: 0.012,
    oceanDeep: '#406582',
    oceanShallow: '#5c84a0',
    ambient: '#d8d8e0',
    ambientInt: 1.25,
    keyColor: '#fff0d4',
    keyInt: 1.5,
    actorTint: '#ffffff',
    starBoost: 0.12,
    oceanY: -0.55,
    oceanVisible: true,
    warmReflectX: 0,
    warmReflectStr: 0.65,
  },
  eternalCreamSky: {
    zenith: '#8ea8ba',
    upper: '#c5c7c3',
    lower: '#e7dec9',
    horizon: '#f5eed8',
    fog: '#e7dfcb',
    fogDensity: 0.01,
    oceanDeep: '#4f7794',
    oceanShallow: '#6e97b0',
    ambient: '#f4efe2',
    ambientInt: 1.45,
    keyColor: '#fff8e8',
    keyInt: 1.55,
    actorTint: '#ffffff',
    starBoost: 0.0,
    oceanY: -0.55,
    oceanVisible: true,
    warmReflectX: 0,
    warmReflectStr: 0.55,
  },
};

export class MVWorld {
  scene: THREE.Scene;
  S: SharedResources;

  sky: ReturnType<typeof createTwilightSky>;
  ocean: ReturnType<typeof createTwilightOcean>;
  mirrorPool: ReturnType<typeof createMirrorPoolSurface>;

  hemiLight: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  accentLight: THREE.PointLight;
  boatLight: THREE.PointLight;

  zones = new Map<ZoneId, THREE.Group>();
  actors: Record<Who, Actor>;
  benyu: BenyuSprite;
  props: Record<string, Thing>;
  voxelWord: VoxelKeyword3D;
  fireworks: FireworkSystem3D;

  // Animated Blender sub-objects
  nightLampCores: THREE.Mesh[] = [];
  nightLampHalos: THREE.Mesh[] = [];
  dreamRing: THREE.Object3D | null = null;
  astrolabeOuter: THREE.Object3D | null = null;
  astrolabeMid: THREE.Object3D | null = null;
  astrolabeInner: THREE.Object3D | null = null;
  origamiBoat: THREE.Object3D | null = null;
  voxelRainbow: THREE.Object3D | null = null;
  dawnCloudLeft: THREE.Object3D | null = null;
  dawnCloudRight: THREE.Object3D | null = null;
  lighthouseBeamPivot: THREE.Group | null = null;

  // Procedural 3D atmospheric layers
  fireflies: THREE.InstancedMesh;
  starCrosses: THREE.InstancedMesh;
  constellationLines: THREE.LineSegments;
  shootingStar: THREE.Mesh;
  memoryHalo: THREE.Mesh;
  paperSheets: THREE.Mesh[] = [];

  private dummy = new THREE.Object3D();
  private col = new THREE.Color();

  constructor(scene: THREE.Scene, S: SharedResources) {
    this.scene = scene;
    this.S = S;

    this.scene.fog = new THREE.FogExp2('#7c6d7e', 0.016);

    // Lighting rig tuned for warm twilight dioramas
    this.hemiLight = new THREE.HemisphereLight('#a8b4d8', '#3c374d', 1.05);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#ffe0b2', 1.35);
    this.keyLight.position.set(8, 14, 10);
    this.scene.add(this.keyLight);

    this.accentLight = new THREE.PointLight('#ffcf78', 2.2, 18, 1.5);
    this.accentLight.position.set(0, 3, 0);
    this.scene.add(this.accentLight);

    this.boatLight = new THREE.PointLight('#ffd98c', 0, 10, 1.8);
    this.scene.add(this.boatLight);

    // Pure procedural GLSL Sky Dome & Ocean (zero background images!)
    this.sky = createTwilightSky();
    this.scene.add(this.sky.mesh);

    this.ocean = createTwilightOcean();
    this.ocean.mesh.position.y = -1.1;
    this.scene.add(this.ocean.mesh);

    this.mirrorPool = createMirrorPoolSurface();

    // Initialize all 10 storyboard zone groups
    const zoneIds: ZoneId[] = [
      'viaduct',
      'seaArch',
      'nightPath',
      'timeShore',
      'footbridge',
      'mirrorPool',
      'dreamArch',
      'observatory',
      'harbor',
      'dawn',
    ];
    for (const id of zoneIds) {
      const g = new THREE.Group();
      g.name = `Zone_${id}`;
      g.visible = false;
      this.scene.add(g);
      this.zones.set(id, g);
    }

    // Branch character standees
    const actorMap = {} as Record<Who, Actor>;
    for (const who of WHO) {
      actorMap[who] = new Actor(S, who, this.scene);
    }
    this.actors = actorMap;
    this.benyu = new BenyuSprite(S, this.scene);

    // Branch canon pixel props
    this.props = {
      book: new Thing(S, 'prop_book', this.scene),
      scroll: new Thing(S, 'prop_scroll', this.scene),
      fan: new Thing(S, 'prop_fan', this.scene),
      brush: new Thing(S, 'prop_brush', this.scene),
      teacup: new Thing(S, 'prop_teacup', this.scene),
      bowl: new Thing(S, 'prop_bowl', this.scene),
      card: new Thing(S, 'prop_card', this.scene),
    };

    this.voxelWord = new VoxelKeyword3D(this.scene);
    this.fireworks = new FireworkSystem3D(this.scene);

    // Floating warm fireflies / dream embers
    this.fireflies = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.085, 0.085, 0.085),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
      110
    );
    this.fireflies.frustumCulled = false;
    this.scene.add(this.fireflies);

    // 3D twinkling '+' pixel star crosses (used dramatically in Shot 14 "就点亮了星空")
    this.starCrosses = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({
        map: S.pixelStar,
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      140
    );
    this.starCrosses.frustumCulled = false;
    this.starCrosses.visible = false;
    this.scene.add(this.starCrosses);

    // Constellation filament lines connecting star nodes across the observatory dome
    const lineVerts: number[] = [];
    const starNodes: THREE.Vector3[] = [];
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 1.35 - Math.PI * 0.67;
      const elev = 0.24 + hash(i * 7.3) * 0.62;
      const rad = 16 + hash(i * 13.1) * 8;
      starNodes.push(
        new THREE.Vector3(Math.sin(ang) * rad, Math.sin(elev) * rad * 0.72 + 1.2, -Math.cos(ang) * rad)
      );
    }
    for (let i = 0; i < starNodes.length - 1; i++) {
      if (i % 4 !== 3) {
        lineVerts.push(starNodes[i].x, starNodes[i].y, starNodes[i].z);
        lineVerts.push(starNodes[i + 1].x, starNodes[i + 1].y, starNodes[i + 1].z);
      }
      if (i + 5 < starNodes.length && i % 3 === 0) {
        lineVerts.push(starNodes[i].x, starNodes[i].y, starNodes[i].z);
        lineVerts.push(starNodes[i + 5].x, starNodes[i + 5].y, starNodes[i + 5].z);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    this.constellationLines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: '#9fdcf7',
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.constellationLines.visible = false;
    this.scene.add(this.constellationLines);

    // Shooting star streak (Shot 13 "只要想起你")
    this.shootingStar = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.11, 0.11),
      new THREE.MeshBasicMaterial({
        color: '#ffe299',
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.shootingStar.visible = false;
    this.scene.add(this.shootingStar);

    // Warm memory glow halo behind translucent Claude visions
    this.memoryHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshBasicMaterial({
        map: S.glow,
        color: '#ffca7a',
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.memoryHalo.visible = false;
    this.scene.add(this.memoryHalo);

    // Floating cream folded paper sheets (for Shot 11 dream arch & Shot 15 transition)
    const paperMat = new THREE.MeshStandardMaterial({
      color: '#f4ecd4',
      emissive: '#f4d8a0',
      emissiveIntensity: 0.18,
      roughness: 0.72,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 6; i++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.44), paperMat);
      sheet.visible = false;
      this.scene.add(sheet);
      this.paperSheets.push(sheet);
    }
  }

  async loadBlenderAssets(onProgress?: (p: number) => void) {
    const loader = new GLTFLoader();
    const manifest: [string, string][] = [
      ['viaduct', viaductUrl],
      ['seaArch', seaArchUrl],
      ['nightPath', nightPathUrl],
      ['timeShore', timeShoreUrl],
      ['footbridge', footbridgeUrl],
      ['mirrorPool', mirrorPoolUrl],
      ['dreamArch', dreamArchUrl],
      ['observatory', observatoryUrl],
      ['harbor', harborUrl],
      ['storyProps', storyPropsUrl],
      ['dawn', dawnUrl],
    ];

    let loaded = 0;
    const results = new Map<string, THREE.Group>();
    await Promise.all(
      manifest.map(async ([key, url]) => {
        const gltf = await loader.loadAsync(url);
        // Slightly warm up material shading so flat-beveled Blender geometry pops crisply
        gltf.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.frustumCulled = false;
          }
        });
        results.set(key, gltf.scene);
        loaded++;
        onProgress?.(loaded / manifest.length);
      })
    );

    // Mount dioramas into their zone groups
    this.zones.get('viaduct')!.add(results.get('viaduct')!);
    this.zones.get('seaArch')!.add(results.get('seaArch')!);

    // Night path: extract the 5 LampCore meshes and attach soft glow sprites for sequential ignition
    const nightScene = results.get('nightPath')!;
    this.zones.get('nightPath')!.add(nightScene);
    for (let i = 0; i < 5; i++) {
      const core = nightScene.getObjectByName(`LampCore_${i}`) as THREE.Mesh | undefined;
      if (core) {
        // Clone material per lamp so each ignites independently!
        core.material = (core.material as THREE.MeshStandardMaterial).clone();
        this.nightLampCores.push(core);
        const halo = new THREE.Mesh(
          new THREE.PlaneGeometry(2.3, 2.3),
          new THREE.MeshBasicMaterial({
            map: this.S.glow,
            color: '#ffd98a',
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        core.add(halo);
        this.nightLampHalos.push(halo);
      }
    }

    this.zones.get('timeShore')!.add(results.get('timeShore')!);
    this.zones.get('footbridge')!.add(results.get('footbridge')!);

    // Mirror pavilion + glass-calm reflection pool
    const mirrorGroup = this.zones.get('mirrorPool')!;
    mirrorGroup.add(results.get('mirrorPool')!);
    mirrorGroup.add(this.mirrorPool.mesh);

    // Dream crescent arch
    const dreamScene = results.get('dreamArch')!;
    this.zones.get('dreamArch')!.add(dreamScene);
    this.dreamRing = dreamScene.getObjectByName('DreamRing') ?? null;

    // Starlight observatory & nested astrolabe rings
    const obsScene = results.get('observatory')!;
    this.zones.get('observatory')!.add(obsScene);
    this.astrolabeOuter = obsScene.getObjectByName('AstrolabeOuter') ?? null;
    this.astrolabeMid = obsScene.getObjectByName('AstrolabeMid') ?? null;
    this.astrolabeInner = obsScene.getObjectByName('AstrolabeInner') ?? null;

    // Harbor lighthouse cove + volumetric rotating beam
    const harborScene = results.get('harbor')!;
    this.zones.get('harbor')!.add(harborScene);
    const lhTower = harborScene.getObjectByName('LighthouseTower');
    if (lhTower) {
      const beamPivot = new THREE.Group();
      beamPivot.position.set(0, 5.39, 0);
      const beamGeo = new THREE.ConeGeometry(2.6, 18, 24, 1, true);
      beamGeo.translate(0, -9, 0);
      beamGeo.rotateX(Math.PI / 2);
      // Smooth volumetric GLSL shader: fades gently to 0 along length & grazing silhouette edges
      const beamMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color('#ffe8ad') },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormalV;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mv.xyz;
            vNormalV = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec2 vUv;
          varying vec3 vNormalV;
          varying vec3 vViewPos;
          void main() {
            // vUv.y = 1 at apex (lantern), 0 at far open mouth -> smooth falloff to 0 before mouth!
            float along = smoothstep(0.06, 0.92, vUv.y);
            float softEdge = pow(abs(dot(normalize(vNormalV), normalize(vViewPos))), 1.55);
            float alpha = along * along * softEdge * 0.24;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      });
      const beam1 = new THREE.Mesh(beamGeo, beamMat);
      const beam2 = new THREE.Mesh(beamGeo, beamMat);
      beam2.rotation.y = Math.PI;
      beamPivot.add(beam1, beam2);
      lhTower.add(beamPivot);
      this.lighthouseBeamPivot = beamPivot;
    }

    // Dawn breakwater
    this.zones.get('dawn')!.add(results.get('dawn')!);

    // Extract reusable animated Blender story props from origami_boat_rainbow.glb
    const propsScene = results.get('storyProps')!;
    this.origamiBoat = propsScene.getObjectByName('OrigamiBoat') ?? null;
    this.voxelRainbow = propsScene.getObjectByName('VoxelRainbow') ?? null;
    this.dawnCloudLeft = propsScene.getObjectByName('DawnCloudLeft') ?? null;
    this.dawnCloudRight = propsScene.getObjectByName('DawnCloudRight') ?? null;

    // Lift dawn cloud cream materials softly so they glow warm dawn-ivory like the finale sky
    for (const cloud of [this.dawnCloudLeft, this.dawnCloudRight]) {
      cloud?.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mats = Array.isArray((obj as THREE.Mesh).material)
            ? ((obj as THREE.Mesh).material as THREE.MeshStandardMaterial[])
            : [(obj as THREE.Mesh).material as THREE.MeshStandardMaterial];
          for (const m of mats) {
            if (m.name === 'DawnCloud' || m.name === 'DawnCloudShade') {
              m.emissive = new THREE.Color(m.name === 'DawnCloud' ? '#f5eed8' : '#e4dbc5');
              m.emissiveIntensity = 0.38;
              m.roughness = 0.95;
            }
          }
        }
      });
    }

    for (const obj of [this.origamiBoat, this.voxelRainbow, this.dawnCloudLeft, this.dawnCloudRight]) {
      if (obj) {
        obj.visible = false;
        this.scene.add(obj);
      }
    }
  }

  setActiveZone(id: ZoneId) {
    this.S.origin.set(0, 0, 0);
    for (const [zid, group] of this.zones.entries()) {
      group.visible = zid === id;
    }
  }

  resetFrame() {
    for (const who of WHO) this.actors[who].reset();
    this.benyu.hide();
    for (const key of Object.keys(this.props)) this.props[key].hide();
    this.voxelWord.hide();
    this.fireworks.hide();
    this.starCrosses.visible = false;
    this.constellationLines.visible = false;
    this.shootingStar.visible = false;
    this.memoryHalo.visible = false;
    this.boatLight.intensity = 0;
    if (this.origamiBoat) this.origamiBoat.visible = false;
    if (this.voxelRainbow) this.voxelRainbow.visible = false;
    if (this.dawnCloudLeft) this.dawnCloudLeft.visible = false;
    if (this.dawnCloudRight) this.dawnCloudRight.visible = false;
    for (const s of this.paperSheets) s.visible = false;
  }

  applyMood(a: MoodPalette, b?: MoodPalette, mixT = 0) {
    const t = Math.max(0, Math.min(1, mixT));
    const lerpCol = (c1: string, c2: string, out: THREE.Color) => {
      out.set(c1);
      if (b && t > 0) out.lerp(this.col.set(c2), t);
    };
    const lerpNum = (n1: number, n2: number) => (b ? n1 + (n2 - n1) * t : n1);

    lerpCol(a.zenith, b?.zenith ?? a.zenith, this.sky.uniforms.uZenith.value);
    lerpCol(a.upper, b?.upper ?? a.upper, this.sky.uniforms.uUpper.value);
    lerpCol(a.lower, b?.lower ?? a.lower, this.sky.uniforms.uLower.value);
    lerpCol(a.horizon, b?.horizon ?? a.horizon, this.sky.uniforms.uHorizon.value);
    this.sky.uniforms.uStarBoost.value = lerpNum(a.starBoost, b?.starBoost ?? a.starBoost);

    lerpCol(a.oceanDeep, b?.oceanDeep ?? a.oceanDeep, this.ocean.uniforms.uDeep.value);
    lerpCol(a.oceanShallow, b?.oceanShallow ?? a.oceanShallow, this.ocean.uniforms.uShallow.value);
    lerpCol(a.horizon, b?.horizon ?? a.horizon, this.ocean.uniforms.uHorizon.value);
    this.ocean.uniforms.uReflectCenter.value.x = lerpNum(a.warmReflectX, b?.warmReflectX ?? a.warmReflectX);
    this.ocean.uniforms.uWarmStrength.value = lerpNum(a.warmReflectStr, b?.warmReflectStr ?? a.warmReflectStr);
    this.ocean.mesh.position.y = lerpNum(a.oceanY, b?.oceanY ?? a.oceanY);
    this.ocean.mesh.visible = a.oceanVisible || (b?.oceanVisible ?? false);

    const fog = this.scene.fog as THREE.FogExp2;
    lerpCol(a.fog, b?.fog ?? a.fog, fog.color);
    fog.density = lerpNum(a.fogDensity, b?.fogDensity ?? a.fogDensity);

    lerpCol(a.ambient, b?.ambient ?? a.ambient, this.hemiLight.color);
    this.hemiLight.intensity = lerpNum(a.ambientInt, b?.ambientInt ?? a.ambientInt);

    lerpCol(a.keyColor, b?.keyColor ?? a.keyColor, this.keyLight.color);
    this.keyLight.intensity = lerpNum(a.keyInt, b?.keyInt ?? a.keyInt);

    lerpCol(a.actorTint, b?.actorTint ?? a.actorTint, this.S.tint);
  }

  updateFireflies(
    T: number,
    count: number,
    colorA: string,
    colorB: string,
    spreadX = 11,
    spreadY = 5.5,
    spreadZ = 8,
    baseY = 0.4,
    camPos?: THREE.Vector3
  ) {
    const n = Math.min(count, 110);
    this.fireflies.count = n;
    this.fireflies.visible = n > 0;
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);
    for (let i = 0; i < n; i++) {
      const seed = i * 19.37;
      const fx = (hash(seed) - 0.5) * 2 * spreadX + Math.sin(T * (0.4 + hash(seed + 1) * 0.6) + seed) * 0.9;
      const fy = baseY + ((hash(seed + 2) + T * (0.04 + hash(seed + 3) * 0.05)) % 1) * spreadY;
      const fz = (hash(seed + 4) - 0.5) * 2 * spreadZ + Math.cos(T * 0.5 + seed) * 0.7;
      const pulse = 0.45 + 0.55 * Math.sin(T * (2.5 + hash(seed + 5) * 3.0) + seed);

      // Smoothly cull any firefly that drifts too close to the camera lens
      let camFade = 1.0;
      if (camPos) {
        const dx = fx - camPos.x;
        const dy = fy - camPos.y;
        const dz = fz - camPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        camFade = Math.max(0, Math.min(1, (dist - 2.3) / 1.4));
      }

      this.dummy.position.set(fx, fy, fz);
      this.dummy.scale.setScalar(Math.max(0.0001, (0.52 + pulse * 0.78) * camFade));
      this.dummy.rotation.set(T * 0.8 + seed, T * 0.6, 0);
      this.dummy.updateMatrix();
      this.fireflies.setMatrixAt(i, this.dummy.matrix);
      this.col.copy(i % 3 === 0 ? cB : cA).multiplyScalar(0.75 + pulse * 0.45);
      this.fireflies.setColorAt(i, this.col);
    }
    this.fireflies.instanceMatrix.needsUpdate = true;
    if (this.fireflies.instanceColor) this.fireflies.instanceColor.needsUpdate = true;
  }

  updateStarCrosses(T: number, cam: THREE.Camera, intensity: number) {
    if (intensity <= 0.01) {
      this.starCrosses.visible = false;
      this.constellationLines.visible = false;
      return;
    }
    this.starCrosses.visible = true;
    this.constellationLines.visible = true;
    (this.constellationLines.material as THREE.LineBasicMaterial).opacity = intensity * 0.45;

    const count = 140;
    this.starCrosses.count = count;
    const cGold = new THREE.Color('#ffebb0');
    const cIce = new THREE.Color('#9be3ff');
    const cLav = new THREE.Color('#d4c4ff');

    for (let i = 0; i < count; i++) {
      const s = i * 31.17;
      const az = (hash(s) - 0.5) * Math.PI * 1.6;
      const elev = 0.14 + hash(s + 2) * 0.75;
      const rad = 14 + hash(s + 4) * 16;
      const sx = Math.sin(az) * rad;
      const sy = Math.sin(elev) * rad * 0.8 + 1.0;
      const sz = -Math.cos(az) * rad;

      const reveal = Math.max(0, Math.min(1, (intensity - hash(s + 6) * 0.55) / 0.45));
      const twinkle = 0.6 + 0.4 * Math.sin(T * (3.2 + hash(s + 8) * 4.5) + s);
      const sc = reveal * twinkle * (0.65 + hash(s + 9) * 1.15);

      this.dummy.position.set(sx, sy, sz);
      this.dummy.lookAt(cam.position);
      this.dummy.scale.setScalar(Math.max(0.001, sc));
      this.dummy.updateMatrix();
      this.starCrosses.setMatrixAt(i, this.dummy.matrix);

      const palettePick = i % 3 === 0 ? cGold : i % 3 === 1 ? cIce : cLav;
      this.starCrosses.setColorAt(i, palettePick);
    }
    this.starCrosses.instanceMatrix.needsUpdate = true;
    if (this.starCrosses.instanceColor) this.starCrosses.instanceColor.needsUpdate = true;
  }

  updateActors(T: number, cam: THREE.Camera) {
    for (const who of WHO) {
      this.actors[who].update(T, cam);
    }
    for (const key of Object.keys(this.props)) {
      this.props[key].update(T, cam);
    }
    for (const halo of this.nightLampHalos) {
      halo.lookAt(cam.position);
    }
    if (this.memoryHalo.visible) {
      this.memoryHalo.lookAt(cam.position);
    }
  }
}
