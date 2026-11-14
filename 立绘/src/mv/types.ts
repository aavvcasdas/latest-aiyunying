export type CastId = "whale" | "gpt" | "claude" | "gemini" | "kimi" | "doubao" | "qwen" | "zai";
export type Framing = "full" | "knee" | "bust";

/** 一位演员在一个镜头里的编排 */
export interface ActorCue {
  who: CastId;
  action: string;
  /** 站位：-1（最左）… 1（最右） */
  x: number;
  /** 镜头内移动到的站位（走路、靠近时用） */
  x2?: number;
  /** 朝左（镜像） */
  flip?: boolean;
  /** 头顶表情贴；不写则用动作自带的，"none" 表示不要 */
  emote?: string;
  scale?: number;
  /** 动作起始延迟（秒） */
  delay?: number;
}

export interface Shot {
  id: string;
  /** 起止拍 */
  b0: number;
  b1: number;
  title: string;
  /** 对应歌词行，-1 为间奏 */
  line: number;
  bg: string;
  fx: string;
  cam: string;
  framing: Framing;
  actors: ActorCue[];
  caption?: string;
  /** 是否被数据库里的编排覆盖 */
  edited?: boolean;
}

/** 能存进数据库的那部分 */
export interface ShotPatch {
  bg: string;
  fx: string;
  cam: string;
  framing: Framing;
  actors: ActorCue[];
}

export interface CastMeta {
  id: CastId;
  name: string;
  alias: string;
  color: string;
  src: string;
  /** 立绘像素尺寸 */
  w: number;
  h: number;
  /** 颈线：从头顶往下占全高的比例 */
  neck: number;
  /** 脚底中心 / 头部中心的横向比例（脊柱两端） */
  cx: number;
  hx: number;
  look: string;
  motto: string;
  /** 这位角色的招牌动作（设定里写明的） */
  actions: string[];
}
