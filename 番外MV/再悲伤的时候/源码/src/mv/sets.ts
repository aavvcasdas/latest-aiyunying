// 十个布景（低多边形 + 程序贴图），镜头在 shots.ts 里调度。角色全部来自分支图集。
import * as THREE from 'three';
import { Actor, Particles, Rain, Sprite, TEX, add, ball, box, cyl, emi, glow, hash, lam, skyDome, starField } from './core';

function base(fog: string, near: number, far: number, sky: [string, string, string]) {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(fog, near, far);
  const s = skyDome(sky[0], sky[1], sky[2]); scene.add(s.mesh); return { scene, sky: s };
}
export function water(deep: string, near: string, horizon: string, size = 400) {
  const u = { time: { value: 0 }, deep: { value: new THREE.Color(deep) }, near: { value: new THREE.Color(near) }, horizon: { value: new THREE.Color(horizon) }, glint: { value: new THREE.Color('#ffd9a0') }, gx: { value: 0 }, gs: { value: 1 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'uniform float time; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); w.y += sin(w.x*0.7+time*1.3)*0.035 + sin(w.z*0.9-time*1.1)*0.03; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float time, gx, gs; uniform vec3 deep, near, horizon, glint; varying vec3 vW;
      void main(){ float d = length(vW.xz - cameraPosition.xz);
        float n = sin(vW.x*3.1+time*1.7)*sin(vW.z*2.3-time*1.3) + 0.5*sin(vW.x*7.3-time*2.1+vW.z*5.1);
        vec3 c = mix(near, deep, smoothstep(2.0, 40.0, d)) + n * 0.018;
        float g = exp(-pow((vW.x - gx) / (0.5 + d * 0.06), 2.0)) * smoothstep(0.1, 1.3, n + 0.7) * gs;
        c += glint * g * 0.9; c = mix(c, horizon, smoothstep(25.0, 150.0, d));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), m); mesh.rotation.x = -Math.PI / 2; return { mesh, u };
}
function cloudSprite(color: string, w: number, op: number) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.cloud, color, transparent: true, opacity: op, depthWrite: false, fog: false })); s.scale.set(w, w * 0.5, 1); return s;
}
function lampPost(parent: THREE.Object3D, x: number, z: number, h = 2.7, color = '#ffc77a') {
  const g = add(parent, new THREE.Group(), x, 0, z); const iron = lam('#1c2030');
  add(g, cyl(0.035, 0.05, h, iron), 0, h / 2, 0); add(g, box(0.5, 0.04, 0.04, iron), -0.22, h - 0.05, 0);
  const bulb = add(g, ball(0.09, emi(color, 2.2)), -0.42, h - 0.16, 0); add(g, cyl(0.02, 0.16, 0.12, iron), -0.42, h - 0.08, 0);
  const halo = add(g, glow(color, 1.3, 0.7), -0.42, h - 0.18, 0);
  const cone = add(g, new THREE.Mesh(new THREE.ConeGeometry(0.9, h - 0.2, 24, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.028, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), -0.42, (h - 0.2) / 2, 0);
  return { g, bulb, halo, cone, pos: new THREE.Vector3(x - 0.42, h - 0.16, z) };
}

// A. 雨夜码头（第 1、2、11、12、16 句）
export function makePier() {
  const { scene, sky } = base('#0b1226', 5, 55, ['#04070f', '#1a2442', '#0b1226']);
  scene.add(new THREE.HemisphereLight('#6a80c0', '#0a0f1e', 1.1));
  const stars = starField(450, 300, 2); scene.add(stars.p.pts);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.moon, transparent: true, depthWrite: false, fog: false, opacity: 0 })); moon.scale.set(16, 16, 1); add(scene, moon, -30, 38, -120);
  const moonGlow = add(scene, glow('#cfe0ff', 60, 0), -30, 38, -121);
  const wat = water('#081028', '#13224a', '#0f1730'); add(scene, wat.mesh, 0, -0.4, 0);
  const wood = lam('#43322a'), dark = lam('#2a201b');
  add(scene, box(2.6, 0.14, 16, wood), 0, -0.07, -4);
  for (let i = 0; i < 26; i++) add(scene, box(2.62, 0.02, 0.03, dark), 0, 0.005, 3.6 - i * 0.6);
  for (let i = 0; i < 6; i++) { add(scene, cyl(0.08, 0.08, 1.6, dark), -1.3, -0.6, 3 - i * 2.8); add(scene, cyl(0.08, 0.08, 1.6, dark), 1.3, -0.6, 3 - i * 2.8); }
  const lamp = lampPost(scene, 1.05, 0.4);
  const lampLight = add(scene, new THREE.PointLight('#ffc77a', 14, 10, 1.5), lamp.pos.x, lamp.pos.y, lamp.pos.z);
  const bench = add(scene, new THREE.Group(), -0.55, 0, -0.9);
  add(bench, box(1.3, 0.06, 0.4, wood), 0, 0.42, 0); add(bench, box(1.3, 0.3, 0.05, wood), 0, 0.68, -0.18);
  for (const sx of [-0.55, 0.55]) add(bench, box(0.06, 0.42, 0.36, dark), sx, 0.21, 0);
  const rain = new Rain(1700); scene.add(rain.lines);
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TEX.ring, color: '#9fb6e6', transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; ripples.push(add(scene, m, (hash(i) - 0.5) * 2.4, 0.01, 2 - hash(i + 4) * 7)); }
  const clouds: THREE.Sprite[] = [];
  for (let i = 0; i < 9; i++) clouds.push(add(scene, cloudSprite('#38405c', 70 + hash(i) * 40, 0.95), -80 + i * 22, 28 + hash(i + 2) * 14, -110 - hash(i + 5) * 30));
  const whale = new Actor('whale').addTo(scene);
  const fx = new Particles(1500, TEX.petal, false); scene.add(fx.pts);
  return { scene, sky, stars, moon, moonGlow, wat, lamp, lampLight, rain, ripples, clouds, whale, fx };
}

// B. 黄昏沙漠（第 3 句）
export function makeDesert() {
  const { scene, sky } = base('#e39a74', 12, 120, ['#3b2a62', '#ff9f63', '#e39a74']);
  scene.add(new THREE.HemisphereLight('#ffd0a0', '#7a4a5a', 1.2));
  const sunL = new THREE.DirectionalLight('#ffb070', 2.2); sunL.position.set(-30, 8, -60); scene.add(sunL);
  add(scene, glow('#ffd59a', 70, 0.95), -20, 6, -150); add(scene, glow('#fff1cc', 18, 1), -20, 6, -149);
  const g = new THREE.PlaneGeometry(260, 260, 130, 130); g.rotateX(-Math.PI / 2); const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const fl = Math.exp(-(x * x) / 60 - ((z + 4) * (z + 4)) / 200); p.setY(i, (Math.sin(x * 0.12 + z * 0.05) * 1.6 + Math.sin(x * 0.05 - z * 0.11) * 2.4 + Math.sin(z * 0.2) * 0.5) * (1 - fl) - 0.05 * fl); }
  g.computeVertexNormals(); add(scene, new THREE.Mesh(g, lam('#e3a56c', { flatShading: true })), 0, 0, 0);
  for (let i = 0; i < 7; i++) { const r = add(scene, new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + hash(i) * 0.6), lam('#a8674a', { flatShading: true })), (hash(i + 1) - 0.5) * 30, 0, -6 - hash(i + 2) * 30); r.rotation.set(hash(i) * 3, hash(i + 3) * 3, 0); }
  const whale = new Actor('whale').addTo(scene); const mirage = new Actor('claude').addTo(scene); const refl = new Actor('claude').addTo(scene);
  mirage.mat.transparent = true; refl.mat.transparent = true; mirage.mat.alphaTest = 0.1; refl.mat.alphaTest = 0.1; mirage.mat.depthWrite = false; refl.mat.depthWrite = false;
  const shimmer = add(scene, glow('#fff0d0', 6, 0.0), 0, 1.2, -14);
  return { scene, sky, whale, mirage, refl, shimmer };
}

// C. 傍晚街道（第 4、5、17 句）
export function makeStreet() {
  const { scene, sky } = base('#3a3360', 8, 75, ['#1a1f4f', '#e48aa0', '#3a3360']);
  scene.add(new THREE.HemisphereLight('#a8a0e0', '#2a2238', 1.1));
  add(scene, box(60, 0.1, 160, lam('#3a3a55')), 0, -0.05, -50); add(scene, box(3.2, 0.11, 160, lam('#2c2c42')), 0, -0.04, -50);
  for (let i = 0; i < 30; i++) add(scene, box(0.12, 0.112, 1.2, emi('#8a86a8', 0.6)), 0, -0.035, 4 - i * 4);
  const pal = ['#5b4a7a', '#7a5a6a', '#4a5a7a', '#6a4a5a', '#5a6a8a', '#7a6a8a'];
  for (const side of [-1, 1]) for (let i = 0; i < 16; i++) {
    const w = 2.6 + hash(i * side + 3) * 1.6, h = 2.6 + hash(i * side + 7) * 3.4, z = 4 - i * 4.2, x = side * (4.2 + w / 2);
    add(scene, box(w, h, 3.2, lam(pal[i % pal.length])), x, h / 2, z);
    add(scene, new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 1.1, 4), lam('#3a2a3a')), x, h + 0.5, z).rotation.y = Math.PI / 4;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) if (hash(i * 13 + r * 3 + c + side) > 0.3) add(scene, new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), emi(hash(i + r + c) > 0.5 ? '#ffcf7a' : '#ffb15c', 1.4)), x - side * (w / 2 + 0.01), 1.1 + r * 1.3, z - 0.6 + c * 1.2).rotation.y = -side * Math.PI / 2;
  }
  const lamps = [0, 1, 2, 3, 4, 5, 6].map((i) => lampPost(scene, 2.2, 1.5 - i * 7));
  const lampLight = add(scene, new THREE.PointLight('#ffc77a', 12, 9, 1.4), lamps[0].pos.x, lamps[0].pos.y, lamps[0].pos.z);
  const whale = new Actor('whale').addTo(scene); const claude = new Actor('claude').addTo(scene);
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.bubble, color: '#b9bdcc', transparent: true, depthWrite: false })); scene.add(bubble);
  const fxs = new Sprite(0.9, 'center'); scene.add(fxs.mesh);
  const petals = new Particles(400, TEX.spark, true); scene.add(petals.pts);
  return { scene, sky, lamps, lampLight, whale, claude, bubble, fxs, petals };
}

// D. 时钟广场（第 6 句）
export function makeClock() {
  const { scene, sky } = base('#2a2346', 10, 70, ['#151338', '#c46a7a', '#2a2346']);
  scene.add(new THREE.HemisphereLight('#c0b0ff', '#20182c', 1.2));
  add(scene, box(80, 0.1, 80, lam('#2a2540')), 0, -0.05, -10);
  for (let i = 0; i < 12; i++) add(scene, new THREE.Mesh(new THREE.RingGeometry(1.6 + i * 1.3, 1.62 + i * 1.3, 64), emi('#6a5a9a', 0.5)), 0, 0.01, -2).rotation.x = -Math.PI / 2;
  const tower = add(scene, box(9.4, 9.6, 1, lam('#3a2f55')), 0, 4.8, -8.6);
  const face = add(scene, new THREE.Mesh(new THREE.CircleGeometry(4, 64), new THREE.MeshBasicMaterial({ map: TEX.clock, color: '#a39886' })), 0, 4.8, -8.05);
  const hour = add(scene, new THREE.Group(), 0, 4.8, -7.98), minute = add(scene, new THREE.Group(), 0, 4.8, -7.96);
  add(hour, box(0.22, 2.2, 0.04, lam('#3a2a1a')), 0, 1.0, 0); add(minute, box(0.13, 3.3, 0.04, lam('#5a3a1a')), 0, 1.5, 0);
  add(scene, glow('#ffe0b0', 12, 0.07), 0, 4.8, -8.2);
  const glass = new Sprite(2.4); glass.frame('prop_hourglass'); add(scene, glass.mesh, -3.4, 0, -3.5);
  const heart = new Sprite(0.8, 'center'); heart.frame('fx_heart'); scene.add(heart.mesh); const heartGlow = add(scene, glow('#ff8fb0', 1.4, 0.9), 0, 0, 0);
  const whale = new Actor('whale').addTo(scene);
  const motes = new Particles(300); scene.add(motes.pts);
  return { scene, sky, hour, minute, face, tower, glass, heart, heartGlow, whale, motes };
}

// E. 月夜卧室（第 7 句）
export function makeRoom() {
  const { scene, sky } = base('#0b0f22', 30, 200, ['#050818', '#1b2350', '#0b0f22']);
  scene.add(new THREE.HemisphereLight('#4a5aa0', '#120e1a', 0.55));
  const moonL = new THREE.DirectionalLight('#b8c8ff', 1.6); moonL.position.set(2, 3, -6); scene.add(moonL);
  const stars = starField(380, 150, 5, 1.4); scene.add(stars.p.pts);
  const wall = lam('#2c2a4a');
  add(scene, box(3, 6, 0.3, wall), -3.9, 2.5, -2.4); add(scene, box(3.2, 6, 0.3, wall), 3.9, 2.5, -2.4); add(scene, box(4.8, 1.5, 0.3, wall), 0, 0.25, -2.4); add(scene, box(4.8, 1.8, 0.3, wall), 0, 4.6, -2.4);
  const frame = lam('#5a4a3a'); add(scene, box(4.9, 0.12, 0.4, frame), 0, 1.0, -2.3); add(scene, box(4.9, 0.12, 0.4, frame), 0, 3.7, -2.3); add(scene, box(0.12, 2.8, 0.4, frame), 0, 2.35, -2.3);
  add(scene, box(12, 0.1, 8, lam('#2a2436')), 0, -0.05, 1);
  const bed = add(scene, new THREE.Group(), -1.2, 0, -0.6);
  add(bed, box(2.6, 0.45, 1.4, lam('#4a3a5a')), 0, 0.22, 0); add(bed, box(2.5, 0.16, 1.3, lam('#c8d0ee')), 0, 0.52, 0); add(bed, box(0.5, 0.18, 0.9, lam('#ffffff')), -0.95, 0.68, 0);
  const blanket = add(bed, box(1.5, 0.12, 1.34, lam('#6a8ad8')), 0.45, 0.64, 0);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.moon, transparent: true, depthWrite: false, fog: false })); moon.scale.set(9, 9, 1); add(scene, moon, 1.4, 6.5, -24);
  add(scene, glow('#d8e4ff', 26, 0.55), 1.4, 6.5, -24.5);
  const kimi = new Actor('kimi', 2.2).addTo(scene); kimi.shadow.visible = false;
  const zzz = [0, 1, 2].map(() => { const s = new Sprite(0.6, 'center'); scene.add(s.mesh); return s; });
  const whale = new Actor('whale').addTo(scene);
  const beam = add(scene, new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6), new THREE.MeshBasicMaterial({ map: TEX.beam, color: '#9fb4ff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), 0.3, 1.2, -0.6);
  beam.rotation.set(-1.0, 0, 0);
  return { scene, sky, stars, moon, kimi, zzz, whale, bed, blanket, beam };
}

// F. 时钟深渊（第 8 句）
export function makeAbyss() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d0824'); scene.fog = new THREE.Fog('#0d0824', 6, 46);
  scene.add(new THREE.HemisphereLight('#b0a0ff', '#100820', 1.4));
  const stars = starField(600, 60, 9, 1.0); scene.add(stars.p.pts);
  const clocks: { g: THREE.Group; h: THREE.Group; m: THREE.Group; sp: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.2, r = 2.6 + hash(i) * 2.4, z = 4 - i * 1.15, s = 0.5 + hash(i + 3) * 1.1;
    const g = add(scene, new THREE.Group(), Math.cos(a) * r, Math.sin(a) * r + 1.2, z); g.rotation.set((hash(i + 1) - 0.5) * 0.9, (hash(i + 2) - 0.5) * 1.2, hash(i) * 6);
    add(g, new THREE.Mesh(new THREE.CircleGeometry(s, 40), new THREE.MeshBasicMaterial({ map: TEX.clock, color: '#9a90c4', side: THREE.DoubleSide })), 0, 0, 0);
    const h = add(g, new THREE.Group(), 0, 0, 0.02), m = add(g, new THREE.Group(), 0, 0, 0.03);
    add(h, box(0.06 * s, 0.5 * s, 0.01, lam('#3a2a1a')), 0, 0.22 * s, 0); add(m, box(0.04 * s, 0.75 * s, 0.01, lam('#5a3a1a')), 0, 0.34 * s, 0);
    clocks.push({ g, h, m, sp: 0.5 + hash(i + 9) * 3 });
  }
  const gemini = new Actor('gemini', 1.3).addTo(scene); gemini.shadow.visible = false;
  const cl = new Sprite(0.9, 'center'), cr = new Sprite(0.9, 'center'); cl.frame('prop_catclock'); cr.frame('prop_catclock', true); scene.add(cl.mesh, cr.mesh);
  add(scene, glow('#a88cff', 6, 0.1), 0, 1.2, -1);
  return { scene, stars, clocks, gemini, cl, cr };
}

// G. 梦里的盛宴（第 9、10、12 句）
export function makeFeast() {
  const { scene, sky } = base('#3a1426', 10, 60, ['#16061e', '#6a2240', '#3a1426']);
  scene.add(new THREE.HemisphereLight('#ffb8a0', '#2a1018', 0.75));
  const warm1 = add(scene, new THREE.PointLight('#ffb060', 4.5, 12, 1.3), 0, 2.6, 0), warm2 = add(scene, new THREE.PointLight('#ff8060', 3, 12, 1.3), 0, 2.4, -4.5);
  add(scene, box(40, 0.1, 40, lam('#3a2026')), 0, -0.05, -3); add(scene, box(3.2, 0.11, 12, lam('#8a2432')), 0, -0.045, -2.5);
  const table = add(scene, new THREE.Group(), 0, 0, -2.4);
  add(table, box(1.5, 0.08, 7.2, lam('#cdbca6')), 0, 0.62, 0); add(table, box(1.54, 0.2, 7.24, lam('#b8a48c')), 0, 0.52, 0); add(table, box(0.42, 0.085, 7.22, lam('#c23a48')), 0, 0.625, 0);
  for (const [lx, lz] of [[-0.65, -3.4], [0.65, -3.4], [-0.65, 3.4], [0.65, 3.4]]) add(table, box(0.08, 0.5, 0.08, lam('#5a3a2a')), lx, 0.25, lz);
  for (let i = 0; i < 7; i++) {
    const z = -3 + i * 1.0; add(table, cyl(0.16, 0.16, 0.02, lam('#ffffff'), 20), -0.45, 0.67, z); add(table, cyl(0.16, 0.16, 0.02, lam('#ffffff'), 20), 0.45, 0.67, z);
    if (i % 2 === 0) { add(table, cyl(0.025, 0.025, 0.22, lam('#fff8e8')), 0, 0.78, z + 0.5); add(table, glow('#ffc070', 0.5, 0.6), 0, 0.92, z + 0.5); }
  }
  const flowers: THREE.Group[] = []; const fc = ['#ff8fb0', '#ffd36e', '#ff6f7f', '#ffb3d1', '#fff0a0', '#ff9a6a', '#ffc0e0', '#ffe08a', '#ff7aa0', '#ffd0a0', '#ffb070'];
  for (let i = 0; i < 11; i++) {
    const fg = add(table, new THREE.Group(), (hash(i) - 0.5) * 0.9, 0.66, -3.2 + i * 0.64); add(fg, cyl(0.012, 0.012, 0.22, lam('#4a8a4a')), 0, 0.11, 0);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; add(fg, ball(0.05, lam(fc[i]), 8), Math.cos(a) * 0.06, 0.24, Math.sin(a) * 0.06); }
    add(fg, ball(0.04, emi('#fff4c0', 1.2), 8), 0, 0.25, 0); fg.scale.setScalar(0.001); flowers.push(fg);
  }
  const lanterns: THREE.Object3D[] = [];
  for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1; const z = 2 - Math.floor(i / 2) * 1.2; const l = add(scene, ball(0.16, emi('#ff5a3a', 1.6), 12), side * 1.4, 2.4 - Math.abs(Math.sin(i)) * 0.15, z); add(l, glow('#ff9a5a', 1.1, 0.45), 0, 0, 0); lanterns.push(l); }
  const cast: Record<string, Actor> = {}; for (const ch of ['whale', 'claude', 'qwen', 'doubao', 'gemini', 'kimi', 'zai']) cast[ch] = new Actor(ch).addTo(scene);
  const bowl = new Sprite(0.55, 'center'); bowl.frame('prop_bowl'); scene.add(bowl.mesh);
  const cup = new Sprite(0.45, 'center'); cup.frame('prop_teacup'); scene.add(cup.mesh);
  const fan = new Sprite(0.5, 'center'); fan.frame('prop_fan'); scene.add(fan.mesh);
  const skyLantern = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.lantern, transparent: true, depthWrite: false, fog: false })); skyLantern.scale.set(0.45, 0.68, 1); scene.add(skyLantern);
  const skyLanternGlow = glow('#ffb060', 1.1, 0.5); scene.add(skyLanternGlow);
  const confetti = new Particles(900, TEX.petal, false); scene.add(confetti.pts);
  const bokeh = new Particles(200, TEX.glow, true); scene.add(bokeh.pts);
  return { scene, sky, table, flowers, lanterns, cast, bowl, cup, fan, skyLantern, skyLanternGlow, confetti, bokeh, warm1, warm2 };
}

// H. 湖边烟火（第 13–15 句）
export function makeHarbor() {
  const { scene, sky } = base('#070b1c', 25, 160, ['#02040c', '#16204a', '#070b1c']);
  scene.add(new THREE.HemisphereLight('#7080c0', '#0a0c18', 1.0));
  const stars = starField(500, 300, 11); scene.add(stars.p.pts);
  const wat = water('#060c22', '#0f1a3c', '#0c1430'); add(scene, wat.mesh, 0, -0.5, 0);
  add(scene, box(70, 0.5, 6, lam('#2a2a3a')), 0, -0.25, 3); add(scene, box(70, 0.06, 0.08, lam('#5a5a6a')), 0, 0.55, 0.15);
  for (let i = 0; i < 36; i++) add(scene, box(0.05, 0.55, 0.05, lam('#4a4a5a')), -35 + i * 2, 0.27, 0.15);
  for (let i = 0; i < 9; i++) add(scene, new THREE.Mesh(new THREE.ConeGeometry(14 + hash(i) * 10, 8 + hash(i + 1) * 10, 5), lam('#0d1226')), -70 + i * 18, 2, -90 - hash(i + 2) * 20);
  const cast: Record<string, Actor> = {}; for (const ch of ['whale', 'claude', 'kimi', 'gemini', 'qwen', 'zai', 'doubao']) cast[ch] = new Actor(ch).addTo(scene);
  const fw = new Particles(9000); scene.add(fw.pts);
  const threads = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 6), 3)), new THREE.LineBasicMaterial({ color: '#ffd28a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  threads.frustumCulled = false; scene.add(threads);
  const reflect = new Particles(400, TEX.glow, true); scene.add(reflect.pts);
  return { scene, sky, stars, wat, cast, fw, threads, reflect };
}

// I. 海：小船 / 灯塔 / 向前的路 / 礁石 / 天空海阔（第 18–21 句）
export function makeSea() {
  const { scene, sky } = base('#0e1636', 30, 220, ['#050a1c', '#223064', '#0e1636']);
  const hemi = new THREE.HemisphereLight('#8090d0', '#0a0c18', 1.1); scene.add(hemi);
  const stars = starField(700, 300, 21, 1.3); scene.add(stars.p.pts);
  const wat = water('#07102a', '#13224c', '#18244a'); add(scene, wat.mesh, 0, -0.3, 0);
  const boat = add(scene, new THREE.Group(), 0, -0.2, 0);
  add(boat, box(2.4, 0.38, 1.0, lam('#8a5a3a')), 0, 0.12, 0); add(boat, box(2.5, 0.06, 1.06, lam('#c08a5a')), 0, 0.33, 0);
  add(boat, new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), lam('#8a5a3a')), 1.55, 0.12, 0).rotation.set(0, Math.PI / 4, -Math.PI / 2);
  add(boat, cyl(0.03, 0.03, 1.6, lam('#5a3a2a')), -0.9, 1.0, 0); const boatLamp = add(boat, glow('#ffc070', 1.2, 1), -0.9, 1.75, 0); add(boat, ball(0.06, emi('#ffd090', 2)), -0.9, 1.75, 0);
  const dock = add(scene, new THREE.Group(), 4.2, 0, -1.5);
  add(dock, box(3, 0.16, 2.4, lam('#5a4636')), 0, 0.05, 0); for (const [x, z] of [[-1.4, -1.1], [1.4, -1.1], [-1.4, 1.1], [1.4, 1.1]]) add(dock, cyl(0.07, 0.07, 1.0, lam('#3a2a20')), x, -0.3, z);
  const tower = add(scene, new THREE.Group(), 5.6, 0, -2.4);
  for (let i = 0; i < 5; i++) add(tower, cyl(0.42 - i * 0.04, 0.46 - i * 0.04, 0.8, lam(i % 2 ? '#c84a4a' : '#f2f0ea')), 0, 0.4 + i * 0.8, 0);
  add(tower, ball(0.3, emi('#fff2c0', 2)), 0, 4.3, 0); add(tower, glow('#fff0c0', 3, 1), 0, 4.3, 0);
  const beam = add(tower, new THREE.Mesh(new THREE.ConeGeometry(1.4, 14, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2c8', transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })), 0, 4.3, 0);
  const road = add(scene, new THREE.Group(), -40, 0, 0);
  add(road, box(1.6, 0.12, 80, lam('#4a3a32')), 0, 0, -36);
  const roadLamps = Array.from({ length: 14 }, (_, i) => { const z = -2 - i * 5; const l = lampPost(road, i % 2 ? 1.2 : -0.75, z, 1.9); return l; });
  const rock = add(scene, new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), lam('#2a2e44', { flatShading: true })), 30, -0.6, -6); rock.scale.set(1.3, 0.75, 1.1);
  const milky = new Particles(1400, TEX.spark, true); scene.add(milky.pts);
  const dragon = new Sprite(3.2, 'center'); scene.add(dragon.mesh); dragon.mat.fog = false;
  const clouds: THREE.Sprite[] = []; for (let i = 0; i < 10; i++) clouds.push(add(scene, cloudSprite('#ffd0b0', 60 + hash(i) * 50, 0), -120 + i * 26, 22 + hash(i + 1) * 20, -150 - hash(i + 3) * 30));
  const sun = add(scene, glow('#ffd8a0', 80, 0), 0, 2, -200);
  const cast: Record<string, Actor> = {}; for (const ch of ['whale', 'claude']) cast[ch] = new Actor(ch).addTo(scene);
  const book = new Sprite(0.4, 'center'); book.frame('prop_book'); scene.add(book.mesh);
  return { scene, sky, hemi, stars, wat, boat, boatLamp, dock, tower, beam, road, roadLamps, rock, milky, dragon, clouds, sun, cast, book };
}

// J. 日出山坡（第 22 句 + 片尾）
export function makeDawn() {
  const { scene, sky } = base('#d89a86', 30, 170, ['#3f5cb8', '#f49a6c', '#f6bf92']);
  scene.add(new THREE.HemisphereLight('#ffe0c0', '#6a5a7a', 0.8));
  const sunL = new THREE.DirectionalLight('#ffd0a0', 0.9); sunL.position.set(0, 6, -40); scene.add(sunL);
  const sun = add(scene, glow('#ffd8a8', 36, 0.55), 0, 4, -160); const sunCore = add(scene, glow('#fff4dc', 10, 0.8), 0, 4, -159);
  const hill = add(scene, new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), lam('#6aa868')), 0, -39.2, -6); hill.scale.set(1.6, 1, 1);
  for (let i = 0; i < 6; i++) add(scene, new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), lam(i % 2 ? '#7aa8a0' : '#8ab0c0')), -120 + i * 48, -24, -110 - hash(i) * 20);
  const flowers = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 6), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), 600);
  const fc = ['#ffffff', '#ffd6e8', '#fff0a0', '#ffb3c7', '#ffe0f0']; const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const fpos: number[] = [];
  for (let i = 0; i < 600; i++) { const x = (hash(i) - 0.5) * 26, z = 2 - hash(i + 7) * 22; const y = Math.sqrt(Math.max(0, 1600 - (x / 1.6) ** 2 - (z + 6) ** 2)) - 39.2 + 0.04; fpos.push(x, y, z); m4.makeTranslation(x, y, z); flowers.setMatrixAt(i, m4); flowers.setColorAt(i, col.set(fc[i % fc.length])); }
  scene.add(flowers);
  const cast: Record<string, Actor> = {}; for (const ch of ['whale', 'claude', 'kimi', 'gemini', 'qwen', 'zai', 'doubao']) cast[ch] = new Actor(ch).addTo(scene);
  const petals = new Particles(700, TEX.petal, false); scene.add(petals.pts);
  const sparkle = new Particles(500); scene.add(sparkle.pts);
  const clouds: THREE.Sprite[] = []; for (let i = 0; i < 8; i++) clouds.push(add(scene, cloudSprite('#e8b8a8', 50 + hash(i) * 40, 0.45), -100 + i * 30, 26 + hash(i + 2) * 16, -140));
  return { scene, sky, sun, sunCore, hill, flowers, fpos, cast, petals, sparkle, clouds };
}

export function groundY(x: number, z: number) { return Math.sqrt(Math.max(0, 1600 - (x / 1.6) ** 2 - (z + 6) ** 2)) - 39.2; }
export type Sets = { pier: ReturnType<typeof makePier>; desert: ReturnType<typeof makeDesert>; street: ReturnType<typeof makeStreet>; clock: ReturnType<typeof makeClock>; room: ReturnType<typeof makeRoom>; abyss: ReturnType<typeof makeAbyss>; feast: ReturnType<typeof makeFeast>; harbor: ReturnType<typeof makeHarbor>; sea: ReturnType<typeof makeSea>; dawn: ReturnType<typeof makeDawn> };
export function makeSets(): Sets {
  return { pier: makePier(), desert: makeDesert(), street: makeStreet(), clock: makeClock(), room: makeRoom(), abyss: makeAbyss(), feast: makeFeast(), harbor: makeHarbor(), sea: makeSea(), dawn: makeDawn() };
}
