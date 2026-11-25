import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import atlasUrl from '../assets/atlas.png';
import benyuUrl from '../assets/benyu_px.png';
import { SharedResources } from './kit';
import { CinemaGradeShader } from './shaders';
import { renderStoryFrame, type FrameGrading } from './shots';
import { MVWorld } from './world';

export class MVEngine {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  gradePass: ShaderPass;
  shared: SharedResources;
  world: MVWorld | null = null;
  ready = false;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.1, 260);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.45, 0.52, 0.82);
    this.composer.addPass(this.bloomPass);

    this.gradePass = new ShaderPass(CinemaGradeShader);
    this.composer.addPass(this.gradePass);

    this.composer.addPass(new OutputPass());

    this.shared = new SharedResources();
  }

  async init(onProgress?: (progress: number, label: string) => void) {
    onProgress?.(0.08, '载入分支人物像素图集与笨鱼素材...');
    await this.shared.load(atlasUrl, benyuUrl);
    if (this.disposed) return;

    this.world = new MVWorld(this.scene, this.shared);

    onProgress?.(0.2, '载入 Blender 3D 场景分镜模型...');
    await this.world.loadBlenderAssets((p) => {
      onProgress?.(0.2 + p * 0.78, `装配 Blender 分镜模型 (${Math.round(p * 11)}/11)...`);
    });
    if (this.disposed) return;

    this.ready = true;
    onProgress?.(1.0, '准备就绪');
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0 || this.disposed) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  render(T: number): FrameGrading | null {
    if (!this.ready || !this.world || this.disposed) return null;
    const grading = renderStoryFrame(this.world, this.camera, T);
    this.bloomPass.strength = grading.bloomStrength;
    this.gradePass.uniforms.uFlash.value = grading.flash;
    this.gradePass.uniforms.uFlashColor.value.set(grading.flashColor);
    this.gradePass.uniforms.uVignette.value = grading.vignette;
    this.gradePass.uniforms.uWarmth.value = grading.warmth;
    this.composer.render();
    return grading;
  }

  dispose() {
    this.disposed = true;
    this.composer.dispose();
    this.renderer.dispose();
  }
}
