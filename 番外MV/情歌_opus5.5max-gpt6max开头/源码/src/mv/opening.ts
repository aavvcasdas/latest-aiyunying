import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RECTS } from "./generated";
import {
  ATLAS_IMG,
  C,
  Particles,
  eIO,
  glowSprite,
  hash,
  lerp,
  mat,
  mesh,
  mix3,
  path3,
  pulse,
  range,
  rod,
  setCam,
  smooth,
  vinylTex,
} from "./core";
import { Scene, fog, light, stars, type Ctx } from "./scenesA";

export const OPENING_CUTS = [
  { a: 0, v: "memory", label: "序章 · 被时光收藏的两个人" },
  { a: 2.8, v: "letter", label: "序章 · 未寄出的信" },
  { a: 5.8, v: "reveal", label: "序章 · 回忆的放映厅" },
  { a: 9.4, v: "needle", label: "序章 · 唱片落针" },
  { a: 12.6, v: "melody", label: "序章 · 沿着旋律走向你" },
  { a: 16.2, v: "universe", label: "序章 · 藏在红豆里的宇宙" },
  { a: 19.7, v: "goodbye", label: "序章 · 告别的倒影" },
  { a: 22.8, v: "enter", label: "序章 · 走进琥珀" },
] as const;

const PI = Math.PI;
const AMBER = new THREE.Vector3(1.6, 2.5, -0.65);

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  p: number[],
  radius = 0.03,
) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, radius), mat(color), p);
}

function tube(points: number[][], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
  );
  return mesh(
    new THREE.TubeGeometry(
      curve,
      Math.max(32, points.length * 4),
      radius,
      6,
      false,
    ),
    material,
  );
}

// Fresnel edges keep the people inside the amber readable instead of washing them out.
export function amberGlass() {
  return new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.65 }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vec4 p = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); vP = position;
        gl_Position = projectionMatrix * p; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      uniform float uOpacity; uniform float uTime;
      void main(){ vec3 n = normalize(vN); float f = pow(clamp(1.0-abs(dot(n,normalize(vV))),0.0,1.0),2.2);
        float spec = pow(max(dot(n,normalize(vec3(-0.6,0.75,0.8))),0.0),65.0);
        float ripple = 0.5+0.5*sin(vP.y*18.0+vP.x*6.0+uTime*0.25);
        vec3 gold = mix(vec3(0.31,0.11,0.025),vec3(1.0,0.64,0.24),f);
        gold += vec3(1.0,0.87,0.64)*spec*1.2;
        gl_FragColor = vec4(gold,(0.035+f*0.7+spec*0.55+ripple*f*0.055)*uOpacity); }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

function photograph(index: number) {
  const cv = document.createElement("canvas");
  cv.width = 320;
  cv.height = 384;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#e9dfcb";
  g.fillRect(0, 0, 320, 384);
  const sky = g.createLinearGradient(0, 20, 0, 270);
  sky.addColorStop(0, ["#18354b", "#553b52", "#294e55"][index % 3]);
  sky.addColorStop(1, ["#b2bd9b", "#e2ac78", "#c5c7ac"][index % 3]);
  g.fillStyle = sky;
  g.fillRect(16, 16, 288, 292);
  g.fillStyle = "#ead0a0";
  g.beginPath();
  g.arc(246, 72, 28, 0, PI * 2);
  g.fill();
  g.fillStyle = "#223d41";
  g.beginPath();
  g.moveTo(16, 248);
  g.lineTo(16, 205);
  g.quadraticCurveTo(110, 150, 210, 238);
  g.lineTo(304, 192);
  g.lineTo(304, 308);
  g.lineTo(16, 308);
  g.fill();
  const draw = (key: string, x: number, y: number, h: number) => {
    const r = RECTS[key];
    if (!r || !ATLAS_IMG) return;
    const w = (r[2] * h) / r[3];
    g.imageSmoothingEnabled = false;
    g.drawImage(ATLAS_IMG, ...r, x - w / 2, y - h, w, h);
  };
  draw(
    ["act_whale_wave_3", "act_whale_idle_0", "act_whale_hop_2"][index % 3],
    106,
    291,
    157,
  );
  draw(
    ["act_claude_curtsy_4", "act_claude_read_0", "act_claude_hop_3"][index % 3],
    217,
    291,
    152,
  );
  g.strokeStyle = "#b7a58e";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(112, 345);
  g.bezierCurveTo(145, 335, 170, 355, 207, 341);
  g.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function amberBacking() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 512;
  const g = cv.getContext("2d")!;
  const fill = g.createRadialGradient(194, 178, 15, 256, 256, 262);
  fill.addColorStop(0, "#b78c4f");
  fill.addColorStop(0.45, "#8b632e");
  fill.addColorStop(0.82, "#3e3627");
  fill.addColorStop(1, "#182b2d");
  g.fillStyle = fill;
  g.fillRect(0, 0, 512, 512);
  g.lineWidth = 0.8;
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `rgba(238,204,128,${0.015 + hash(i) * 0.025})`;
    g.beginPath();
    g.ellipse(
      230 + hash(i + 3) * 20,
      254,
      40 + i * 2.1,
      60 + i * 2.2,
      -0.3,
      0,
      PI * 2,
    );
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function woodGrain() {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 128;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#5e4936";
  g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 100; i++) {
    const y = hash(i) * 128;
    g.strokeStyle = i % 3 ? "#362d242d" : "#b090622b";
    g.lineWidth = hash(i + 2) * 1.1 + 0.4;
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(
      150,
      y + Math.sin(i) * 9,
      370,
      y - Math.cos(i) * 10,
      512,
      y + 4,
    );
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function envelope() {
  const group = new THREE.Group();
  group.add(box(1.06, 0.025, 0.72, 0xe9d9b9, [0, 0, 0], 0.01));
  const flap = new THREE.Group();
  flap.position.set(0, 0.025, -0.35);
  const shape = new THREE.Shape();
  shape.moveTo(-0.52, 0);
  shape.lineTo(0.52, 0);
  shape.lineTo(0, 0.54);
  shape.closePath();
  const paper = mesh(
    new THREE.ShapeGeometry(shape),
    mat(0xf2e7d0, { side: THREE.DoubleSide }),
  );
  paper.rotation.x = PI / 2;
  flap.add(paper);
  group.add(flap);
  const seal = mesh(
    new THREE.CylinderGeometry(0.1, 0.11, 0.025, 24),
    mat(0x9b293d, { roughness: 0.5 }),
    [0, 0.045, 0.12],
  );
  group.add(seal);
  const crease = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.52, 0.024, 0.35),
      new THREE.Vector3(0, 0.024, -0.05),
      new THREE.Vector3(0.52, 0.024, 0.35),
      new THREE.Vector3(0, 0.024, -0.05),
    ]),
    new THREE.LineBasicMaterial({ color: 0xb1a184 }),
  );
  group.add(crease);
  return { group, flap, seal };
}

export class OpeningScene extends Scene {
  room = new THREE.Group();
  clock = new THREE.Group();
  reflection = new THREE.Group();
  glassMaterial = amberGlass();
  glass: THREE.Mesh;
  whale = this.actor("whale", 1.48);
  pastWhale = this.actor("whale", 1.03);
  pastClaude = this.actor("claude", 1.03);
  reflectedWhale = this.actor("whale", 1.03);
  reflectedClaude = this.actor("claude", 1.03);
  halo = glowSprite(0xe8a85b, 5.2, 0.16);
  clockHands: THREE.Group[] = [];
  drop = mesh(
    new THREE.SphereGeometry(0.075, 16, 16),
    mat(0x9edfe6, { emissive: 0x367b83, metalness: 0.25, roughness: 0.15 }),
  );
  dust = new Particles(260, { size: 0.035 });
  galaxy = new Particles(2300, { size: 0.035 });
  petals: THREE.Mesh[] = [];
  photos: THREE.Mesh[] = [];
  bulbs: THREE.Sprite[] = [];
  water: THREE.ShaderMaterial;
  letter = envelope();
  writing = new THREE.Group();
  table = new THREE.Group();
  turntable = new THREE.Group();
  record: THREE.Mesh;
  arm = new THREE.Group();
  musicKeys: THREE.Mesh[] = [];
  music = new THREE.Group();
  bean = mesh(
    new THREE.SphereGeometry(0.24, 24, 18),
    mat(0x8e2036, { roughness: 0.22, emissive: 0x58101e, metalness: 0.18 }),
  );
  beanGlow = glowSprite(0xdd7162, 1.4, 0.15);
  warmLight = new THREE.PointLight(0xffc886, 12, 12, 1.6);
  blueLight = new THREE.PointLight(0x82b9ce, 7, 14, 1.6);

  constructor() {
    super();
    const bronze = mat(0xb98b49, {
      metalness: 0.6,
      roughness: 0.34,
      emissive: 0x29190b,
    });
    const darkMetal = mat(0x283b39, { metalness: 0.4, roughness: 0.6 });
    const softGold = new THREE.MeshBasicMaterial({
      color: 0xd9ac66,
      transparent: true,
      opacity: 0.55,
    });
    this.group.add(this.room, this.clock, this.reflection, this.music);

    this.water = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uImpact: { value: 0 } },
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec3 vP; varying float vD;
        void main(){ vP = position; vec4 p = modelViewMatrix*vec4(position,1.0); vD = -p.z; gl_Position=projectionMatrix*p; }`,
      fragmentShader: `varying vec3 vP; varying float vD; uniform float uTime; uniform float uImpact;
        void main(){ float wave = sin(vP.x*1.4+vP.z*2.5+uTime*0.65)*sin(vP.x*3.6-vP.z*1.4-uTime*0.4);
          float streak = pow(max(0.0,wave),11.0);
          float d = distance(vP.xz,vec2(1.6,-0.65));
          float ripple = pow(max(0.0,cos(d*12.0-uImpact*9.0)),10.0)*exp(-abs(d-uImpact*1.8)*3.0)*step(0.01,uImpact);
          float gold = exp(-abs(vP.x-1.6)*1.0)*(1.0-smoothstep(-1.0,5.0,vP.z))*0.06;
          vec3 c = vec3(0.016,0.042,0.050)+vec3(0.035,0.07,0.085)*streak+vec3(0.32,0.19,0.08)*(gold+ripple*0.13);
          gl_FragColor=vec4(c,0.68); }`,
    });
    const water = mesh(
      new THREE.PlaneGeometry(100, 100).rotateX(-PI / 2),
      this.water,
      [0, 0, 0],
    );
    water.renderOrder = 1;
    this.group.add(water);

    // A real, layered place: distant city, tall windows, timber deck and foreground reeds.
    for (let i = 0; i < 23; i++) {
      const h = 1.2 + hash(i + 40) * 4,
        x = -20 + i * 1.9,
        z = -19 - hash(i) * 9;
      this.room.add(box(1.2, h, 1.2, 0x10292e, [x, h / 2 - 0.1, z]));
      for (let k = 0; k < 5; k++)
        if (hash(i * 9 + k) > 0.43) {
          this.room.add(
            mesh(
              new THREE.PlaneGeometry(0.13, 0.22),
              new THREE.MeshBasicMaterial({ color: 0xe3ae68 }),
              [x + ((k % 2) - 0.5) * 0.45, 0.5 + (k * h) / 6, z + 0.61],
            ),
          );
        }
    }
    for (const x of [-5.4, 0, 5.4]) {
      const pts: number[][] = [
        [x - 2.35, 0, -5],
        [x - 2.35, 4.7, -5],
      ];
      for (let i = 0; i <= 30; i++) {
        const a = PI - (i / 30) * PI;
        pts.push([x + Math.cos(a) * 2.35, 4.7 + Math.sin(a) * 2.35, -5]);
      }
      pts.push([x + 2.35, 0, -5]);
      this.room.add(tube(pts, 0.065, darkMetal));
      this.room.add(
        rod([x, 0.2, -5], [x, 7, -5], 0.027, bronze),
        rod([x - 2.35, 3.2, -5], [x + 2.35, 3.2, -5], 0.026, bronze),
      );
      this.room.add(box(0.22, 7.3, 0.36, 0x1c3032, [x - 2.55, 3.55, -5.1]));
    }
    for (let i = 0; i < 18; i++) {
      this.room.add(
        box(
          0.46,
          0.12,
          2.55,
          i % 3 === 0 ? 0x2a3332 : 0x353c37,
          [-4.0 + i * 0.48, 0.12, 1.6],
          0.008,
        ),
      );
    }
    const stringPoints = [
      [-8, 6.0, -2],
      [-4, 4.9, -2],
      [0, 4.6, -2],
      [4, 4.9, -2],
      [8, 6.0, -2],
    ];
    this.room.add(tube(stringPoints, 0.012, darkMetal));
    for (let i = 0; i < 23; i++) {
      const x = -7.6 + i * 0.69,
        y = 4.6 + x * x * 0.021;
      this.room.add(rod([x, y, -2], [x, y - 0.19, -2], 0.009, bronze));
      this.room.add(
        mesh(
          new THREE.SphereGeometry(0.032, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffd999 }),
          [x, y - 0.22, -2],
        ),
      );
      const glow = glowSprite(0xf6bf75, 0.48, 0.34);
      glow.position.set(x, y - 0.22, -2);
      this.bulbs.push(glow);
      this.room.add(glow);
    }
    const moon = mesh(
      new THREE.SphereGeometry(1.2, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0xc3c8b2, fog: false }),
      [-7, 10, -25],
    );
    this.room.add(moon);
    const moonGlow = glowSprite(0x94bcc5, 9, 0.12);
    moonGlow.position.copy(moon.position);
    this.room.add(moonGlow);
    for (let i = 0; i < 32; i++) {
      const side = i < 16 ? -1 : 1,
        x = side * (4.7 + hash(i) * 1.5),
        z = 1.5 + hash(i + 10) * 3,
        h = 0.7 + hash(i + 3) * 1.8;
      this.room.add(
        tube(
          [
            [x, 0, z],
            [x + side * 0.12, h * 0.5, z],
            [x + side * 0.3, h, z - 0.2],
          ],
          0.013,
          mat(0x25483e),
        ),
      );
      const leaf = mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x264c43), [
        x + side * 0.2,
        h * 0.68,
        z,
      ]);
      leaf.scale.set(0.5, 2.8, 0.25);
      leaf.rotation.z = side * -0.7;
      this.room.add(leaf);
    }

    // The clock has no numerals: time is a material, not a UI floating in the scene.
    this.clock.position.copy(AMBER);
    const back = mesh(
      new THREE.CircleGeometry(1.48, 80),
      new THREE.MeshBasicMaterial({ map: amberBacking(), color: 0xe0c99e }),
      [0, 0, -0.23],
    );
    this.clock.add(back);
    for (const [r, thickness] of [
      [1.59, 0.07],
      [1.47, 0.026],
      [1.72, 0.013],
    ]) {
      this.clock.add(
        mesh(new THREE.TorusGeometry(r, thickness, 12, 100), bronze),
      );
    }
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * 2 * PI;
      const tick = box(
        i % 5 ? 0.012 : 0.026,
        i % 5 ? 0.07 : 0.15,
        0.02,
        0xd1b17a,
        [Math.sin(a) * 1.4, Math.cos(a) * 1.4, 0.04],
        0.003,
      );
      tick.rotation.z = -a;
      this.clock.add(tick);
    }
    this.clock.add(
      mesh(new THREE.TorusGeometry(0.19, 0.04, 8, 32), bronze, [0, 1.87, 0]),
    );
    this.clock.add(box(0.2, 0.2, 0.13, 0x9d7548, [0, 1.68, 0]));
    this.room.add(
      rod([AMBER.x, 4.5, AMBER.z], [AMBER.x, 8.0, AMBER.z], 0.018, bronze),
    );
    for (let i = 0; i < 2; i++) {
      const hand = new THREE.Group();
      const len = i ? 0.92 : 0.61;
      hand.add(box(0.025, len, 0.02, 0xb99961, [0, len / 2, -0.1], 0.005));
      this.clockHands.push(hand);
      this.clock.add(hand);
    }
    this.glass = mesh(
      new THREE.SphereGeometry(1.45, 56, 36),
      this.glassMaterial,
      [0, 0, 0.12],
    );
    this.glass.scale.z = 0.63;
    this.glass.renderOrder = 4;
    this.clock.add(this.glass);
    const gleam: number[][] = [];
    for (let i = 0; i < 24; i++) {
      const a = 1.8 + (i / 24) * 0.75;
      gleam.push([Math.cos(a) * 1.27, Math.sin(a) * 1.27, 0.4]);
    }
    this.clock.add(tube(gleam, 0.018, softGold));
    this.halo.position.copy(AMBER).add(new THREE.Vector3(0, 0, -0.5));
    this.group.add(this.halo);

    const reflected = this.clock.clone(true);
    reflected.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.material = new THREE.MeshBasicMaterial({
        color: 0x997447,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      });
      o.renderOrder = 0;
    });
    this.reflection.add(reflected);
    this.reflection.scale.y = -1;
    for (const a of [this.reflectedWhale, this.reflectedClaude]) {
      this.group.remove(a.mesh);
      this.reflection.add(a.mesh);
      a.mesh.renderOrder = 0;
      a.mesh.material.depthWrite = false;
    }

    // The turntable and letter share a table so every close-up belongs to the same room.
    this.table.position.set(-1.85, 0.18, 1.8);
    const tabletop = box(2.6, 0.16, 1.45, 0x644c37, [0, 0.48, 0]);
    tabletop.material = new THREE.MeshStandardMaterial({
      map: woodGrain(),
      roughness: 0.62,
    });
    this.table.add(tabletop);
    for (const x of [-1.05, 1.05])
      for (const z of [-0.52, 0.52])
        this.table.add(rod([x, 0, z], [x, 0.45, z], 0.035, bronze));
    this.turntable.add(box(1.45, 0.12, 1.1, 0x2c3735, [0, 0, 0]));
    this.record = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.44, 0.026, 64),
      [
        mat(0x111718),
        new THREE.MeshStandardMaterial({
          map: vinylTex("#aa6952"),
          metalness: 0.2,
          roughness: 0.32,
        }),
        mat(0x111718),
      ],
    );
    this.record.position.set(-0.14, 0.085, 0);
    this.turntable.add(this.record);
    for (let i = 0; i < 5; i++)
      this.turntable.add(
        box(
          0.09,
          0.015,
          0.08,
          i === 0 ? 0xb97b58 : 0x6d786d,
          [0.34 + i * 0.065, 0.069, 0.34],
          0.008,
        ),
      );
    this.arm.position.set(0.47, 0.15, -0.3);
    this.arm.add(rod([0, 0, 0], [-0.21, 0.015, 0.48], 0.018, bronze));
    this.arm.add(box(0.06, 0.04, 0.12, 0xdac9a4, [-0.21, 0.015, 0.48], 0.006));
    this.turntable.add(this.arm);
    this.turntable.position.set(-0.42, 0.65, 0);
    this.table.add(this.turntable);
    this.letter.group.position.set(0.65, 0.59, 0.04);
    this.letter.group.rotation.y = -0.16;
    this.letter.group.scale.setScalar(0.7);
    this.table.add(this.letter.group);
    const page = box(0.6, 0.006, 0.48, 0xf0e3c8, [0, 0, 0], 0.003);
    this.writing.add(page);
    for (let i = 0; i < 6; i++)
      this.writing.add(
        box(
          0.33 - hash(i) * 0.1,
          0.004,
          0.005,
          0x887b67,
          [-0.03, 0.008, -0.17 + i * 0.045],
          0.001,
        ),
      );
    this.writing.position.set(-1.2, 0.8, 1.84);
    this.group.add(this.writing, this.table);

    for (let i = 0; i < 28; i++) {
      const x = -4.3 + i * 0.23,
        z = -1.5 + Math.sin((i / 28) * PI) * 0.75;
      const key = box(0.215, 0.1, 0.8, 0xcac8b3, [x, 0.2, z], 0.01);
      this.musicKeys.push(key);
      this.music.add(key);
      if ([0, 1, 3, 4, 5].includes(i % 7))
        this.music.add(
          box(0.12, 0.12, 0.46, 0x172a2d, [x + 0.11, 0.3, z - 0.15], 0.006),
        );
    }

    for (let i = 0; i < 6; i++) {
      const photo = mesh(
        new THREE.PlaneGeometry(0.7, 0.84),
        new THREE.MeshBasicMaterial({
          map: photograph(i),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        }),
      );
      photo.renderOrder = 2;
      this.photos.push(photo);
      this.group.add(photo);
    }
    for (let i = 0; i < 38; i++) {
      const petal = mesh(
        new THREE.SphereGeometry(0.05, 5, 4),
        mat(i % 3 ? 0xb98565 : 0xd6be90, { side: THREE.DoubleSide }),
      );
      petal.scale.set(1, 0.23, 1.9);
      this.petals.push(petal);
      this.group.add(petal);
    }
    this.drop.scale.y = 1.6;
    const beanG = this.bean.geometry;
    const bpos = beanG.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bpos.count; i++) {
      const y = bpos.getY(i);
      bpos.setX(i, bpos.getX(i) * (1.0 + y * 0.6) + Math.cos(y * 8) * 0.025);
    }
    beanG.computeVertexNormals();
    this.bean.scale.set(0.8, 1.3, 0.68);
    const hilum = mesh(
      new THREE.SphereGeometry(0.044, 12, 8),
      mat(0xc49c7c),
      [0.005, 0.005, 0.237],
    );
    hilum.scale.set(0.36, 1.45, 0.18);
    this.bean.add(hilum);
    this.warmLight.position.copy(AMBER).add(new THREE.Vector3(-0.5, 0.4, 2));
    this.blueLight.position.set(-3, 4, -1);
    this.group.add(
      this.bean,
      this.beanGlow,
      this.dust.points,
      this.galaxy.points,
      this.drop,
      this.warmLight,
      this.blueLight,
    );
  }

  frame(c: Ctx) {
    const { t, p, e, v } = c;
    const cover = v === "cover";
    this.hideAll();
    e.sky.set(0x081820, 0x16333a, 0x07191f);
    e.sky.sun([-0.4, 0.5, -1], 0xa5d3d8, 0.12);
    fog(e, 0x102b32, 16, 58);
    stars(e, 0.38);
    light(e, 0xc1d5d6, 0x152328, 1.05, 0xffd6a1, 1.4, [-4, 7, 5]);
    e.grade.vig = 0.32;
    e.grade.grain = 0.018;
    e.grade.bloom = 0.85;
    e.grade.warm = 0.08;
    this.warmLight.intensity = 13 + pulse(t) * 0.6;
    this.water.uniforms.uTime.value = t;
    this.water.uniforms.uImpact.value = cover ? 0 : Math.max(0, t - 1.1);
    this.glassMaterial.uniforms.uTime.value = t;
    this.glassMaterial.uniforms.uOpacity.value = 0.7;
    this.clock.rotation.set(
      0,
      Math.sin(t * 0.18) * 0.035,
      Math.sin(t * 0.24) * 0.012,
    );
    this.clockHands[0].rotation.z = -0.5 - t * 0.11;
    this.clockHands[1].rotation.z = 2.1 - t * 0.21;
    this.halo.material.opacity = 0.12 + Math.sin(t * 0.5) * 0.015;
    this.record.rotation.y = Math.max(0, t - 10.0) * 2.5;
    this.arm.rotation.y = lerp(-0.65, 0.1, smooth(range(t, 9.6, 10.4)));
    this.arm.rotation.z = lerp(-0.09, 0, range(t, 10.2, 10.6));
    this.letter.flap.rotation.x = -smooth(range(t, 3.2, 4.5)) * 2.35;
    this.letter.seal.visible = t < 3.5;
    this.writing.position.set(-1.2, 0.79 + Math.sin(t * 1.1) * 0.015, 1.84);
    this.writing.rotation.set(0, -0.16, 0);
    this.writing.visible = !cover && t >= 3.3 && t < 8;
    if (this.writing.visible) {
      const u = smooth(range(t, 3.3, 5.7));
      this.writing.position.y += u * 0.6;
      this.writing.rotation.x = -u * 0.7;
    }
    this.drop.visible = !cover && v === "memory" && t < 1.1;
    this.drop.position.set(
      AMBER.x + 0.35,
      lerp(4.5, 0.03, Math.pow(range(t, 0, 1.1), 1.7)),
      AMBER.z + 0.6,
    );
    this.whale.at(3.25, 0.19, 1.22).show().play("idle");
    this.pastWhale.at(0.93, 1.69, -0.43).show().play("wave");
    this.pastClaude.at(2.16, 1.69, -0.43).show().play("curtsy", 0.6);
    this.musicKeys.forEach((key, i) => {
      key.position.y =
        0.2 -
        Math.max(0, Math.cos(t * 2.6 - i * 0.8)) ** 8 *
          (v === "melody" ? 0.06 : 0.008);
    });

    if (cover) {
      this.pastWhale.play("idle");
      this.pastClaude.play("idle");
      this.whale.play("wave", 0);
      if (e.cam.aspect < 1.1)
        setCam(e.cam, [2.6, 4.1, 15], [1.4, 1.1, -0.4], 38);
      else
        setCam(
          e.cam,
          [0.6 + Math.sin(t * 0.18) * 0.08, 2.85, 10.5],
          [-0.65, 1.95, -0.4],
          39,
        );
    } else if (v === "memory") {
      this.whale.at(3.3, 0.19, 0.1);
      setCam(
        e.cam,
        path3(
          [
            [2.15, 2.65, 6.3],
            [1.0, 2.5, 6.4],
            [0.85, 2.4, 6.7],
          ],
          smooth(p),
        ),
        [1.75, 2.0, -0.5],
        41,
      );
      this.whale.cue(t, [
        [0, "idle"],
        [0.9, "surprise"],
        [2, "sad"],
      ]);
      this.pastClaude.tint(0xf7e0c1, 1 - smooth(range(t, 1.8, 2.8)) * 0.65);
    } else if (v === "letter") {
      this.whale.at(-0.25, 0.19, 1.2).play("sad");
      setCam(
        e.cam,
        mix3([-0.5, 2.75, 4.1], [-1.1, 2.25, 3.35], smooth(p)),
        [-1.1, 0.94, 1.7],
        40,
      );
    } else if (v === "reveal") {
      setCam(
        e.cam,
        mix3([-0.8, 3.05, 10.8], [-0.2, 2.7, 9.2], smooth(p)),
        [-0.2, 1.75, -0.6],
        42,
      );
      this.whale.play("point", 6.4);
    } else if (v === "needle") {
      setCam(
        e.cam,
        mix3([-0.8, 2.4, 3.7], [-1.5, 1.65, 3.25], smooth(p)),
        [-2.28, 0.94, 1.8],
        36,
      );
      this.whale.show(false);
    } else if (v === "melody") {
      const x = lerp(-3.2, 0.0, p),
        z = -1.2 + Math.sin(p * PI) * 0.3;
      this.whale.at(x, 0.31, z).play("walk", 12.6);
      this.pastWhale.show(false);
      setCam(
        e.cam,
        [x + 1.0, 1.3 + p * 0.5, z + 3.5],
        [x + 0.35, 1.0, z - 0.8],
        43,
      );
    } else if (v === "universe") {
      this.whale.show(false);
      this.pastWhale.show(false);
      this.pastClaude.show(false);
      const a = lerp(-0.2, 0.35, smooth(p));
      setCam(
        e.cam,
        [1.6 + Math.sin(a) * 4.6, 2.6, Math.cos(a) * 4.6],
        [1.6, 2.4, -0.3],
        38,
      );
    } else if (v === "goodbye") {
      this.whale.at(-0.55, 0.19, 0.6).play("wave", 19.7);
      this.pastWhale.show(false);
      this.pastClaude.at(0.9 + p * 1.7, 0.19, 0.8).play("walk", 20.0);
      this.pastClaude.tint(0xf7dec2, 1 - smooth(range(p, 0.65, 1)) * 0.75);
      setCam(
        e.cam,
        mix3([1.8, 1.85, 6.2], [1.1, 1.75, 5.8], smooth(p)),
        [0.75, 1.05, 0.5],
        40,
      );
    } else {
      this.whale.at(3.25, 0.19, 1.22).play("point", 22.8);
      this.whale.show(p < 0.35);
      this.pastWhale.play("idle");
      this.pastClaude.play("idle");
      setCam(
        e.cam,
        path3(
          [
            [0.7, 2.7, 7.4],
            [1.5, 2.5, 4.8],
            [1.6, 2.5, 1.05],
          ],
          eIO(p),
        ),
        [1.6, 2.5, -0.65],
        40,
      );
      e.grade.flash = smooth(range(p, 0.94, 1)) * 0.28;
      e.grade.flashCol = 0xc79250;
      this.glassMaterial.uniforms.uOpacity.value = 0.7 * (1 - range(p, 0.8, 1));
    }

    const universe = !cover && v === "universe";
    this.bean.visible = universe;
    this.beanGlow.visible = universe;
    this.galaxy.points.visible = universe;
    this.bean.position.set(1.6, 2.4, 0.28);
    this.bean.rotation.set(0.3, t * 0.5, -0.2);
    this.beanGlow.position.copy(this.bean.position);
    if (universe) {
      const converge = smooth(range(p, 0.35, 0.95));
      this.bean.scale.set(0.8, 1.3, 0.68).multiplyScalar(0.7 + converge * 0.3);
      this.beanGlow.material.opacity = 0.15 + converge * 0.2;
      for (let i = 0; i < 2300; i++) {
        const r =
          Math.pow(hash(i + 45), 0.6) * 2.6 * (1 - converge * 0.72) + 0.16;
        const a =
          (i % 3) * 2.094 + r * 2.7 + t * 0.18 + (hash(i + 4) - 0.5) * 0.4;
        this.galaxy.set(
          i,
          1.6 + Math.cos(a) * r,
          2.4 + Math.sin(a) * r * 0.53 + (hash(i + 7) - 0.5) * 0.14,
          -0.15 + Math.sin(a) * r * 0.2,
          0.7 + hash(i) * 1.3,
        );
        this.galaxy.color(i, C(i % 4 ? 0xdfbd8a : 0x91c9d5));
      }
      this.galaxy.commit();
    }

    this.photos.forEach((photo, i) => {
      photo.visible = cover
        ? i < 2
        : ["letter", "reveal", "melody", "enter"].includes(v);
      const base = i % 2 ? -1 : 1;
      const a = t * 0.12 + i * 1.7;
      photo.position.set(
        base * (2.9 + hash(i) * 1.2),
        1.7 + hash(i + 8) * 1.3 + Math.sin(a) * 0.12,
        -2.2 + hash(i + 3),
      );
      photo.rotation.set(Math.sin(a) * 0.05, base * -0.2, Math.sin(a) * 0.11);
      if (v === "letter" && i === 0) {
        photo.position.set(-1.8, 1.05 + p * 0.4, 1.85);
        photo.scale.setScalar(0.48);
      } else photo.scale.setScalar(0.75);
    });
    this.petals.forEach((petal, i) => {
      const u = (t * (0.022 + hash(i) * 0.015) + hash(i + 6)) % 1;
      petal.position.set(
        (hash(i) - 0.5) * 13 + Math.sin(t * 0.2 + i) * 0.3,
        6 - u * 6,
        -3 + hash(i + 3) * 5,
      );
      petal.rotation.set(t * 0.5 + i, i * 0.7, t * 0.35 + i);
    });
    for (let i = 0; i < 260; i++) {
      this.dust.set(
        i,
        (hash(i) - 0.5) * 13 + Math.sin(t * 0.12 + i) * 0.2,
        (hash(i + 4) * 6 + t * 0.04) % 6,
        -5 + hash(i + 1) * 9,
        0.3 + hash(i + 2) * 0.9,
      );
      this.dust.color(i, C(i % 4 ? 0xe5bd80 : 0x94c5ca), 0.5);
    }
    this.dust.commit();
    this.bulbs.forEach((b, i) => {
      b.material.opacity = 0.23 + (0.5 + 0.5 * Math.sin(t * 0.7 + i)) * 0.1;
    });
    for (const [reflection, actor] of [
      [this.reflectedWhale, this.pastWhale],
      [this.reflectedClaude, this.pastClaude],
    ]) {
      reflection
        .at(actor.mesh.position.x, actor.mesh.position.y, actor.mesh.position.z)
        .show(actor.mesh.visible)
        .play(actor.act, actor.t0);
      reflection.tint(0x729b99, 0.12 * actor.mesh.material.opacity);
    }
  }

  coverFrame(e: Ctx["e"], time: number) {
    this.frame({ t: time, lt: 0, p: 0, dur: 1, v: "cover", e, a: 0, b: 1 });
  }
}
