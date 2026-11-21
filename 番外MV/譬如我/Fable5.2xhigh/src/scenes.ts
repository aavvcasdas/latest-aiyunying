// MV 渲染器：按时间选分镜、统一处理卡点冲屏 / 切镜闪白 / 片尾淡出。
import type { Cast } from "./cast";
import { DUR, SCENE_STARTS, beatPulse } from "./lyrics";
import { H, Painter, W, clamp } from "./painter";
import { type Shot, sceneClash, sceneHall, sceneMe, scenePillow, sceneSmile } from "./scenesA";
import { sceneBloom, sceneCorner, sceneGaze, sceneWait } from "./scenesB";

export { W, H };

const SCENES: ((p: Painter, s: Shot) => void)[] = [
  sceneHall, sceneMe, scenePillow, sceneClash, sceneSmile, sceneWait, sceneGaze, sceneCorner, sceneBloom,
];

export class MvRenderer {
  private p: Painter;
  private tPrev = -1;
  private idxPrev = -1;

  constructor(canvas: HTMLCanvasElement, cast: Cast) {
    this.p = new Painter(canvas, cast);
  }

  /** 字幕里一个词唱完的那一下：在该词的屏幕位置炸一圈 */
  hit(x01: number, y01: number, hue: number): void {
    this.p.ring(x01 * W, y01 * H, hue);
  }

  private step(clock: number): void {
    let dt = clock - this.tPrev;
    if (dt < -0.1 || dt > 0.25) { // 拖动进度 / 重播：粒子清空，避免跨时间残留
      dt = 1 / 60;
      this.p.clearParts();
    } else if (dt < 0) {
      dt = 0; // 音频时钟的微小抖动：当作没走
    }
    this.tPrev = clock;
    this.p.dt = dt;
  }

  /** 片名页背景：第一幕原地呼吸 */
  renderTitle(clock: number): void {
    const p = this.p;
    p.fit();
    this.step(clock);
    if (this.idxPrev !== -2) {
      p.clearParts();
      this.idxPrev = -2;
    }
    p.begin();
    sceneHall(p, { t: clock, lt: 1.4, dur: 2.85, u: 0.5, bp: beatPulse(clock) });
  }

  render(t: number, punch: number): void {
    const p = this.p;
    const c = p.c;
    p.fit();
    this.step(t);
    let idx = 0;
    for (let i = 0; i < SCENE_STARTS.length; i++) if (t >= SCENE_STARTS[i]) idx = i;
    if (idx !== this.idxPrev) { // 切镜：粒子不跨镜头
      p.clearParts();
      this.idxPrev = idx;
    }
    const start = SCENE_STARTS[idx];
    const end = idx + 1 < SCENE_STARTS.length ? SCENE_STARTS[idx + 1] : DUR;
    const lt = t - start;
    p.begin();
    c.save();
    const z = 1 + punch * 0.022; // 卡点冲屏
    c.translate(W / 2, H / 2);
    c.scale(z, z);
    c.translate(-W / 2, -H / 2);
    SCENES[idx](p, { t, lt, dur: end - start, u: clamp(lt / (end - start)), bp: beatPulse(t) });
    p.drawRings();
    c.restore();
    if (idx > 0 && lt < 0.13) { // 切镜闪白
      c.fillStyle = `rgba(225,232,255,${(1 - lt / 0.13) * 0.34})`;
      c.fillRect(0, 0, W, H);
    }
    if (t > 27.4) { // 片尾淡出
      c.fillStyle = `rgba(2,3,8,${clamp((t - 27.4) / 0.55)})`;
      c.fillRect(0, 0, W, H);
    }
  }
}
