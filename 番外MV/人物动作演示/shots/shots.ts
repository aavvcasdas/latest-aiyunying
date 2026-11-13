// 《人物动作演示》的镜头表：只演 2026-11 补丁搬进来的那批东西——派生动作、像素道具、表情贴。
// 没有歌、没有字幕、没有片名卡：观众看到的每一秒都是动作本身。
// 动作按「谁、用什么道具、手里有什么表情贴」分组，一个角色一个镜头；最后两镜把 12 张表情贴和 12 件道具逐个数一遍。
import { cam, glide, type Kit, type ShotDef } from '@tpl/core';
import { box, disc } from '@tpl/kit';

/** 舞台底板：一块深色圆台 + 三块矮台阶，给纵深，也不抢人物的颜色 */
function stage(k: Kit) {
  k.add(disc(90, 0x2b2740));
  k.add(box(30, 2.6, 0.6, 0x3a3352), 0, 0, -7.2);   // 后墙，让渐变有个落点
  k.add(box(30, 0.12, 0.9, 0x4a4266), 0, 2.6, -7.2); // 墙顶的一条亮线
}

/** 一个角色一个镜头时用的机位：从全身推到头肩，人始终在画面中间 */
const push = (from: [number, number, number], to: [number, number, number], look: [number, number, number], fov = 33) => ({
  A: cam(from, look, fov), B: cam(to, [look[0], look[1] - 0.06, look[2]], fov - 2),
});

export const SHOTS: ShotDef[] = [
  {
    id: 'A0', look: 'stage', title: '八个人的待机', cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    note: '八位排成一排各自 idle(T)：呼吸 + 眨眼，龙娘是悬浮待机。以前这一排只能 front(T) 站着不动。',
    build: (k) => {
      stage(k);
      const ids = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'] as const;
      const cast = ids.map((id) => k.actor(id));
      const A = cam([0, 2.2, 10.6], [0, 1.1, 0], 40), B = cam([0, 1.85, 9.2], [0, 1.1, 0], 38);
      return ({ u, T }) => {
        cast.forEach((a, i) => {
          a.idle(T).at((i - 3.5) * 1.72, 0, Math.abs(i - 3.5) * -0.28);
          if (i === 1) a.lift(0.06); // 龙娘浮着
        });
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B1', look: 'stage', title: '本鲸：挥手 → 递出去 → 干饭 → 开心跳', cast: ['whale'],
    note: '接手道具 prop_bowl：干饭那一段把饭盆摆在手边，不画假手；最后 hop 循环跳。',
    build: (k) => {
      stage(k);
      const w = k.actor('whale'), bowl = k.thing('prop_bowl', 0.9);
      const { A, B } = push([0, 1.42, 4.6], [0, 1.38, 3.8], [0, 1.0, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.1) w.act('wave', T);
        else if (t < 2.2) w.act('point', T);
        else if (t < 3.3) w.act('eat', T).emote('fx_heart', T);
        else w.act('hop', T);
        w.at(0, 0, 0);
        if (t >= 2.2 && t < 3.5) bowl.at(0.78, 0, 0.12); else bowl.hide();
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B2', look: 'magic', title: '龙娘：悬浮 → 振翅 → 施法 → 生气', cast: ['gpt'],
    note: 'float 是她的待机；hover 振翅飞起来；cast 只用 gpt_boss_cast0（原图 cast1 的小腿是坏的）；rage 完接表情贴汗滴。',
    build: (k) => {
      stage(k);
      const g = k.actor('gpt'), hour = k.thing('prop_hourglass', 0.8);
      const { A, B } = push([0, 1.9, 5.0], [0.25, 1.9, 4.2], [0, 1.4, 0], 34);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.0) g.act('float', T);
        else if (t < 2.0) g.act('hover', T);
        else if (t < 3.2) g.act('cast', T).emote('fx_sparkle', T);
        else g.act('rage', T).emote('fx_anger', T);
        g.at(0, t < 2.0 ? 0 : Math.min(0.55, (t - 2) * 0.5), 0);
        hour.at(1.05, 0, 0.1);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B3', look: 'cozy', title: '小克：提裙行礼 → 看书 → 石化 → 左右张望', cast: ['claude'],
    note: 'curtsy 手边放茶杯；read 时书摆在身前；petri 石化后摆惊疑的表情贴。',
    build: (k) => {
      stage(k);
      const c = k.actor('claude'), cup = k.thing('prop_teacup', 0.8), book = k.thing('prop_book', 0.9);
      const { A, B } = push([0, 1.4, 4.5], [-0.18, 1.36, 3.8], [0, 0.98, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.1) c.act('curtsy', T);
        else if (t < 2.3) c.act('read', T);
        else if (t < 3.2) c.act('petri', T).emote('fx_question', T);
        else c.act('lookaround', T);
        c.at(0, 0, 0);
        cup.at(-0.82, 0, 0.12);
        if (t >= 2.3 && t < 3.6) book.at(0.15, 0.36, 0.5); else book.hide();
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B4', look: 'golden', title: '豆包：踩拍 → 摇摆 → 转圈 → 开心跳', cast: ['doubao'],
    note: 'step 踩拍、sway 摇摆、spin 转圈都是循环动作；菜篮和红鞋摆在脚边。',
    build: (k) => {
      stage(k);
      const d = k.actor('doubao'), basket = k.thing('prop_basket', 0.9), shoes = k.thing('prop_redshoes', 0.7);
      const { A, B } = push([0, 1.42, 4.4], [0.2, 1.38, 3.7], [0, 1.0, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.0) d.act('step', T);
        else if (t < 2.1) d.act('sway', T);
        else if (t < 3.2) d.act('spin', T).emote('fx_sparkle', T);
        else d.act('hop', T);
        d.at(0, 0, 0);
        basket.at(-0.9, 0, 0.14);
        shoes.at(0.95, 0, 0.1);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B5', look: 'cave', title: '猫：左右张望 → 两边想想再选 → 摇摆', cast: ['gemini'],
    note: 'choose 是两边各想一遍再定；猫钟与刷子摆在手边。',
    build: (k) => {
      stage(k);
      const m = k.actor('gemini'), clock = k.thing('prop_catclock', 0.85), brush = k.thing('prop_brush', 0.75);
      const { A, B } = push([0, 1.5, 4.7], [-0.18, 1.46, 3.9], [0, 1.02, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.2) m.act('lookaround', T);
        else if (t < 2.8) m.act('choose', T).emote('fx_question', T);
        else m.act('sway', T);
        m.at(0, 0, 0);
        clock.at(-0.92, 0, 0.1);
        brush.at(0.88, 0, 0.12);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B6', look: 'dusk', title: '狐狸：打盹 → 惊醒竖耳 → 左右张望', cast: ['zai'],
    note: 'doze 循环打盹，头顶挂 fx_zzz 轮播；alert 一下惊醒；算盘和眼罩摆在两边。',
    build: (k) => {
      stage(k);
      const z = k.actor('zai'), abacus = k.thing('prop_abacus', 0.85), mask = k.thing('prop_eyemask', 0.7);
      const { A, B } = push([0, 1.55, 4.7], [0, 1.5, 3.9], [0, 1.05, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.8) z.act('doze', T).emote('fx_zzz', T);
        else if (t < 2.9) z.act('alert', T).emote('fx_exclaim', T);
        else z.act('lookaround', T);
        z.at(0, 0, 0);
        abacus.at(-0.95, 0, 0.1);
        mask.at(0.9, 0, 0.12);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B7', look: 'afterRain', title: 'Kimi：想事情 → 点头 → 左右张望', cast: ['kimi'],
    note: 'think 循环想事；卷轴摆在她手边。',
    build: (k) => {
      stage(k);
      const kk = k.actor('kimi'), scroll = k.thing('prop_scroll', 0.85);
      const { A, B } = push([0, 1.45, 4.4], [0.18, 1.4, 3.7], [0, 1.0, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.8) kk.act('think', T).emote('fx_bulb', T);
        else if (t < 2.9) kk.act('nod', T);
        else kk.act('lookaround', T);
        kk.at(0, 0, 0);
        scroll.at(0.9, 0, 0.12);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'B8', look: 'forest', title: '千问：转圈 → 鞠躬 → 摇摆', cast: ['qwen'],
    note: '疯帽子转圈 spin，东道主 bow，最后 sway 循环；扇子与茶杯摆在两边。',
    build: (k) => {
      stage(k);
      const q = k.actor('qwen'), fan = k.thing('prop_fan', 0.8), cup = k.thing('prop_teacup', 0.8);
      const { A, B } = push([0, 1.45, 4.5], [-0.22, 1.42, 3.8], [0, 1.0, 0], 32);
      return ({ u, T }) => {
        const t = T;
        if (t < 1.4) q.act('spin', T).emote('fx_shine', T);
        else if (t < 2.6) q.act('bow', T);
        else q.act('sway', T);
        q.at(0, 0, 0);
        fan.at(-0.9, 0, 0.1);
        cup.at(0.9, 0, 0.12);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'C1', look: 'night', title: '十二张表情贴', cast: ['whale'],
    note: '一个人站着不动，头顶把 12 张表情贴一张一张数过去（每张 0.75 秒）。',
    build: (k) => {
      stage(k);
      const w = k.actor('whale');
      const FX = ['fx_heart', 'fx_sweat', 'fx_anger', 'fx_exclaim', 'fx_question', 'fx_zzz', 'fx_sparkle', 'fx_dizzy', 'fx_bulb', 'fx_steam', 'fx_gloom', 'fx_shine'];
      const A = cam([0, 1.62, 3.5], [0, 1.2, 0], 31), B = cam([0, 1.6, 3.0], [0, 1.18, 0], 30);
      return ({ u, T }) => {
        const i = Math.min(FX.length - 1, Math.floor(T / 0.75));
        w.idle(T).set(FX[i] === 'fx_zzz' ? 'whale_blink' : 'whale_idle').emote(FX[i], T).at(0, 0, 0);
        return glide(A, B, u, 0.5);
      };
    },
  },
  {
    id: 'D1', look: 'stage', title: '十五件道具', cast: ['whale'],
    note: '15 件道具在地上排成一排，从左到右一件一件亮出来；机位跟着扫过去。',
    build: (k) => {
      stage(k);
      const w = k.actor('whale');
      const PROPS = ['prop_bowl', 'prop_hourglass', 'prop_teacup', 'prop_book', 'prop_scroll', 'prop_fan', 'prop_abacus', 'prop_eyemask',
        'prop_phone', 'prop_magnifier', 'prop_card', 'prop_basket', 'prop_redshoes', 'prop_catclock', 'prop_brush'];
      const ps = PROPS.map((key) => k.thing(key, 1.15));
      const A = cam([-3.9, 1.15, 6.0], [-3.0, 0.42, 0.6], 36), B = cam([3.9, 1.12, 6.0], [3.0, 0.42, 0.6], 36);
      return ({ u, T }) => {
        ps.forEach((p, i) => {
          const on = T >= i * 0.5;
          if (on) p.at(-5.6 + i * 0.8, 0, 1.1); else p.hide();
        });
        w.idle(T).at(0.2, 0, -3.4).alpha(1);
        return glide(A, B, u, 0.35);
      };
    },
  },
  {
    id: 'E1', look: 'stage', title: '收', cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    note: '回到八个人一起待机，机位后拉，渐黑收尾。',
    build: (k) => {
      stage(k);
      const ids = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'] as const;
      const cast = ids.map((id) => k.actor(id));
      const A = cam([0, 1.85, 9.2], [0, 1.1, 0], 38), B = cam([0, 3.2, 15], [0, 1.3, 0], 42);
      return ({ u, T }) => {
        cast.forEach((a, i) => {
          a.idle(T).at((i - 3.5) * 1.72, 0, Math.abs(i - 3.5) * -0.28);
          if (i === 1) a.lift(0.06);
        });
        return glide(A, B, u, 0.45);
      };
    },
  },
];
