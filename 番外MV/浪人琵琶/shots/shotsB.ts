// 镜头表（下）：副歌二 C21–C27（另一边：千问发现花伞）· 间奏 N1–N3 · 预副歌二 C28–C34（回头）· 副歌三 C35–C41（回家）
// 句序号从 0 数：L20–L26 副歌二 · L27–L33 预副歌二 · L34–L40 副歌三
import { cam, glide, track, type ShotDef } from '@tpl/core';
import { ball, box, ease, easeOut, hash, lerp, seg, setOp, sprite } from '@tpl/kit';
import { door, rain, room } from '@tpl/props';
import {
  PI, beatSq, cake, courtyard, dropPetals, flowerUmbrella, lampLevel, many, notes, pipa, playNotes, puddles, puffSteam, steam, street,
  tavernRoom, teaTray, tipsy, winePot, bridgeTop,
} from './common';
import { COURT } from './shotsA';

const { QX, WX, TZ, SEAT_Z } = COURT;

/** 千问屋里的门厅：木地板、门、一盏灯，门外下着雨 */
function hallway(k: Parameters<ShotDef['build']>[0]) {
  k.add(room({ w: 9, d: 7, h: 4.2, wall: 0xf3e9d8, floor: 0xb08a5e, trim: 0x6b4a32, rug: 0xc9a27a }));
  const dr = door(1.5, 2.6, 0x7a5236); k.add(dr.g, 0, 0, 3.4); dr.g.rotation.y = PI; // 门朝观众方向开在前墙……改成开在左侧更好看：放在 x = -4.5 的侧墙
  dr.g.position.set(-4.4, 0, 0.6); dr.g.rotation.y = PI / 2;
  const rn = rain(90, 4, 6, 5); k.add(rn.g, -6.2, 0, 0.6);
  k.add(box(1.4, 0.9, 0.6, 0x8a5a3c), 2.6, 0, -2.8); k.add(box(1.0, 0.06, 0.5, 0xfff3d6, 0), 2.6, 0.9, -2.8); // 案几
  const lamp = k.add(sprite('glow', 2.6, 0xffd9a0, true, 0.55), 0.4, 2.9, -1.2);
  return { door: dr, rain: rn, lamp };
}

export const SHOTS_B: ShotDef[] = [
  {
    id: 'C21', look: 'cozy', title: '小生的花伞还落在你家', cast: ['qwen'],
    note: '同一夜，千问家里。她端着茶盘穿过门厅去关门，门外雨声哗哗——门边靠着那把花伞。她停住、歪头：原来伞忘在这儿了。',
    build: (k) => {
      const h = hallway(k);
      const um = flowerUmbrella(); k.add(um.g, -3.6, 0.04, 1.5); um.g.rotation.z = -0.3; um.set(0.1);
      const qwen = k.actor('qwen');
      const tray = k.add(teaTrayAt());
      const A = cam([1.5, 1.6, 6.8], [-1.5, 1.1, 0.4], 38), B = cam([-0.8, 1.3, 4.2], [-3.2, 1.0, 1.0], 34);
      return ({ u, T, t, bt }) => {
        h.rain.set(T); h.door.set(0.75);
        const walk = seg(u, 0, 0.55);
        const qx = lerp(2.0, -2.2, walk);
        if (walk < 1) qwen.walkBy(4.2 * walk).at(qx, 0, 1.2).flip(true); else qwen.act('tilt', T, T - t + 1.9).at(qx, 0, 1.2).flip(true).sq(beatSq(bt, 0.03)).emote(u > 0.8 ? 'fx_exclaim' : null, T);
        tray.position.set(qx - 0.5, 1.05, 1.35);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C22', look: 'cozy', title: '你美眷如花 我浪迹天涯', cast: ['qwen'],
    note: '她放下茶盘，把伞拿起来，在屋里撑开——伞面上的花一朵朵亮出来，几片花瓣从伞骨上飘下。她在伞下慢慢转了一圈。镜头绕着她转。',
    build: (k) => {
      const h = hallway(k);
      const um = flowerUmbrella(); k.add(um.g); const tray = k.add(teaTrayAt(), 2.6, 0.96, -2.8);
      const qwen = k.actor('qwen');
      const petals = many(8, (i) => k.add(sprite('petal', 0.2, i % 2 ? 0xffffff : 0xf4a7c0)));
      // 机位只能在门前这一侧绕：原来的收尾把镜头推到了左墙里（最后半秒是一块墙板，qa 报 frozen）
      const C0 = cam([-0.5, 1.45, 5.4], [-2.0, 1.3, 1.0], 36), C1 = cam([-2.8, 1.6, 5.6], [-2.0, 1.3, 1.0], 36), C2 = cam([-4.2, 1.5, 4.4], [-2.0, 1.3, 1.0], 36);
      return ({ u, T, t, bt }) => {
        h.rain.set(T); h.door.set(0.75);
        void tray;
        const lift = ease(seg(u, 0.05, 0.3)), open = ease(seg(u, 0.3, 0.55)), spin = seg(u, 0.55, 0.9);
        // 转完那一圈就回到 idle：'spin' 是单次动作，停在末帧会让最后半秒整段冻住（qa 会报 frozen）
        qwen.act(u > 0.5 && u < 0.93 ? 'spin' : 'idle', T, T - t + 1.55).at(-2.0, 0, 1.0).flip(true).sq(beatSq(bt, 0.03));
        um.g.position.set(lerp(-3.6, -1.5, lift), lerp(0.04, 0.9, lift), lerp(1.5, 1.3, lift)); um.g.rotation.z = lerp(-0.3, 0.08, lift) + Math.sin(T * 1.5) * 0.03; um.set(0.1 + 0.9 * open);
        petals.forEach((p, i) => { const ph = (spin * 1.3 + T * 0.12 + i / 8) % 1; p.position.set(-1.5 + Math.cos(i * 0.8 + T) * 1.0, lerp(2.3, 0.1, easeOut(ph)), 1.3 + Math.sin(i * 0.8 + T) * 1.0); p.material.rotation = ph * 5 + i; setOp(p, spin > 0 ? Math.min(1, (1 - ph) * 2) : 0); });
        return track([[0, C0], [0.55, C1], [1, C2]], u);
      };
    },
  },
  {
    id: 'C23', look: 'golden', title: '为我泡杯花茶 和你有些不搭', cast: ['qwen', 'whale', 'gemini'], fx: { whiteIn: true },
    note: '闪白进回忆——这回从千问这边看：对面的本鲸坐得老远，抱着饭盆不敢动；千问把茶盏往她那边推了推。那只饭盆和这只茶盏，的确不搭。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const st = steam(k, 3);
      const A = cam([-2.9, 1.5, 3.6], [1.0, 1.0, 1.5], 36), B = cam([-2.2, 1.4, 4.4], [0.6, 1.0, 1.4], 34);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        qwen.act('nod', T, T - t + 0.3).at(QX, 0, SEAT_Z).sq(beatSq(bt));
        whale.idle(T).flip().at(WX + 0.5, 0, SEAT_Z + 0.2).sq(beatSq(bt, 0.04)).emote(u > 0.5 ? 'fx_sweat' : null, T);
        const push = ease(seg(u, 0.15, 0.55));
        cup.at(lerp(-0.6, 0.6, push), c.tableTop, TZ + 0.25); puffSteam(st, T, lerp(-0.6, 0.6, push), c.tableTop + 0.25, TZ + 0.25, 1, 0.6);
        bowl.at(WX + 0.1, 0.55, SEAT_Z + 0.55).size(1.3);
        gem.act('lookaround', T).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C24', look: 'golden', title: '气氛开始有一点尴尬', cast: ['qwen', 'whale', 'gemini'],
    note: '桌上只有一块点心。两个人同时伸手、又同时缩回来，各自冒汗；墙头的 Gemini 猫娘歪头捂脸。俯一点的机位，点心在画面正中。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const ck = k.add(cake(), 0.05, c.tableTop, TZ + 0.35);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const A = cam([0, 2.6, 5.6], [0, 0.9, 1.0], 34), B = cam([0, 2.3, 5.0], [0, 0.9, 1.0], 33);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        const reach = Math.sin(seg(u, 0.15, 0.55) * PI);
        qwen.act(u > 0.55 ? 'shake' : 'idle', T, T - t + 1.55).at(QX + reach * 0.5, 0, SEAT_Z).sq(beatSq(bt, 0.03)).emote(u > 0.55 ? 'fx_sweat' : null, T);
        whale.act(u > 0.55 ? 'surprise' : 'idle', T, T - t + 1.5).flip().at(WX - reach * 0.5, 0, SEAT_Z).sq(beatSq(bt, 0.03)).emote(u > 0.55 ? 'fx_sweat' : null, T);
        ck.position.y = c.tableTop + reach * 0.03;
        cup.at(-0.7, c.tableTop, TZ + 0.3); bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35);
        gem.act('tilt', T, T - t + 1.6).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C25', look: 'golden', title: '你腼腆一笑 竟如此融洽', cast: ['qwen', 'whale', 'gemini'],
    note: '千问把点心推到本鲸面前，用扇子挡着脸腼腆一躬；本鲸干饭的老本行上线——抱着饭盆开吃，吃完原地一蹦。蝴蝶回来了。暖色双人镜头。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const ck = k.add(cake(), 0.05, c.tableTop, TZ + 0.35);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl'), fan = k.thing('prop_fan');
      const bf = many(4, () => k.add(sprite('butterfly', 0.34, 0xfff0a0)));
      const A = cam([0.6, 1.5, 6.4], [0, 1.0, 1.0], 36), B = cam([1.2, 1.4, 5.6], [0.3, 1.0, 1.0], 34);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        const push = ease(seg(u, 0.05, 0.3));
        ck.position.set(lerp(0.05, 0.9, push), c.tableTop, TZ + 0.35);
        qwen.act('bow', T, T - t + 0.9).at(QX, 0, SEAT_Z).emote(u > 0.4 ? 'fx_sparkle' : null, T);
        fan.at(QX + 0.3, lerp(1.05, 1.35, ease(seg(u, 0.3, 0.5))), SEAT_Z + 0.2);
        whale.act(u > 0.82 ? 'hop' : u > 0.4 ? 'eat' : 'idle', T, T - t + (u > 0.82 ? 2.6 : 1.3)).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.04));
        cup.at(-0.6, c.tableTop, TZ + 0.3); bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35);
        bf.forEach((s, i) => { const ph = seg(u, 0.35 + i * 0.06, 1); s.position.set(0.3 + Math.sin(T * 2 + i * 1.3) * (0.8 + ph), 1.3 + ph * 1.4 + Math.sin(T * 3 + i) * 0.2, TZ + 0.5 + Math.cos(T * 1.5 + i) * 0.5); s.scale.x = 0.34 * (0.3 + 0.7 * Math.abs(Math.sin(T * 13 + i))); setOp(s, ph); });
        gem.act('hop', T, T - t + 2.2).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C26', look: 'rainEve', title: '我情不自禁会为你牵挂', cast: ['qwen'], fx: { whiteIn: true },
    note: '闪白回到雨夜。千问撑着花伞站在自家门口，看着门外的雨，犹豫地摇了摇头又点了点头。从院外的雨里看她：一扇亮着的门，一把花伞。',
    build: (k) => {
      const c = courtyard(k);
      const rn = rain(150, 14, 10, 7); k.add(rn.g, -2, 0, -2);
      puddles(k, 5, -2, -0.5);
      const um = flowerUmbrella(); k.add(um.g, -4.0, 0.9, -1.4);
      const dr = door(1.4, 2.5, 0x7a5236); k.add(dr.g, -4.2, 0, -1.9);
      const qwen = k.actor('qwen');
      const A = cam([-1.5, 1.4, 5.5], [-4.0, 1.2, -1.6], 36), B = cam([-2.6, 1.3, 3.6], [-4.0, 1.2, -1.6], 34);
      return ({ u, T, t, bt }) => {
        rn.set(T); dr.set(0.85); setOp(c.lampGlow, 1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0);
        qwen.act(u > 0.6 ? 'nod' : u > 0.25 ? 'shake' : 'idle', T, T - t + (u > 0.6 ? 2.2 : 0.9)).at(-4.0, 0, -1.4).sq(beatSq(bt, 0.03));
        um.g.rotation.z = 0.1 + Math.sin(T * 1.4) * 0.04;
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C27', look: 'rainEve', title: '什么时代 早已经不想回家', cast: ['qwen', 'whale'],
    note: '千问撑着伞走出院门，沿着石板路往镇上去。镜头跟着摇升：同一条路的另一头，远远的街灯下有个小小的身影——本鲸，淋着雨。一条路，两个人，还隔着整座镇子。',
    build: (k) => {
      const c = courtyard(k);
      const rn = rain(170, 22, 16, 8); k.add(rn.g, 4, 0, -6);
      many(14, (i) => k.add(box(1.2, 0.04, 0.8, 0xa9a39a, 0.02), 6.5 + i * 1.6, 0, -6.5 - i * 1.3));
      const lampPost = k.add(box(0.12, 3.0, 0.12, 0x3a3340), 30, 0, -26); k.add(sprite('glow', 3.0, 0xffd9a0, true, 0.6), 30, 3.1, -26);
      const um = flowerUmbrella(); k.add(um.g);
      const qwen = k.actor('qwen'), whale = k.actor('whale');
      const A = cam([5.5, 1.5, -2.5], [3.6, 1.1, -6.5], 38), B = cam([9.0, 7.0, 1.0], [20, 1.5, -20], 44);
      return ({ u, T, bt }) => {
        rn.set(T); setOp(c.lampGlow, 1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0);
        const w = seg(u, 0.08, 1);
        const qx = lerp(2.6, 13.5, w), qz = lerp(-4.0, -12.0, w);
        qwen.walkBy(13 * w).at(qx, 0, qz).flip(false).sq(beatSq(bt, 0.02));
        um.g.position.set(qx + 0.25, 0.95, qz + 0.05); um.g.rotation.z = -0.12 + Math.sin(T * 2.2) * 0.03;
        whale.act('shiver', T).at(30, 0, -25).size(1).alpha(seg(u, 0.5, 0.8));
        void lampPost;
        return track([[0, A], [0.35, A], [1, B]], u);
      };
    },
  },

  // ---------------- 间奏：琵琶 solo，镇上的小日子 ----------------
  {
    id: 'N1', look: 'rainEve', title: '间奏：桥上的琵琶', cast: ['kimi'],
    note: '琵琶独奏。雨中的整座镇子：桥、河、酒馆、醉花楼的红灯笼。Kimi 还在桥心灯下弹，音符飘过河面，那个断音照旧掉进水里。镜头贴着河面慢慢升起。',
    build: (k) => {
      const s = street(k);
      const rn = rain(200, 36, 30, 10); k.add(rn.g, 0, 0, -8);
      const pp = pipa(); pp.g.scale.setScalar(0.8); k.add(pp.g, -0.52, s.P.bridge[1] - 0.05, -15.72); pp.g.rotation.z = 0.5; pp.g.rotation.y = 0.7;
      const ns = notes(k, 8);
      const kimi = k.actor('kimi');
      const A = cam([2.0, 4.6, -9.5], [0.0, 3.4, -16.0], 44), B = cam([-3.0, 8.0, 0.5], [0.5, 2.6, -15.0], 40);
      return ({ u, T, bt }) => {
        rn.set(T);
        s.redLanterns.forEach((l, i) => lampLevel(l, 0.5 + 0.3 * ((bt.idx + i) % 2)));
        kimi.act('think', T).at(0, s.P.bridge[1], -16).sq(beatSq(bt, 0.04));
        pp.g.rotation.z = 0.5 + Math.sin(T * 6) * 0.03;
        playNotes(ns, T, 0.8, s.P.bridge[1] + 1.2, -15.6, 1);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'N2', look: 'cozy', title: '间奏：酒馆里漏雨', cast: ['zai', 'gpt', 'claude'],
    note: '酒馆里：屋顶漏下一滴雨，正好砸在狐狸的算盘上，她竖着耳朵惊醒；龙娘飘过来在漏雨处摆了只碗；角落的小克头也不抬翻了一页。镇上的日子照常过。',
    build: (k) => {
      const r = tavernRoom(k);
      const bowl = k.add(ball(0.22, 0x3d7fd9, false, 0.03)); bowl.scale.y = 0.45;
      const drop = k.add(sprite('drop', 0.2, 0xcfe6ff));
      const zai = k.actor('zai'), gpt = k.actor('gpt'), claude = k.actor('claude');
      const abacus = k.thing('prop_abacus'), book = k.thing('prop_book'), tea = k.thing('prop_teacup');
      const A = cam([-2.6, 1.6, 4.2], [-3.0, 1.1, -2.2], 38), B = cam([-1.2, 1.5, 4.8], [-2.6, 1.1, -1.6], 36);
      return ({ u, T, t, bt }) => {
        r.lamps.forEach((l) => lampLevel(l, 1));
        const ph = (T * 1.1) % 1;
        drop.position.set(-2.5, lerp(4.2, 1.2, ph), -2.9); setOp(drop, ph < 0.9 ? 1 : 0);
        zai.act(u > 0.25 ? 'alert' : 'doze', T, T - t + 1.1).at(-3.2, 0, -2.6).size(0.95).emote(u > 0.25 ? 'fx_exclaim' : 'fx_zzz', T);
        abacus.at(-2.5, 1.05, -2.9);
        const come = ease(seg(u, 0.35, 0.7));
        gpt.act('hover', T).at(lerp(-0.2, -2.3, come), 0.25, lerp(-0.8, -1.9, come)).flip(true);
        bowl.position.set(-2.5, come >= 1 ? 1.05 : 1.0 + come * 0, come >= 1 ? -2.6 : -1.6 + come * -0.3); bowl.visible = come > 0.2;
        claude.act('read', T).at(-2.6, 0, -0.6).size(0.95).sq(beatSq(bt, 0.02)); book.at(-2.2, r.tableTop, -0.95); tea.at(-3.0, r.tableTop, -1.0);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'N3', look: 'rainEve', title: '间奏：屋檐下', cast: ['doubao', 'whale'],
    note: '醉花楼门口，豆包把门掩上避雨，灯笼在风里晃。镜头顺着街沿摇过去，找到缩在一家关了门的铺子屋檐下的本鲸——湿透了，酒也醒了一半。',
    build: (k) => {
      const s = street(k);
      const rn = rain(170, 26, 10, 8); k.add(rn.g, 8, 0, 1);
      puddles(k, 8, 9, 1.0);
      k.add(box(3.6, 2.6, 2.2, 0x4a4656), 14, 0, -1.6); k.add(box(4.6, 0.16, 2.0, 0x2f2b3a), 14, 2.6, -0.6);
      const doubao = k.actor('doubao'), whale = k.actor('whale');
      const A = cam([4.5, 1.7, 6.0], [7.0, 1.4, -1.0], 38), B = cam([11.5, 1.5, 4.6], [14.0, 1.0, -0.6], 34);
      return ({ u, T, bt }) => {
        rn.set(T);
        s.redDoor.set(1 - ease(seg(u, 0.1, 0.4)));
        s.redLanterns.forEach((l, i) => { lampLevel(l, 0.7); l.rotation.z = Math.sin(T * 3 + i) * 0.12; });
        doubao.act('tilt', T).at(s.P.red[0] - 1.2, 0, s.P.red[2] + 0.3).alpha(1 - seg(u, 0.3, 0.45));
        whale.act('shiver', T).at(14, 0, 0.2).sq(beatSq(bt, 0.02)).emote(u > 0.6 ? 'fx_gloom' : null, T);
        return glide(A, B, u);
      };
    },
  },

  // ---------------- 预副歌二：回头 ----------------
  {
    id: 'C28', look: 'rainEve', title: '东奔西走 微醺不宜骑马', cast: ['whale'],
    note: '雨小了。本鲸又走回酒馆门前那匹马旁边——这回不爬了，拍拍马脖子，马甩甩头，她自己笑了一下。酒醒了，路也认得了。侧面跟拍。',
    build: (k) => {
      const s = street(k);
      const rn = rain(110, 16, 8, 7); k.add(rn.g, -3, 0, 0.5);
      puddles(k, 6, -3, 1.0);
      const whale = k.actor('whale');
      const A = cam([-1.0, 1.5, 5.6], [-3.0, 1.1, -1.2], 38), B = cam([-4.0, 1.4, 5.2], [-3.8, 1.1, -1.4], 36);
      return ({ u, T, t, bt }) => {
        rn.set(T); s.tavernLanterns.forEach((l) => lampLevel(l, 1));
        const hx = s.P.horse[0];
        const walk = seg(u, 0, 0.4), pat = seg(u, 0.45, 0.75);
        if (walk < 1) whale.walkBy(4 * walk).at(lerp(hx + 5, hx + 1.3, walk), 0, -0.8).flip(true).tilt(tipsy(T, 0.03));
        else whale.act(u > 0.8 ? 'hop' : pat > 0 ? 'point' : 'idle', T, T - t + (u > 0.8 ? 2.5 : 1.4)).at(hx + 1.3, 0, -0.8).flip(true).sq(beatSq(bt, 0.03));
        s.horse.head.rotation.z = Math.sin(T * 2) * 0.06 + (pat > 0 && pat < 1 ? Math.sin(pat * PI * 3) * 0.25 : 0);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C29', look: 'rainEve', title: '听着浪人 弹着断了弦的琵琶', cast: ['kimi', 'whale'],
    note: '桥上。Kimi 停下来，把那根断弦一点点接回去——她最擅长把漏掉的那一句找回来。弦接好，掉下去的那个音终于飘了上来。本鲸站在她旁边看着，点了点头。',
    build: (k) => {
      const s = street(k);
      const rn = rain(120, 20, 12, 8); k.add(rn.g, 0, 0, -14);
      const pp = pipa(); pp.g.scale.setScalar(0.8); k.add(pp.g, -0.52, s.P.bridge[1] - 0.05, -15.72); pp.g.rotation.z = 0.5; pp.g.rotation.y = 0.7;
      const ns = notes(k, 8);
      const kimi = k.actor('kimi'), whale = k.actor('whale');
      const A = cam([9.2, 5.5, -16.1], [-0.4, 4.2, -16.0], 32), B = cam([5.8, 5.15, -16.0], [-0.3, 4.2, -16.05], 28);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        const mend = ease(seg(u, 0.15, 0.6));
        pp.set(mend);
        kimi.act(mend >= 1 ? 'nod' : 'think', T, T - t + 2.0).at(0, s.P.bridge[1], -16).sq(beatSq(bt, 0.03));
        playNotes(ns, T, 0.8, s.P.bridge[1] + 1.2, -15.6, mend >= 1 ? 1 : 0.3, mend);
        whale.act(u > 0.7 ? 'nod' : 'idle', T, T - t + 2.3).at(-2.4, bridgeTop(-2.4), -16).flip(false).sq(beatSq(bt, 0.03));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C30', look: 'rainEve', title: '路过青楼酒馆', cast: ['whale', 'doubao'],
    note: '醉花楼门关着，灯笼只剩一盏亮。本鲸又一次从门前走过，这次连头都没偏；门缝里豆包探出半张脸，吃了一惊。横移跟拍。',
    build: (k) => {
      const s = street(k);
      const rn = rain(120, 20, 8, 7); k.add(rn.g, 7, 0, 0.5);
      puddles(k, 6, 7, 1.0);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const A = cam([2.5, 1.6, 6.5], [5.0, 1.5, -1.5], 40), B = cam([7.0, 1.6, 6.5], [8.6, 1.5, -1.5], 40);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        s.redDoor.set(0.18 + 0.1 * seg(u, 0.5, 0.7));
        s.redLanterns.forEach((l, i) => lampLevel(l, i === 3 ? 1 : 0.12));
        whale.walkBy(7 * u).at(lerp(1.5, 8.5, u), 0, 1.4).flip(false).sq(beatSq(bt, 0.02));
        doubao.act(u > 0.5 ? 'surprise' : 'idle', T, T - t + 1.2).at(s.P.red[0] - 0.55, 0, s.P.red[2] - 0.6).alpha(seg(u, 0.4, 0.6));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C31', look: 'rainEve', title: '官人进来坐坐 好吗', cast: ['doubao', 'whale'],
    note: '豆包推开门，还是那句招呼、还是那个欠身——但这次是好心让她进来躲雨。本鲸笑着摇头，抬手指了指前面的路：她知道该去哪了。豆包点点头。',
    build: (k) => {
      const s = street(k);
      const rn = rain(120, 20, 8, 7); k.add(rn.g, 8, 0, 0.5);
      puddles(k, 6, 8, 1.0);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const A = cam([6.4, 1.5, 4.8], [8.2, 1.1, 0.2], 36), B = cam([7.0, 1.4, 4.2], [8.6, 1.1, 0.3], 34);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        s.redDoor.set(0.3 + 0.7 * ease(seg(u, 0, 0.25)));
        s.redLanterns.forEach((l, i) => lampLevel(l, i === 3 ? 1 : 0.12 + 0.5 * seg(u, 0.1, 0.4)));
        doubao.act(u > 0.75 ? 'nod' : 'bow', T, T - t + (u > 0.75 ? 1.4 : 0.3)).at(s.P.red[0] - 1.0, 0, s.P.red[2] + 0.6).sq(beatSq(bt, 0.03));
        whale.act(u > 0.5 ? 'point' : 'shake', T, T - t + (u > 0.5 ? 0.95 : 0.2)).at(9.4, 0, 1.2).flip(u < 0.5).sq(beatSq(bt, 0.03));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C32', look: 'rainEve', title: '我的思念似六月里的小雨哗哗', cast: ['whale', 'qwen'],
    note: '出镇的路。本鲸从左往右，沿着石板路往山坡上的灯走；路的另一头，一点粉色从雨里冒出来——千问撑着那把花伞迎面走来。两个人还没看见对方。高机位大全景。',
    build: (k) => {
      const s = street(k);
      const rn = rain(220, 40, 24, 10); k.add(rn.g, 18, 0, -10);
      many(16, (i) => k.add(box(1.2, 0.04, 0.8, 0xa9a39a, 0.02), 12 + i * 1.5, 0, -2 - i * 1.1));
      k.add(box(0.12, 3.0, 0.12, 0x3a3340), 20, 0, -8); k.add(sprite('glow', 3.0, 0xffd9a0, true, 0.6), 20, 3.1, -8);
      const um = flowerUmbrella(); k.add(um.g);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const A = cam([8.5, 1.8, 2.0], [18, 1.2, -6.5], 46), B = cam([12.0, 2.2, -1.0], [22, 1.2, -8.5], 44);
      return ({ u, T, bt }) => {
        rn.set(T); s.redLanterns.forEach((l) => lampLevel(l, 0.4));
        const wx = lerp(11, 20, u), wz = lerp(-1.5, -8.0, u);
        whale.walkBy(11 * u).at(wx, 0, wz).flip(false).sq(beatSq(bt, 0.02));
        const qx = lerp(34, 27, u), qz = lerp(-18, -13, u);
        qwen.walkBy(8.5 * u).at(qx, 0, qz).flip(true).alpha(seg(u, 0.25, 0.5));
        um.g.position.set(qx - 0.25, 0.95, qz + 0.05); um.g.rotation.z = 0.12; um.set(1);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C33', look: 'rainEve', title: '对你情有所钟', cast: ['whale', 'qwen'],
    note: '看见了。两个人同时停住：本鲸吃了一惊，千问把伞往后抬了抬看清是谁。中间隔着六步雨。两人各在画面一边，谁都没先动。',
    build: (k) => {
      const s = street(k);
      const rn = rain(160, 20, 10, 8); k.add(rn.g, 24, 0, -10);
      puddles(k, 5, 24, -9.5);
      many(8, (i) => k.add(box(1.2, 0.04, 0.8, 0xa9a39a, 0.02), 19 + i * 1.5, 0, -7 - i * 0.6));
      const um = flowerUmbrella(); k.add(um.g, 25.6 - 0.25, 0.95, -10);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const A = cam([24, 1.75, -4.2], [24.0, 1.15, -10], 40), B = cam([24, 1.6, -5.0], [24.0, 1.15, -10], 38);
      return ({ u, T, t, bt }) => {
        rn.set(T); void s;
        whale.act(u > 0.1 ? 'surprise' : 'idle', T, T - t + 0.3).at(22.4, 0, -10).flip(false).sq(beatSq(bt, 0.02)).emote(u > 0.5 ? 'fx_exclaim' : null, T);
        qwen.act(u > 0.2 ? 'tilt' : 'idle', T, T - t + 0.6).at(25.6, 0, -10).flip(true).sq(beatSq(bt, 0.02));
        um.g.rotation.z = lerp(0.12, 0.42, ease(seg(u, 0.2, 0.5)));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C34', look: 'rainEve', title: '为你两袖清风', cast: ['whale', 'qwen'],
    note: '本鲸一路小跑过去，在伞前站定，又抖了抖两只袖子——还是什么都没有，只有雨水。千问笑出声来，往前一步，把伞举过两个人头顶。推近。',
    build: (k) => {
      const s = street(k);
      const rn = rain(160, 20, 10, 8); k.add(rn.g, 24, 0, -10);
      puddles(k, 5, 24, -9.5);
      const um = flowerUmbrella(); k.add(um.g);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const puffs = many(2, () => k.add(sprite('ring', 0.5, 0xdfe8ff, false, 0.6)));
      const A = cam([24, 1.6, -4.0], [24.5, 1.2, -10], 38), B = cam([25.2, 1.4, -6.6], [25.6, 1.2, -10], 32);
      return ({ u, T, t, bt }) => {
        rn.set(T); void s;
        const run = seg(u, 0, 0.35), sh = seg(u, 0.4, 0.7), step = ease(seg(u, 0.72, 1));
        const wx = lerp(21, 25.2, run);
        if (run < 1) whale.walkBy(4.2 * run * 1.4).at(wx, 0, -10).lift(Math.abs(Math.sin(run * 14)) * 0.12).flip(false);
        else whale.act(sh > 0 && sh < 1 ? 'shake' : 'idle', T, T - t + 1.0).at(wx, 0, -10).flip(false).sq(beatSq(bt, 0.03));
        const qx = lerp(27, 26.4, step);
        qwen.act(step > 0 ? 'hop' : 'idle', T, T - t + 1.8).at(qx, 0, -10).flip(true).sq(beatSq(bt, 0.03));
        um.g.position.set(lerp(qx - 0.25, 25.9, step), 0.95, -9.95); um.g.rotation.z = lerp(0.3, 0, step);
        puffs.forEach((p, i) => { const ph = (sh * 2 + i * 0.5) % 1; p.position.set(wx + (i ? 1 : -1) * (0.7 + ph * 1.2), 1.0 - ph * 0.3, -9.8); p.scale.setScalar(0.3 + ph * 0.9); setOp(p, sh > 0 && sh < 1 ? 0.6 * (1 - ph) : 0); });
        return glide(A, B, u);
      };
    },
  },

  // ---------------- 副歌三：回家 ----------------
  {
    id: 'C35', look: 'rainEve', title: '小生的花伞还落在你家', cast: ['whale', 'qwen'],
    note: '伞下两个人。镜头从伞顶正上方俯拍，雨点在伞面上弹开，然后慢慢降到两人的高度。「伞还落在你家」——这回它落在了两个人头上。',
    build: (k) => {
      const s = street(k);
      const rn = rain(160, 20, 10, 8); k.add(rn.g, 26, 0, -10);
      puddles(k, 5, 26, -9.5);
      const um = flowerUmbrella(); k.add(um.g, 25.9, 0.95, -9.95);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const bounce = many(10, () => k.add(sprite('drop', 0.14, 0xdfe8ff)));
      const A = cam([25.9, 6.5, -9.0], [25.9, 1.0, -10.0], 40), B = cam([25.9, 1.5, -5.2], [25.9, 1.2, -10], 36);
      return ({ u, T, bt }) => {
        rn.set(T); void s;
        whale.idle(T).at(25.2, 0, -10).flip(false).sq(beatSq(bt, 0.03));
        qwen.idle(T).at(26.6, 0, -10).flip(true).sq(beatSq(bt, 0.03));
        bounce.forEach((d, i) => { const ph = (T * 2.4 + i / 10) % 1; const a = hash(i) * PI * 2; d.position.set(25.9 + Math.cos(a) * (0.5 + ph * 0.8), 2.45 + Math.sin(ph * PI) * 0.4 - ph * 0.3, -9.95 + Math.sin(a) * (0.5 + ph * 0.8)); setOp(d, 1 - ph); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C36', look: 'rainEve', title: '你美眷如花 我浪迹天涯', cast: ['whale', 'qwen', 'gemini'],
    note: '两个人并肩往回走，伞在两人中间。前面院墙上，Gemini 猫娘蹲在墙头晃尾巴等她们。从斜前方跟拍，雨声渐小。',
    build: (k) => {
      const c = courtyard(k);
      const rn = rain(130, 20, 14, 8); k.add(rn.g, 6, 0, -6);
      many(14, (i) => k.add(box(1.2, 0.04, 0.8, 0xa9a39a, 0.02), 6.5 + i * 1.6, 0, -6.5 - i * 1.3));
      const um = flowerUmbrella(); k.add(um.g);
      const whale = k.actor('whale'), qwen = k.actor('qwen'), gem = k.actor('gemini', 0.8);
      const A = cam([12, 1.6, -8.5], [16, 1.2, -14], 40), B = cam([6.5, 1.7, -2.0], [8.0, 1.2, -8.0], 38);
      return ({ u, T, bt }) => {
        rn.set(T); setOp(c.lampGlow, 1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0);
        const w = u;
        const cx = lerp(16.5, 8.0, w), cz = lerp(-14.5, -7.8, w);
        whale.walkBy(10.8 * w).at(cx - 0.65, 0, cz + 0.1).flip(true).sq(beatSq(bt, 0.02));
        qwen.walkBy(10.8 * w).at(cx + 0.65, 0, cz - 0.1).flip(true).sq(beatSq(bt, 0.02));
        um.g.position.set(cx, 0.95, cz); um.g.rotation.z = Math.sin(T * 2.2) * 0.04;
        gem.act('sway', T).at(-0.2, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C37', look: 'cozy', title: '为我泡杯花茶 和你有些不搭', cast: ['qwen', 'whale', 'gemini'],
    note: '回到小院，灯笼亮着。千问又泡了一盏花茶；本鲸把饭盆往桌上一放，干脆把花茶倒进饭盆里喝——还是不搭，但这次两个人都笑了。和 C03 同一个机位，首尾呼应。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const st = steam(k, 3), st2 = steam(k, 3);
      const A = cam([0.4, 1.5, 7.6], [0, 1.0, 0.8], 36), B = cam([0.2, 1.35, 6.4], [0.1, 0.95, 0.9], 34);
      return ({ u, T, t, bt }) => {
        setOp(c.lampGlow, 1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0.4);
        qwen.act(u > 0.7 ? 'hop' : 'nod', T, T - t + (u > 0.7 ? 2.15 : 0.3)).at(QX, 0, SEAT_Z).sq(beatSq(bt, 0.03));
        const push = ease(seg(u, 0.1, 0.4)), pour = ease(seg(u, 0.45, 0.65));
        cup.at(lerp(-0.6, 0.6, push) + pour * 0.3, c.tableTop + pour * 0.35, TZ + 0.25);
        puffSteam(st, T, lerp(-0.6, 0.6, push), c.tableTop + 0.25, TZ + 0.25, 1 - pour, 0.6);
        bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35); puffSteam(st2, T, 1.05, c.tableTop + 0.3, TZ + 0.3, pour, 0.7);
        whale.act(u > 0.7 ? 'hop' : u > 0.45 ? 'point' : 'idle', T, T - t + (u > 0.7 ? 2.15 : 1.4)).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.04));
        gem.act('lookaround', T).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C38', look: 'cozy', title: '气氛开始有一点尴尬', cast: ['qwen', 'whale', 'gemini'],
    note: '这回的「尴尬」不一样：Gemini 猫娘从墙头一跃跳到桌上，把点心撞飞，两个人吓了一跳——然后一起笑出来。稍俯的机位，点心飞出去的弧线在画面里。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const ck = k.add(cake());
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const A = cam([0, 2.4, 5.8], [0, 1.0, 0.6], 36), B = cam([0, 2.0, 5.2], [0, 1.0, 0.8], 34);
      return ({ u, T, t, bt }) => {
        setOp(c.lampGlow, 1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0.4);
        const jump = seg(u, 0.1, 0.4), fly = seg(u, 0.35, 0.8);
        const gx = lerp(-1.4, 0.1, jump), gy = lerp(c.wallTop, c.tableTop, jump) + Math.sin(jump * PI) * 1.4, gz = lerp(-5.9, TZ - 0.2, jump);
        gem.act(jump < 1 ? 'hop' : 'tilt', T, T - t + (jump < 1 ? 0.3 : 1.2)).at(gx, gy, gz).size(0.8).noShadow();
        ck.position.set(lerp(0.05, 2.4, fly), c.tableTop + Math.sin(fly * PI) * 1.2 - (fly >= 1 ? c.tableTop : 0), TZ + 0.35 + fly * 1.2); ck.rotation.z = fly * 7;
        qwen.act(u > 0.75 ? 'hop' : u > 0.35 ? 'shake' : 'idle', T, T - t + (u > 0.75 ? 2.0 : 0.95)).at(QX, 0, SEAT_Z).sq(beatSq(bt, 0.03)).emote(u > 0.35 && u < 0.75 ? 'fx_exclaim' : null, T);
        whale.act(u > 0.75 ? 'hop' : u > 0.35 ? 'surprise' : 'idle', T, T - t + (u > 0.75 ? 2.0 : 0.95)).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.03));
        cup.at(-0.6, c.tableTop, TZ + 0.3); bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C39', look: 'afterRain', title: '你腼腆一笑 竟如此融洽', cast: ['qwen', 'whale', 'gemini'],
    note: '天亮了，雨停了。千问把花伞收起来、靠回院门柱边——和第一镜一模一样的位置；她回头腼腆一笑，本鲸在旁边跟着拍子晃。机位也用第一镜的，首尾相扣。',
    build: (k) => {
      const c = courtyard(k);
      puddles(k, 4, 3, -3);
      const um = flowerUmbrella(); k.add(um.g);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const A = cam([1.5, 1.9, 3.8], [2.4, 1.0, -4.2], 38), B = cam([3.0, 1.4, -1.6], [2.5, 1.0, -5.2], 34);
      return ({ u, T, t, bt }) => {
        setOp(c.lampGlow, 0.15); dropPetals(c.petals, T, 0.6, -3, 3.2, 0.8);
        const close = ease(seg(u, 0.05, 0.35)), lean = ease(seg(u, 0.35, 0.6));
        um.set(1 - 0.9 * close);
        um.g.position.set(lerp(2.0, c.umbrellaSpot[0], lean), lerp(0.9, 0.05, lean), lerp(-4.4, c.umbrellaSpot[2], lean)); um.g.rotation.z = lerp(0.05, 0.3, lean);
        qwen.act(u > 0.6 ? 'bow' : 'idle', T, T - t + 1.9).at(1.9, 0, -4.4).flip(u < 0.6).emote(u > 0.8 ? 'fx_sparkle' : null, T);
        whale.act('sway', T).at(3.9, 0, -3.9).flip(true).sq(beatSq(bt, 0.04));
        gem.act('idle', T).at(-0.2, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C40', look: 'afterRain', title: '我情不自禁会为你牵挂', cast: ['qwen', 'whale'],
    note: '清晨的院门口。千问把自己的折扇递给本鲸——伞留在这儿，扇子跟她走。本鲸把扇子举到脸前挡了挡，心跳得明显。两人近景。',
    build: (k) => {
      const c = courtyard(k);
      const um = flowerUmbrella(); k.add(um.g, c.umbrellaSpot[0], 0.05, c.umbrellaSpot[2]); um.g.rotation.z = 0.3; um.set(0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale');
      const fan = k.thing('prop_fan');
      const heart = k.add(sprite('heart', 0.3, 0xff8fb0));
      const A = cam([3.0, 1.6, 2.4], [2.9, 1.15, -4.2], 34), B = cam([3.0, 1.55, 1.4], [2.9, 1.15, -4.2], 30);
      return ({ u, T, t, bt }) => {
        setOp(c.lampGlow, 0.1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0.8);
        const give = ease(seg(u, 0.1, 0.45)), hide = ease(seg(u, 0.5, 0.7));
        qwen.act(u < 0.5 ? 'nod' : 'idle', T, T - t + 0.4).at(1.9, 0, -4.2).flip(false).sq(beatSq(bt, 0.02));
        whale.act(u > 0.75 ? 'nod' : 'idle', T, T - t + 2.7).at(3.9, 0, -4.2).flip(true).sq(beatSq(bt, 0.03));
        fan.at(lerp(2.5, 3.5, give), lerp(1.1, 1.1 + hide * 0.35, 1), -3.9);
        const ph = (T * 1.2) % 1;
        heart.position.set(3.9, 2.1 + ph * 0.5, -3.9); heart.scale.setScalar(0.25 + ph * 0.15); setOp(heart, hide * (1 - ph));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C41', look: 'afterRain', title: '什么时代 早已经不想回家', cast: ['whale', 'qwen', 'gemini', 'kimi', 'gpt', 'doubao', 'zai', 'claude'], fx: { blackOut: true },
    note: '最后一句，镜头从院门口慢慢摇升、后退：花伞靠在门边，两个人小小的站在门口，本鲸朝镜头挥手。镇子在晨光里醒来——Kimi 抱着琵琶过桥，龙娘卸下酒馆门板，豆包在门口扫地，小克捧着书路过，狐狸还在柜台边打盹。歌停在「不想回家」上：她已经在家了。',
    build: (k) => {
      const c = courtyard(k);
      const um = flowerUmbrella(); k.add(um.g, c.umbrellaSpot[0], 0.05, c.umbrellaSpot[2]); um.g.rotation.z = 0.3; um.set(0.1);
      // 远处的小镇一角（简化：桥、两栋房、几盏灭了的灯）
      many(14, (i) => k.add(box(1.2, 0.04, 0.8, 0xc9b79a, 0.02), 6.5 + i * 1.6, 0, -6.5 - i * 1.3));
      k.add(box(9, 0.5, 2.4, 0xd9b48a), 24, 0.6, -24); k.add(box(0.14, 0.9, 0.14, 0x8a5a3c), 20, 1.1, -22.9); k.add(box(0.14, 0.9, 0.14, 0x8a5a3c), 28, 1.1, -22.9);
      k.add(box(5, 3.2, 4, 0xe9d8b8), 16, 0, -20); k.add(box(5, 3.2, 4, 0xb8433c), 32, 0, -21);
      many(5, (i) => k.add(sprite('glow', 0.6, 0xff6b5a, true, 0.2), 30 + i * 0.8, 3.2, -18.8));
      const pp = pipa();
      const whale = k.actor('whale'), qwen = k.actor('qwen'), gem = k.actor('gemini', 0.8), kimi = k.actor('kimi'), gpt = k.actor('gpt'), doubao = k.actor('doubao'), zai = k.actor('zai'), claude = k.actor('claude');
      const book = k.thing('prop_book'), abacus = k.thing('prop_abacus');
      k.add(pp.g); pp.set(1);
      const A = cam([3.8, 1.5, -0.6], [2.9, 1.1, -5.0], 36), B = cam([4.5, 8.5, 6.0], [9.5, 1.2, -11.0], 50);
      return ({ u, T, bt }) => {
        setOp(c.lampGlow, 0.1); dropPetals(c.petals, T, 0.6, -3, 3.2, 0.9);
        whale.set(Math.floor(T * 2) % 2 ? 'whale_wave' : 'whale_idle').at(3.9, 0, -4.2).flip(false).sq(beatSq(bt, 0.03));
        qwen.act('sway', T).at(1.9, 0, -4.2).flip(false).sq(beatSq(bt, 0.03));
        gem.act('idle', T).at(-0.2, c.wallTop, -5.9).size(0.8);
        const kx = lerp(19.5, 28.5, (u * 0.8) % 1);
        kimi.walkBy(9 * ((u * 0.8) % 1)).at(kx, 1.1, -23.2).flip(false); pp.g.position.set(kx - 0.45, 1.25, -22.9); pp.g.rotation.z = 0.4;
        gpt.act('hover', T).at(14.5, 0.3, -17.6).flip(true);
        doubao.act('sway', T).at(30.2, 0, -18.6).flip(true);
        claude.walkBy(6 * u).at(lerp(10, 16, u), 0, -15.5).flip(false); book.at(lerp(10, 16, u) + 0.45, 1.0, -15.3);
        zai.act('doze', T).at(17.8, 0, -17.6).emote('fx_zzz', T); abacus.at(18.4, 0.05, -17.3);
        return track([[0, A], [0.3, A], [1, B]], u);
      };
    },
  },
];

/** 茶盘（放在手里 / 案几上的那只），比院子里的小一号 */
function teaTrayAt() { const g = teaTray(); g.scale.setScalar(0.8); return g; }
void winePot; void easeOut;
