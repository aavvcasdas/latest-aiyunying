import type { Assets } from "../mv/assets";
import { SHOTS, shotAt } from "../mv/timeline";
import { Kit, World3D, type Post, type Update } from "./kit";
import { SHOTS3D } from "./shots";

/** 按时间切镜：进镜时搭景、出镜时释放；每帧调用 update 并渲染。 */
export class Director {
  world: World3D;
  private kit: Kit | null = null;
  private update: Update | null = null;
  idx = -1;

  constructor(A: Assets, w: number, h: number) {
    this.world = new World3D(A, w, h);
  }

  get canvas() { return this.world.renderer.domElement; }

  render(t: number): { idx: number; post: Post } {
    const idx = shotAt(t);
    if (idx !== this.idx || !this.kit) {
      if (this.kit) { this.world.scene.remove(this.kit.group); this.kit.dispose(); }
      const kit = new Kit(this.world);
      const build = SHOTS3D[SHOTS[idx].key] ?? SHOTS3D.intro;
      this.update = build(kit);
      this.world.scene.add(kit.group);
      this.kit = kit;
      this.idx = idx;
    }
    const shot = SHOTS[idx];
    const lt = t - shot.start;
    const d = Math.max(0.05, shot.end - shot.start);
    this.kit.post.flash = 0;
    this.update!(lt, Math.min(1, lt / d), t);
    this.kit.tick();
    this.world.renderer.render(this.world.scene, this.world.camera);
    return { idx, post: this.kit.post };
  }

  dispose() {
    if (this.kit) this.kit.dispose();
    this.world.renderer.dispose();
  }
}
