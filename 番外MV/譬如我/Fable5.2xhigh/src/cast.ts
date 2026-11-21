// 分支角色图集（人物/atlas.png + 人物/index.json）。
// 图集 PNG 经 vite-singlefile 内联进 HTML；帧索引是生成好的 TS 常量，运行时不发任何网络请求。
import atlasUrl from "./assets/atlas.png";
import { CAST_INDEX, CAST_SINGLES } from "./assets/castIndex";

export class Cast {
  img!: HTMLImageElement;
  /** 整张图集的深色剪影 / 白色剪影（用来画远景人影、描边、幽灵） */
  dark!: HTMLCanvasElement;
  white!: HTMLCanvasElement;

  static async load(): Promise<Cast> {
    const c = new Cast();
    const im = new Image();
    im.src = atlasUrl;
    await im.decode();
    c.img = im;
    c.dark = Cast.silhouette(im, "#05081a");
    c.white = Cast.silhouette(im, "#ffffff");
    return c;
  }

  private static silhouette(im: HTMLImageElement, color: string): HTMLCanvasElement {
    const cv = document.createElement("canvas");
    cv.width = im.naturalWidth;
    cv.height = im.naturalHeight;
    const x = cv.getContext("2d")!;
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color;
    x.fillRect(0, 0, cv.width, cv.height);
    return cv;
  }

  /** 某角色某动作的帧序列 [x,y,w,h][]；找不到就退回 idle / nod / 任意动作 */
  frames(char: string, action: string): number[][] {
    const ch = CAST_INDEX[char] ?? CAST_INDEX.whale;
    return ch.acts[action] ?? ch.acts.idle ?? ch.acts.nod ?? Object.values(ch.acts)[0];
  }

  /** 角色的参考身高（idle 帧高，像素）——不同动作帧高不同，统一按它算缩放，角色才不会忽大忽小 */
  ref(char: string): number {
    return (CAST_INDEX[char] ?? CAST_INDEX.whale).ref;
  }

  /** 单帧：道具 prop_* / 特效 fx_* / 头像 p_* / 高清立绘 whale_big_* */
  single(name: string): number[] | undefined {
    return CAST_SINGLES[name];
  }
}
