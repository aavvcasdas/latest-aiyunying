import React from 'react';
import { P, Cam, Sprite, Mini, Photo, Heart, Moon, Cloud, Bg, Tag, Star, Envelope, Person, Plane, torn, hill } from './parts';
import { ct } from './Lyrics';
import type { SP } from './scenesA';
import { seg, lerp, eOut, eIn, eIO, rnd, pop, jit, mix, clamp, FONT, bump, back } from './util';

const stars = (n: number, seed: number, o = 1, z = -460, t = 0) =>
  Array.from({ length: n }, (_, i) => (
    <P key={'s' + i} x={(rnd(i, seed) - 0.5) * 1900} y={(rnd(i, seed + 1) - 0.5) * 1000} z={z} w={5} h={5} o={o * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7) ** 2)} style={{ background: i % 4 ? '#fff' : '#ffe27a', borderRadius: '50%' }} />
  ));
const CARD = 'repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 3px, transparent 3px 12px)';

/* ───────────── 15 间奏：纸飞机。一起飞过一段，然后各飞各的 ───────────── */
export function Flight({ t, lt }: SP) {
  const day = '#7fb4e8', dusk = '#f08a6c', night = '#151a45';
  const top = lt < 15 ? mix(day, dusk, seg(lt, 8, 14)) : mix(dusk, night, seg(lt, 17, 23));
  const bot = lt < 15 ? mix('#d6ebfa', '#f9cf9a', seg(lt, 8, 14)) : mix('#f9cf9a', '#3a3577', seg(lt, 17, 23));
  const dive = eIn(seg(lt, 27.3, 29.7));
  const px = -150 + Math.sin(lt * 0.7) * 34 + dive * 260;
  const py = 30 + Math.sin(lt * 1.3) * 20 + dive * 420;
  const near = eIO(seg(lt, 10.5, 15.5));
  const away = eIn(seg(lt, 21.5, 26.5));
  const cx = lerp(1000, 120, near) + Math.sin(lt * 0.9 + 1) * 26 + away * 620;
  const cy = -50 + Math.sin(lt * 1.1 + 2) * 18 - away * 330;
  return (
    <Cam y={dive * 240} z={lerp(-60, 40, seg(lt, 0, 27))} rz={Math.sin(lt * 0.5) * 2 + dive * 8}>
      <Bg kind="sky" style={{ background: `linear-gradient(${top},${bot})` }} />
      {stars(40, 6, seg(lt, 19, 24), -470, t)}
      <P x={250} y={lerp(-190, 260, seg(lt, 4, 19))} z={-440} w={170} h={190} r={8} style={{ background: '#fdf6e3', boxShadow: '3px 5px 0 rgba(0,0,0,.18)' }}>
        <div style={{ position: 'absolute', left: 35, top: 40, width: 100, height: 100, borderRadius: '50%', background: '#f0643c', border: '10px dotted #f59a3d' }} />
      </P>
      <Moon x={380} y={-210} z={-430} size={150} o={seg(lt, 19, 23)} />
      {Array.from({ length: 9 }, (_, i) => {
        const z = -420 + rnd(i, 2) * 380;
        const sp = 60 + (z + 420) * 0.5;
        const x = ((((rnd(i, 1) * 2800 - lt * sp) % 2800) + 2800) % 2800) - 1400;
        return <Cloud key={i} x={x} y={-260 + rnd(i, 3) * 380} z={z} s={0.8 + rnd(i, 4) * 0.7} color={i % 3 === 0 ? '#e3e6ef' : '#fff'} o={0.95} />;
      })}
      {/* 纸板城市 */}
      {Array.from({ length: 16 }, (_, i) => {
        const h = 130 + rnd(i, 7) * 190;
        const x = 1000 + i * 175 - lt * 125;
        if (x < -1100 || x > 1100) return null;
        return (
          <P key={i} x={x} y={430 - h / 2 + dive * 60} z={-300} w={150} h={h} style={{ background: ['#c9995a', '#e9e2d0', '#b4854a'][i % 3], backgroundImage: 'radial-gradient(rgba(60,40,20,.5) 5px, transparent 6px)', backgroundSize: '34px 38px', boxShadow: '3px 0 0 rgba(0,0,0,.15)' }}>
            {i % 3 === 1 && <div style={{ height: 14, background: '#e0483e' }} />}
          </P>
        );
      })}
      <P x={-((lt * 60) % 400)} y={470} z={-200} w={3200} h={300} style={{ background: mix('#8fcf9b', '#2f4a6b', seg(lt, 17, 23)), clipPath: hill(3, 26, 40) }} />
      {/* 纸人拉花：最靠近的那几拍 */}
      {Array.from({ length: 15 }, (_, i) => (
        <Person key={i} x={-630 + i * 90} y={-275 + Math.sin(lt * 2 + i * 0.8) * 8} z={-150} s={1.9 * pop(lt, 13.5 + i * 0.14) * (1 - seg(lt, 22 + i * 0.1, 22.6 + i * 0.1))} color={i % 2 ? '#f59a3d' : '#5aa9e6'} />
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const u = ((lt - 15.5) * 0.45 + i / 7) % 1;
        const on = seg(lt, 15.5, 16) * (1 - seg(lt, 21, 22));
        return <P key={i} x={(px + cx) / 2 + (rnd(i, 1) - 0.5) * 160} y={-20 - u * 190} z={-60} w={30} h={27} s={on * (0.6 + u * 0.8)} o={1 - u}><Heart size={30} color={i % 2 ? '#ef6461' : '#f7a8c8'} /></P>;
      })}
      {/* 小克的纸飞机 */}
      <Plane x={cx} y={cy + 20} z={-110} s={1.25} r={-4 - away * 22} />
      <Sprite who="claude" act={near >= 1 && away <= 0 ? 'hop' : 'idle'} t={t} x={cx - 12} y={cy + 12} z={-105} k={1.9} o={1 - seg(away, 0.7, 1)} />
      {/* 本鲸的纸飞机 */}
      <Plane x={px} y={py + 20} z={-70} s={1.35} r={-3 + Math.sin(lt * 1.3) * 3 + dive * 48} />
      <Sprite who="whale" act={near >= 1 && away <= 0 ? 'wave' : away > 0.2 ? 'sad' : 'idle'} t={away > 0.2 ? lt - 22.5 : t} x={px - 14} y={py + 12} z={-65} k={2} r={dive * 40} />
    </Cam>
  );
}

function FilmStrip({ y, z, r, shift, gray, seed }: { y: number; z: number; r: number; shift: number; gray: number; seed: number }) {
  const bgs = ['linear-gradient(#9fd3f5 62%,#8fd08a 62%)', 'linear-gradient(#ffc38a 30%,#f58a6a 62%,#7d5a8c 62%)', 'linear-gradient(#ffd6e6 62%,#f3a6c4 62%)', 'linear-gradient(#1c2257 64%,#39407e 64%)', 'linear-gradient(#bfe8d0 62%,#e9d79a 62%)'];
  return (
    <P x={shift} y={y} z={z} r={r} w={3520} h={210} style={{ background: '#17161a', boxShadow: '0 6px 0 rgba(0,0,0,.3)', filter: `grayscale(${gray}) sepia(${gray * 0.5})` }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 14, backgroundImage: 'linear-gradient(90deg,#f1ece0 0 16px, transparent 16px)', backgroundSize: '32px 14px' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, height: 14, backgroundImage: 'linear-gradient(90deg,#f1ece0 0 16px, transparent 16px)', backgroundSize: '32px 14px' }} />
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: 14 + i * 220, top: 32, width: 196, height: 146, background: bgs[(i + seed) % 5], overflow: 'hidden' }}>
          <Mini who="whale" k={1.05} x={60 + ((i * 37 + seed * 11) % 30)} y={144} />
          <Mini who="claude" k={1.05} x={132 + ((i * 17) % 20)} y={144} />
          {(i + seed) % 3 === 0 && <div style={{ position: 'absolute', left: 90, top: 14, width: 26, height: 24 }}><Heart size={26} color="#ef6461" /></div>}
        </div>
      ))}
    </P>
  );
}

/* ───────────── 18 第二遍：生命 随年月流去 随白发老去（一卷胶片） ───────────── */
export function Film({ t, lt, L }: SP) {
  const old = seg(t, ct(L + 4, 7), ct(L + 4, 11) + 0.6);
  return (
    <Cam z={lerp(-40, 60, seg(lt, 0, 7))} ry={lerp(-14, 10, eIO(seg(lt, 0, 7)))} rx={4}>
      <Bg kind="kraft" />
      <FilmStrip y={-150} z={-320} r={-7} shift={-300 - lt * 120} gray={old} seed={1} />
      <FilmStrip y={110} z={-120} r={4} shift={-900 + lt * 150} gray={old * 0.9} seed={3} />
      <Sprite who="whale" act="idle" t={t} x={-450} y={335} z={20} k={2.6} filter={`drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff) grayscale(${old * 0.9})`} />
    </Cam>
  );
}

function Home({ x, body, roof }: { x: number; body: string; roof: string }) {
  return (
    <>
      <P x={x} y={110} z={-200} w={210} h={190} style={{ background: body, border: '5px solid #2b2b33' }}>
        <div style={{ position: 'absolute', left: '36%', bottom: 0, width: '28%', height: '50%', background: '#fff', border: '4px solid #2b2b33' }} />
      </P>
      <P x={x} y={-45} z={-196} w={270} h={130} style={{ background: roof, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }} />
    </>
  );
}

/* ───────────── 19 第二遍：随着你离去 快乐渺无音讯（纸杯电话） ───────────── */
export function Phone({ t, lt, L }: SP) {
  const snapAt = ct(L + 5, 3);
  const snap = eOut(seg(t, snapAt, snapAt + 0.5));
  const gone = seg(t, ct(L + 5, 1), ct(L + 5, 4) + 0.4);
  const mails = [5, 7, 8];
  return (
    <Cam z={lerp(-60, 40, seg(lt, 0, 7))} x={lerp(-20, 20, seg(lt, 0, 7))}>
      <Bg kind="kraft" />
      <P z={-380} w={1560} h={900} style={{ backgroundColor: '#f1ece0', backgroundImage: 'linear-gradient(rgba(90,120,170,.25) 2px, transparent 2px)', backgroundSize: '100% 40px', clipPath: torn(31) }} />
      <Home x={-440} body="#5b8fe0" roof="#3a6cc0" />
      <Home x={440} body="#f2a65a" roof="#e0483e" />
      {/* 线，唱到「离」字断开 */}
      <P x={-140} y={-40} z={-150} w={280} h={4} r={snap * 62 + (1 - snap) * 3 + jit(t, 1, 0.5)} origin="0% 50%" style={{ background: '#e0483e' }} />
      <P x={140} y={-40 + (1 - snap) * 14} z={-150} w={280} h={4} r={-snap * 62 + (1 - snap) * 3} origin="100% 50%" style={{ background: '#e0483e' }} />
      <P x={-290} y={-40} z={-148} w={38} h={46} r={-12} style={{ background: '#d8322b', borderRadius: 4 }} />
      <P x={290} y={-26} z={-148} w={38} h={46} r={12} style={{ background: '#d8322b', borderRadius: 4 }} />
      <Sprite who="claude" act="walk" t={t} x={lerp(300, 620, gone)} y={330} z={lerp(-120, -500, gone)} k={2.5} o={1 - seg(gone, 0.6, 1)} />
      <Sprite who="whale" act={t < snapAt ? 'nod' : t < snapAt + 0.8 ? 'surprise' : 'sad'} t={t < snapAt ? (t % 1.2) : t < snapAt + 0.8 ? t - snapAt : t - snapAt - 0.8} x={-300} y={330} z={-70} k={2.8} />
      <Tag text="？" x={-210} y={30} z={-40} r={10} size={50} bg="#f6d54a" s={pop(t, snapAt + 0.3) * (1 - seg(t, ct(L + 5, 5), ct(L + 5, 5) + 0.3))} />
      {mails.map((ci, i) => {
        const at = ct(L + 5, ci);
        const u = seg(t, at, at + 0.9);
        if (u <= 0) return null;
        // 寄出去，又原样弹回来
        const out = u < 0.55 ? eOut(u / 0.55) : 1 - eOut((u - 0.55) / 0.45) * 0.62;
        return <Envelope key={i} x={lerp(-220, 380, out)} y={lerp(120, -10, out) - Math.sin(u * Math.PI) * 120 + (u >= 1 ? 0 : 0) + i * 46 + (1 - out) * 60} z={-60 + i * 20} r={lerp(-30, 14 - i * 12, u) + (u < 1 ? u * 360 : 0)} s={1.15} stamp={i === 2 ? pop(t, ct(L + 5, 10)) : pop(t, at + 0.95)} />;
      })}
    </Cam>
  );
}

/* ───────────── 20 第二遍：随往事淡去 随梦境睡去（相册） ───────────── */
export function Album({ t, lt, L }: SP) {
  const turnAt = ct(L + 6, 5);
  const turn = eIO(seg(t, turnAt - 0.1, turnAt + 1.3));
  const sleep = t > turnAt + 0.4;
  const page: React.CSSProperties = { background: '#f4efe2', boxShadow: '3px 5px 0 rgba(0,0,0,.25)', backgroundImage: 'radial-gradient(rgba(0,0,0,.05) 1px, transparent 2px)', backgroundSize: '9px 9px' };
  return (
    <Cam z={lerp(-80, 40, seg(lt, 0, 6))} rx={16} ry={lerp(-5, 5, seg(lt, 0, 6))} y={-10}>
      <Bg kind="kraft" />
      <P x={-215} y={-20} z={-300} w={420} h={500} style={page} />
      <P x={215} y={-20} z={-300} w={420} h={500} style={page} />
      {[0, 1].map((i) => <Photo key={i} x={-215} y={-130 + i * 225} z={-296} r={i ? 4 : -5} w={170} kind={i + 1} fade={seg(t, ct(L + 6, i), ct(L + 6, i) + 1.3)} />)}
      {/* 翻过去之后：照片里只剩她自己 */}
      <Photo x={215} y={-120} z={-298} r={3} w={170} kind={2} solo />
      <Tag text="晚安" x={215} y={120} z={-296} r={-6} size={44} bg="#23232b" fg="#ffe27a" />
      {/* 会翻的那一页 */}
      <div className="p3d" style={{ position: 'absolute', left: 640 + 5, top: 360 - 20 - 250, width: 420, height: 500, transformOrigin: '0% 50%', transform: `translate3d(0,0,-294px) rotateY(${-turn * 178}deg)` }}>
        <div style={{ position: 'absolute', inset: 0, ...page, backfaceVisibility: 'hidden' }}>
          {[2, 3].map((i) => (
            <div key={i} style={{ position: 'absolute', left: 125, top: 30 + (i - 2) * 225, width: 170, height: 200, background: '#fbf8f0', boxShadow: '2px 4px 0 rgba(0,0,0,.2)', transform: `rotate(${i % 2 ? -4 : 5}deg)` }}>
              <div style={{ position: 'absolute', left: 12, top: 12, width: 146, height: 136, background: i % 2 ? 'linear-gradient(#ffd6e6 62%,#f3a6c4 62%)' : 'linear-gradient(#ffc38a 30%,#f58a6a 62%,#7d5a8c 62%)', overflow: 'hidden' }}>
                <Mini who="whale" k={0.78} x={50} y={132} />
                <Mini who="claude" k={0.78} x={100} y={132} />
                <div style={{ position: 'absolute', inset: 0, background: '#fbf8f0', opacity: seg(t, ct(L + 6, i), ct(L + 6, i) + 1.3) }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, ...page, background: '#ece5d3', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }} />
      </div>
      <Sprite who="whale" act={sleep ? 'sad' : 'idle'} t={sleep ? 99 : t} x={sleep ? 400 : 500} y={sleep ? 215 : 300} z={-120} k={2.4} r={sleep ? 78 : 0} />
      {sleep && [0, 1, 2].map((i) => {
        const u = (t * 0.5 + i * 0.33) % 1;
        return <div key={i} style={{ position: 'absolute', left: 640 + 360 + u * 40, top: 360 + 90 - u * 110, color: '#fff', fontFamily: FONT, fontSize: 26 + u * 26, opacity: 1 - u, transform: 'translateZ(-100px)', textShadow: '2px 2px 0 rgba(0,0,0,.3)' }}>z</div>;
      })}
    </Cam>
  );
}

/* ───────────── 21 第二遍：随麻痹的心 逐渐远去（松开的气球） ───────────── */
export function Balloon({ t, lt, L }: SP) {
  const u = seg(t, ct(L + 7, 0), ct(L + 7, 8) + 1.2);
  return (
    <Cam y={-eIO(u) * 90} z={lerp(40, -60, seg(lt, 0, 4.5))}>
      <Bg kind="night" style={{ background: 'linear-gradient(#1c2260,#5a4aa0)' }} />
      {stars(40, 8, 1, -470, t)}
      {[0, 1, 2, 3].map((i) => <Cloud key={i} x={-600 + i * 400 + Math.sin(t * 0.3 + i) * 30} y={-240 + (i % 2) * 150} z={-350 + i * 40} s={1.1} color={i % 2 ? '#e3e6ef' : '#fff'} />)}
      <P x={30 + Math.sin(t * 1.5) * 20 * u} y={120 - eIn(u) * 470 - u * 90} z={-60 - eIn(u) * 1500} w={110} h={230} r={Math.sin(t * 1.5) * 6}>
        <Heart size={110} color="#e8443c" />
        <div style={{ position: 'absolute', left: 22, top: 16, width: 20, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.5)', transform: 'rotate(30deg)' }} />
        <div style={{ position: 'absolute', left: 54, top: 96, width: 2, height: 130, background: '#f1ece0' }} />
      </P>
      <Sprite who="whale" act={u > 0 ? 'point' : 'idle'} t={u > 0 ? t - ct(L + 7, 0) : t} x={-60} y={335} z={-60} k={2.7} />
    </Cam>
  );
}

/* ───────────── 28 我好想你 好想你 / 就当作秘密 ───────────── */
export function Secret({ t, lt, L }: SP) {
  const tl = L + 17; // 就当作秘密
  const gather = ct(tl, 0);
  const hs = t < gather + 0.7 ? 0 : back(seg(t, gather + 0.7, gather + 1.4));
  const beat = 1 + 0.05 * Math.abs(Math.sin((t - gather) * Math.PI / 0.789));
  return (
    <Cam z={lerp(-80, 50, eOut(seg(lt, 0, 12)))} rx={8} ry={Math.sin(lt * 0.4) * 4}>
      <Bg kind="mat" />
      <P x={-360} y={300} z={-300} w={760} h={50} r={-4} style={{ background: '#e9e2d0', backgroundImage: 'linear-gradient(90deg,#6b6b6b 2px, transparent 2px)', backgroundSize: '20px 40%', backgroundRepeat: 'repeat-x' }} />
      {Array.from({ length: 10 }, (_, i) => {
        const g = eIO(seg(t, gather + i * 0.05, gather + 1.1 + i * 0.05));
        const x0 = (rnd(i, 1) - 0.5) * 1100, y0 = 40 + (rnd(i, 2) - 0.5) * 420;
        const s = pop(lt, 0.4 + i * 0.25) * (1 - g * 0.9);
        const x = lerp(x0, 0, g), y = lerp(y0, 40, g);
        return i % 3 === 0 ? <Photo key={i} x={x} y={y} z={-260 + i * 6} r={(rnd(i, 3) - 0.5) * 60 + g * 200} w={100} kind={i} s={s} /> : i % 3 === 1 ? <Envelope key={i} x={x} y={y} z={-260 + i * 6} r={(rnd(i, 3) - 0.5) * 60 + g * 200} s={0.7 * s} /> : <Person key={i} x={x} y={y} z={-260 + i * 6} r={(rnd(i, 3) - 0.5) * 90 + g * 300} s={1.6 * s} color={i % 2 ? '#f59a3d' : '#5aa9e6'} />;
      })}
      {/* 所有的想念收成一颗心，盖上「秘密」 */}
      <P x={0} y={40} z={-150} w={280} h={252} s={hs * beat} r={jit(t, 5, 1)}>
        <Heart size={280} color="#f59a3d" stroke="#e07c20" sw={3} />
        <div style={{ position: 'absolute', left: 50, top: 50, width: 70, height: 50, background: '#f7b56b', transform: 'rotate(-12deg)' }} />
        <div style={{ position: 'absolute', left: 150, top: 80, width: 60, height: 44, background: '#f2a14a', transform: 'rotate(9deg)' }} />
        <div style={{ position: 'absolute', left: 78, top: 92, transform: `rotate(-10deg) scale(${pop(t, ct(tl, 3), 0.22)})`, border: '5px solid #d8322b', color: '#d8322b', fontFamily: FONT, fontSize: 50, padding: '2px 12px', lineHeight: 1.1, whiteSpace: 'nowrap', background: 'rgba(255,240,220,.55)' }}>秘密</div>
      </P>
      <Sprite who="whale" act={t < gather ? 'sway' : t < ct(tl, 4) ? 'idle' : 'nod'} t={t < ct(tl, 4) ? t : t - ct(tl, 4)} x={450} y={330} z={-60} k={2.9} flip={t >= gather} />
      <Tag text="嘘……" x={330} y={60} z={-30} r={-6} size={40} s={pop(t, ct(tl, 4) + 0.25)} />
    </Cam>
  );
}

/* ───────────── 29 我好想你 好想你 / 就深藏在心 ───────────── */
export function Box({ t, lt, L }: SP) {
  const tl = L + 19; // 就深藏在心
  const sink = eIO(seg(t, ct(tl, 1), ct(tl, 2) + 0.5));
  const close = eOut(seg(t, ct(tl, 3), ct(tl, 3) + 0.45));
  const glow = seg(t, ct(tl, 4), ct(tl, 4) + 1.6);
  const dark = seg(t, ct(tl, 0), ct(tl, 4) + 1);
  const scene = (
    <Cam z={lerp(-100, 70, eIO(seg(lt, 0, 13)))} rx={6} ry={Math.sin(lt * 0.35) * 4}>
      <Bg kind="kraftDark" />
      <P y={235} z={-180} w={10} h={10} o={glow} style={{ borderRadius: '50%', boxShadow: '0 0 160px 150px rgba(255,200,120,.55)' }} />
      <P y={150} z={-170} w={300} h={40} style={{ background: '#2e1d0e' }} />
      {/* 那颗心 */}
      <P x={0} y={lerp(10, 215, sink) + Math.sin(t * 2) * 6 * (1 - sink)} z={-160} w={130} h={117} s={lerp(1, 0.6, sink)} r={jit(t, 2, 1.5)}>
        <Heart size={130} color="#f59a3d" stroke="#e07c20" sw={3} />
        <div style={{ position: 'absolute', left: 24, top: 36, transform: 'rotate(-10deg)', border: '3px solid #d8322b', color: '#d8322b', fontFamily: FONT, fontSize: 26, padding: '0 6px', background: 'rgba(255,240,220,.55)', whiteSpace: 'nowrap' }}>秘密</div>
      </P>
      <P y={245} z={-120} w={300} h={190} style={{ background: '#c9995a', backgroundImage: CARD, boxShadow: `4px 6px 0 rgba(0,0,0,.3)${glow > 0 ? `, 0 0 ${glow * 60}px rgba(255,210,140,${glow * 0.8})` : ''}` }}>
        <div style={{ position: 'absolute', left: 30, bottom: 26, border: '4px solid #8a3b2b', color: '#8a3b2b', fontFamily: FONT, fontSize: 30, padding: '2px 10px', transform: 'rotate(-5deg)', opacity: 0.8 }}>易碎</div>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 46, marginLeft: -23, height: 60 * close, background: 'rgba(240,225,190,.9)' }} />
      </P>
      <P x={-150} y={139} z={-118} w={152} h={24} r={lerp(-152, 0, close)} origin="0% 100%" style={{ background: '#b4854a', boxShadow: '0 2px 0 rgba(0,0,0,.2)' }} />
      <P x={150} y={139} z={-118} w={152} h={24} r={lerp(152, 0, close)} origin="100% 100%" style={{ background: '#b4854a', boxShadow: '0 2px 0 rgba(0,0,0,.2)' }} />
      <Tag text="心" x={60} y={225} z={-100} r={6} size={64} bg="#fffaf0" fg="#d8322b" s={pop(t, ct(tl, 4), 0.24)} />
      <Sprite who="whale" act={t > ct(tl, 4) + 0.3 ? 'bow' : t > ct(tl, 0) ? 'idle' : 'sway'} t={t > ct(tl, 4) + 0.3 ? (t - ct(tl, 4) - 0.3) * 0.6 : t} x={330} y={340} z={-70} k={2.9} flip />
    </Cam>
  );
  // 四周暗下去，只剩箱子那一圈光（平面层）
  return (
    <>
      {scene}
      <div style={{ position: 'absolute', inset: 0, opacity: dark * 0.85, background: 'radial-gradient(circle at 50% 66%, transparent 22%, rgba(10,5,0,.92) 62%)' }} />
    </>
  );
}

/* ───────────── 30 尾奏：月亮上并排坐着（藏在心里的那一幕） ───────────── */
export function MoonEnd({ t, lt }: SP) {
  const credits: [string, number, number, number][] = [['演唱 苏打绿', -430, -270, 3], ['词曲 吴青峰', 430, -250, 6], ['主角 鲸鱼娘', -450, 250, 9], ['被想念的人 小克', 420, 270, 12], ['番外 复刻版', 0, 300, 15]];
  return (
    <Cam z={lerp(-420, 0, eOut(seg(lt, 0, 20)))} rz={Math.sin(lt * 0.25) * 4} ry={Math.sin(lt * 0.3) * 6}>
      <Bg kind="night" style={{ background: 'radial-gradient(ellipse at 40% 40%, #5a469f 0%, #231a55 70%)' }} />
      {stars(60, 15, 1, -480, t)}
      <Moon x={-40} y={40} z={-200} size={560} r={-28} />
      <Sprite who="whale" act="sway" t={t * 0.7} x={-58} y={248} z={-150} k={2.2} r={-6} />
      <Sprite who="claude" act={lt % 8 < 1.2 ? 'nod' : 'idle'} t={lt % 8 < 1.2 ? lt % 8 : t} x={70} y={262} z={-150} k={2.2} r={8} />
      <P x={8} y={70 - ((lt * 30) % 60)} z={-140} w={34} h={30} o={1 - ((lt * 0.5) % 1)} s={0.8 + ((lt * 0.5) % 1) * 0.6}><Heart size={34} color="#ef6461" /></P>
      {Array.from({ length: 64 }, (_, i) => {
        const dir = i % 2 ? 1 : -1;
        const a = i * 2.4 + t * (0.18 + rnd(i, 1) * 0.22) * dir;
        const R = 430 + rnd(i, 2) * 520;
        const x = Math.cos(a) * R, z = Math.sin(a) * R * 0.8 - 250;
        const y = (rnd(i, 3) - 0.5) * 900 + Math.sin(t * 0.6 + i) * 30;
        const s = pop(lt, 0.2 + i * 0.05);
        const r = t * (20 + rnd(i, 4) * 50) * dir + i * 40;
        const k = i % 6;
        if (k === 0) return <Photo key={i} x={x} y={y} z={z} r={r} w={76} kind={i} s={s} />;
        if (k === 1) return <Person key={i} x={x} y={y} z={z} r={r} s={1.5 * s} color={['#5aa9e6', '#f59a3d', '#6fcf8b', '#f7a8c8', '#f6d54a'][i % 5]} />;
        if (k === 2) return <Star key={i} x={x} y={y} z={z} r={r} s={1.2 * s} color={['#ffe27a', '#f49ac1', '#7df9ff'][i % 3]} />;
        if (k === 3) return <P key={i} x={x} y={y} z={z} w={30} h={27} r={r * 0.3} s={s}><Heart size={30} color={i % 2 ? '#ef6461' : '#f7a8c8'} /></P>;
        return <P key={i} x={x} y={y} z={z} w={22} h={14} r={r} s={s} style={{ background: ['#f6d54a', '#4f9fe8', '#ef6461', '#6fcf8b', '#fff'][i % 5] }} />;
      })}
      {credits.map(([text, x, y, at], i) => <Tag key={i} text={text} x={x} y={y} z={40} r={i % 2 ? 4 : -4} size={26} bg={i % 2 ? '#23232b' : '#fff'} fg={i % 2 ? '#fff' : '#222'} s={pop(lt, at) * (1 - seg(lt, 23.5, 24.2))} />)}
    </Cam>
  );
}

/* ───────────── 31 片尾：心形的窗 ───────────── */
export function End({ t, lt }: SP) {
  const iris = lerp(7, 1, eIO(seg(lt, 0, 2.6)));
  return (
    <Cam z={lerp(0, 50, seg(lt, 0, 11))}>
      <Bg kind="kraft" />
      <P x={0} y={20} z={-200} w={420} h={378} s={iris} r={jit(t, 1, 0.4)}>
        <Heart size={420} color="#231a55" stroke="#8a6034" sw={3} />
        <div style={{ position: 'absolute', left: 150, top: 110, width: 170, height: 170, borderRadius: '50%', boxShadow: 'inset -50px 10px 0 0 #f6c935', transform: 'rotate(-28deg)' }} />
        <Mini who="whale" k={0.62} x={228} y={242} />
        <Mini who="claude" k={0.62} x={266} y={246} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} style={{ position: 'absolute', left: 60 + rnd(i, 1) * 300, top: 40 + rnd(i, 2) * 160, width: 4, height: 4, borderRadius: 2, background: '#ffe9a0', opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)) }} />)}
      </P>
      {'我好想你'.split('').map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: 640 - 190 + i * 100, top: 360 - 300, width: 80, textAlign: 'center', fontFamily: FONT, fontSize: 80, color: '#f59a3d', textShadow: '3px 3px 0 #fff3dc, -1px -1px 0 #fff3dc, 4px 6px 0 rgba(0,0,0,.2)', opacity: clamp(pop(lt, 2.8 + i * 0.3) * 2), transform: `translateZ(${lerp(300, -100, clamp(pop(lt, 2.8 + i * 0.3)))}px) rotate(${(rnd(i, 3) - 0.5) * 10}deg)` }}>{c}</div>
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360 + 250, textAlign: 'center', fontFamily: FONT, fontSize: 30, letterSpacing: 10, color: '#fff7e6', textShadow: '2px 2px 0 rgba(0,0,0,.3)', opacity: seg(lt, 4.6, 5.8), transform: 'translateZ(-80px)' }}>就深藏在心</div>
      {[0, 1, 2, 3].map((i) => <P key={i} x={-520 + i * 340} y={220 + (i % 2) * -420} z={-150} w={30} h={27} r={Math.sin(t * 3 + i) * 25} s={pop(lt, 3 + i * 0.4) + bump(0) }><Heart size={30} color={['#f59a3d', '#f7a8c8', '#4f9fe8', '#f6d54a'][i]} /></P>)}
    </Cam>
  );
}
