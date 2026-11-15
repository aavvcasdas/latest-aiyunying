import React from 'react';
import { P, Cam, Sprite, Mini, Photo, Heart, Moon, Bg, Burst, Tag, Star, Envelope, Wave, Rain, Person, torn, hill, STICKER, NEON } from './parts';
import { BigTile, ct } from './Lyrics';
import { seg, lerp, eOut, eIn, eIO, rnd, pop, jit, mix, clamp, FONT, bump } from './util';

/** t = 全片秒数；lt = 本镜头内秒数；v = 第几遍；L = 这一遍的歌词行号起点（0 或 16） */
export type SP = { t: number; lt: number; d: number; v: 1 | 2; L: number };
/** 图集里的走路帧朝右（截帧核对过）；往右走不用翻面 */
const WALK_LEFT = false;
const GRID: React.CSSProperties = { backgroundColor: '#f4f1e8', backgroundImage: 'linear-gradient(rgba(120,130,150,.18) 1px, transparent 1px),linear-gradient(90deg, rgba(120,130,150,.18) 1px, transparent 1px)', backgroundSize: '26px 26px' };
const stars = (n: number, seed: number, o = 1, z = -460, t = 0) =>
  Array.from({ length: n }, (_, i) => (
    <P key={'s' + i} x={(rnd(i, seed) - 0.5) * 1900} y={(rnd(i, seed + 1) - 0.5) * 1000} z={z} w={5} h={5} o={o * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7) ** 2)} style={{ background: i % 4 ? '#fff' : '#ffe27a', borderRadius: '50%' }} />
  ));

function House({ x, y = 60, z = -200, body = '#c9995a', roof = '#e0483e', s = 1 }: { x: number; y?: number; z?: number; body?: string; roof?: string; s?: number }) {
  return (
    <>
      <P x={x} y={y} z={z} w={200 * s} h={170 * s} style={{ background: body, backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 3px, transparent 3px 14px)', boxShadow: '3px 5px 0 rgba(0,0,0,.2)' }}>
        <div style={{ position: 'absolute', left: '55%', bottom: 0, width: '26%', height: '52%', background: '#8a5a2b', border: '3px solid #6b431c' }} />
        <div style={{ position: 'absolute', left: '14%', top: '22%', width: '24%', height: '26%', background: '#fff3b8', border: '3px solid #6b431c' }} />
      </P>
      <P x={x} y={y - 135 * s} z={z + 4} w={260 * s} h={110 * s} style={{ background: roof, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }} />
    </>
  );
}

/* ───────────── 0 片头：翻开的故事书 ───────────── */
export function Intro({ t }: SP) {
  const open = eIO(seg(t, 2.7, 4.1));
  const night = eIO(seg(t, 8.4, 11.4));
  const walk = seg(t, 5.0, 9.6);
  return (
    <Cam z={lerp(120, -40, eIO(seg(t, 0, 2.7))) + lerp(0, -260, eIO(seg(t, 4, 12.6)))} ry={lerp(-7, 6, seg(t, 0, 12.6))} rx={lerp(5, 0, seg(t, 0, 10))}>
      <Bg kind="kraft" />
      <P z={-300} w={1560} h={920} style={{ backgroundColor: '#f7c9dc', backgroundImage: 'radial-gradient(#fff 3px, transparent 4px)', backgroundSize: '30px 30px', clipPath: torn(1) }} />
      <P y={-250} z={-290} w={1560} h={430} style={{ background: mix('#8fd8c0', '#141a45', night), clipPath: torn(5, 26, 4) }} />
      {stars(26, 4, night, -285, t).map((s, i) => (i % 2 ? s : null))}
      <Moon x={360} y={-280} z={-270} size={120} o={night} />
      <P x={160} y={30} z={-240} w={26} h={170} style={{ background: '#8a5a2b' }} />
      <P x={160} y={-90} z={-236} w={170} h={170} s={pop(t, 4.3)} style={{ background: '#f59a3d', borderRadius: '50%', boxShadow: '3px 5px 0 rgba(0,0,0,.18)' }} />
      <House x={-270} y={30} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <P key={i} x={-560 + i * 185 + (i > 1 ? 60 : 0)} y={140 + (i % 2) * 26} z={-180 + i * 6} w={44} h={44} s={pop(t, 4.5 + i * 0.4)} style={{ background: ['#ef6461', '#f6d54a', '#4f9fe8', '#f49ac1'][i % 4], borderRadius: '50%', border: '9px dotted #fff' }} />
      ))}
      <Sprite who="whale" act={walk > 0 && walk < 1 ? 'walk' : t > 10 ? 'wave' : 'idle'} t={t} x={lerp(-215, 40, walk)} y={190} z={-130} k={2.3} flip={WALK_LEFT && walk < 1} o={seg(t, 4.6, 5.0)} />
      {/* 蓝色封面 */}
      <P x={lerp(0, -1700, open)} r={lerp(0, -10, open)} z={-100} w={1700} h={1000} style={{ background: '#3a6cc0', boxShadow: '8px 0 0 rgba(0,0,0,.25)' }}>
        <div style={{ position: 'absolute', inset: 150, border: '5px dashed rgba(255,255,255,.9)', borderRadius: 6 }} />
        <div style={{ position: 'absolute', left: '50%', top: '43%', transform: `translate(-50%,-50%) rotate(-3deg) scale(${pop(t, 0.5)})`, background: '#f6d54a', color: '#222', fontFamily: FONT, fontSize: 96, padding: '6px 34px', lineHeight: 1.1, boxShadow: '5px 7px 0 rgba(0,0,0,.3)', whiteSpace: 'nowrap' }}>我好想你</div>
        <div style={{ position: 'absolute', left: '50%', top: '57%', transform: `translate(-50%,-50%) rotate(2deg) scale(${pop(t, 1.1)})`, background: '#23232b', color: '#fff', fontFamily: FONT, fontSize: 30, padding: '6px 18px', whiteSpace: 'nowrap' }}>苏打绿 Sodagreen · 鲸鱼娘 番外</div>
        <div style={{ position: 'absolute', left: '30%', top: '66%', width: 110, height: 110, borderRadius: '50%', boxShadow: 'inset -32px 8px 0 0 #f6c935', transform: 'rotate(-30deg)' }} />
      </P>
    </Cam>
  );
}

/* ───────────── 1 标题：切割垫上的四个大字 ───────────── */
export function Title({ t, lt }: SP) {
  const T = [14.0, 14.8, 15.6, 17.2];
  const openBox = eOut(seg(t, 19.6, 20.6));
  const up = eOut(seg(t, 21.0, 21.7));
  return (
    <Cam z={lerp(-120, 60, eIO(seg(lt, 0, 13)))} rx={lerp(10, 2, seg(lt, 0, 6))} ry={Math.sin(lt * 0.35) * 4}>
      <Bg kind="mat" />
      <P x={-40} y={-20} z={-400} w={1300} h={700} r={-2} style={{ background: '#f4f1e8', clipPath: torn(8), backgroundImage: 'repeating-linear-gradient(rgba(60,60,60,.16) 0 3px, transparent 3px 13px)', backgroundSize: '100% 100%' }} />
      {Array.from({ length: 9 }, (_, i) => (
        <Photo key={i} x={(rnd(i, 21) - 0.5) * 1300} y={(rnd(i, 22) - 0.5) * 620 + 60} z={-360 + i * 8} r={(rnd(i, 23) - 0.5) * 50} w={110} kind={i} s={pop(t, 17.8 + i * 0.2)} />
      ))}
      {'我好想你'.split('').map((c, i) => (
        <BigTile key={i} c={c} t={t} at={T[i]} x={-285 + i * 190} y={-150 + (i % 2) * 14} S={160} i={i} z={-200} />
      ))}
      {/* 纸箱 */}
      <P x={0} y={250} z={-150} w={300} h={210} style={{ background: '#5b3d1f' }} />
      <Sprite who="whale" act="hop" t={t} x={0} y={lerp(380, 215, up)} z={-140} k={2.6} o={t > 20.6 ? 1 : 0} />
      <P x={0} y={270} z={-120} w={300} h={170} style={{ background: '#c9995a', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 3px, transparent 3px 12px)', boxShadow: '4px 6px 0 rgba(0,0,0,.25)' }} />
      <P x={-150} y={185} z={-118} w={150} h={22} r={lerp(0, -150, openBox)} origin="0% 100%" style={{ background: '#b4854a' }} />
      <P x={150} y={185} z={-118} w={150} h={22} r={lerp(0, 150, openBox)} origin="100% 100%" style={{ background: '#b4854a' }} />
      {Array.from({ length: 14 }, (_, i) => {
        const u = seg(t, 21.2, 23.2);
        const a = (i / 14) * Math.PI * 2;
        return <Star key={i} x={Math.cos(a) * 420 * eOut(u)} y={160 + Math.sin(a) * 300 * eOut(u) + 160 * u * u} z={-100 + rnd(i, 5) * 150} s={1.2 * (1 - seg(u, 0.7, 1))} r={u * 300} color={['#ffe27a', '#f49ac1', '#7df9ff', '#fff'][i % 4]} o={u > 0 ? 1 : 0} />;
      })}
      <Tag text="苏打绿 Sodagreen" x={-430} y={-290} z={-180} r={-4} size={24} bg="#23232b" fg="#fff" s={pop(t, 13.2)} />
    </Cam>
  );
}

/* ───────────── 房间（暗 / 开灯 / 关灯霓虹 共用） ───────────── */
function Room({ lit, neon, t, ghost = 0, children }: { lit: number; neon: boolean; t: number; ghost?: number; children?: React.ReactNode }) {
  const W = 1000, H = 560, D = 520;
  const n = (fill: string, hue: string, extra: React.CSSProperties = {}): React.CSSProperties =>
    neon ? { ...extra, background: 'transparent', backgroundImage: 'none', border: `3px solid ${hue}`, boxShadow: `0 0 10px ${hue}` } : { background: fill, ...extra };
  return (
    <>
      <P z={-D} w={W} h={H} style={n('#e6e0f1', '#b9a1ff')} />
      <P y={H / 2} z={-D / 2} w={W} h={D} rx={90} style={n('#c9995a', '#ffa25e', { backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.14) 0 3px, transparent 3px 90px)' })} />
      <P y={-H / 2} z={-D / 2} w={W} h={D} rx={90} style={n('#f3f0f8', '#7df9ff')} />
      <P x={-W / 2} z={-D / 2} w={D} h={H} ry={90} style={n('#d3cbe4', '#9dff8a')} />
      <P x={W / 2} z={-D / 2} w={D} h={H} ry={90} style={n('#d3cbe4', '#ff8ad8')} />
      {/* 日历：四号 */}
      <P x={-360} y={-110} z={-D + 2} w={72} h={92} style={n('#fff', '#ffe66d')}>
        {!neon && <div style={{ height: 22, background: '#e0483e' }} />}
        <div style={{ textAlign: 'center', fontFamily: FONT, fontSize: 50, lineHeight: '66px', color: neon ? '#ffe66d' : '#333' }}>4</div>
      </P>
      {/* 墙上的合照 */}
      {neon ? <P x={-220} y={-120} z={-D + 2} w={100} h={118} style={n('', '#ff8ad8')} /> : <Photo x={-220} y={-120} z={-D + 3} w={100} r={-3} />}
      {/* 窗外有月亮 */}
      <P x={270} y={-100} z={-D + 2} w={200} h={220} style={n('#1a2052', '#7df9ff', { overflow: 'hidden' })}>
        <div style={{ position: 'absolute', right: 34, top: 30, width: 56, height: 56, borderRadius: '50%', boxShadow: `inset -16px 4px 0 0 ${neon ? '#ffe66d' : '#f6c935'}`, transform: 'rotate(-25deg)' }} />
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ position: 'absolute', left: 20 + rnd(i, 3) * 150, top: 20 + rnd(i, 4) * 170, width: 5, height: 5, borderRadius: 3, background: '#ffe9a0', opacity: 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)) }} />)}
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 4, height: '100%', background: neon ? '#7df9ff' : '#8f86ad', marginLeft: -2 }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, height: 4, width: '100%', background: neon ? '#7df9ff' : '#8f86ad', marginTop: -2 }} />
      </P>
      {!neon && [-1, 1].map((s) => <P key={s} x={270 + s * 118} y={-100} z={-D + 6} w={40} h={250} style={{ background: 'repeating-linear-gradient(90deg,#f7a8c8 0 8px,#f18db5 8px 16px)', boxShadow: '2px 3px 0 rgba(0,0,0,.15)' }} />)}
      {/* 吊灯 */}
      <P y={-H / 2 + 60} z={-D / 2} w={3} h={120} style={{ background: neon ? '#c4a1ff' : '#555' }} />
      <P y={-H / 2 + 136} z={-D / 2} w={46} h={46} style={neon ? n('', '#c4a1ff', { borderRadius: '50%' }) : { borderRadius: '50%', background: mix('#8f8aa6', '#fff6c8', lit), boxShadow: lit > 0.5 ? '0 0 90px 50px rgba(255,240,170,.75)' : 'none' }} />
      {/* 床 */}
      <P x={-340} y={170} z={-D + 150} w={22} h={220} style={n('#6f8fd6', '#7df9ff', { borderRadius: 10 })} />
      <P x={-170} y={225} z={-D + 152} w={340} h={70} style={n('#fbfbff', '#9dff8a', { borderRadius: 8 })} />
      <P x={-100} y={222} z={-D + 156} w={200} h={64} style={n('', '#ffe66d', { background: 'linear-gradient(90deg,#f7a8c8 0 25%,#9fd3f5 25% 50%,#f6d54a 50% 75%,#b59cf2 75%)', borderRadius: 4 })} />
      <P x={-285} y={186} z={-D + 158} w={90} h={36} style={n('#fff', '#ff8ad8', { borderRadius: 18, boxShadow: neon ? undefined : '1px 2px 0 rgba(0,0,0,.2)' })} />
      <P x={0} y={170} z={-D + 150} w={16} h={220} style={n('#6f8fd6', '#7df9ff', { borderRadius: 8 })} />
      {/* 床头柜、椅子、地毯 */}
      <P x={130} y={232} z={-D + 120} w={104} h={96} style={n('#c9995a', '#ffa25e')}>
        <div style={{ position: 'absolute', left: 12, right: 12, top: 14, height: 30, border: `3px solid ${neon ? '#ffa25e' : '#8a5a2b'}` }} />
      </P>
      <P x={130} y={160} z={-D + 122} w={34} h={50} style={n('#7fcf8f', '#9dff8a', { borderRadius: '50% 50% 6px 6px' })} />
      <P x={-430} y={215} z={-D + 300} w={70} h={130} style={n('transparent', '#ffa25e', { border: neon ? undefined : '8px solid #8a5a2b', borderBottom: 'none' })} />
      <P y={H / 2 - 2} z={-D / 2 + 110} w={300} h={170} rx={90} style={{ borderRadius: '50%', border: `4px solid ${neon ? '#ff8ad8' : '#e58a5a'}`, background: neon ? 'transparent' : 'rgba(240,170,120,.35)' }} />
      {/* 满屋子都是那个人的影子 */}
      {ghost > 0 && (
        <>
          <Sprite who="claude" act="idle" t={t} x={245} y={H / 2} z={-D + 190} k={2.2} o={ghost * 0.55} filter={neon ? NEON('#ffa25e') : STICKER} />
          <Sprite who="claude" act="read" t={t * 0.6} x={-120} y={198} z={-D + 170} k={2} o={ghost * 0.5} filter={neon ? NEON('#ffa25e') : STICKER} />
          <Sprite who="claude" act="curtsy" t={t} x={-395} y={H / 2} z={-D + 330} k={2.1} o={ghost * 0.45} filter={neon ? NEON('#ffa25e') : STICKER} />
        </>
      )}
      {children}
    </>
  );
}
const FLOOR = 276;
/** 没开灯：整张画面压一层夜色（平面层，不进 3D 排序） */
const Dark = ({ a = 0.76 }: { a?: number }) => <div style={{ position: 'absolute', inset: 0, background: `rgba(14,20,84,${a})`, mixBlendMode: 'multiply' }} />;
const lying = (neon: boolean) => <Sprite who="whale" act="sad" t={99} x={-75} y={192} z={-520 + 172} k={2.1} r={-90} filter={neon ? NEON('#9dff8a') : STICKER} />;

/* ───────────── 2 暗房：你也看得到月亮吗 ───────────── */
export function DarkRoom({ t, lt }: SP) {
  const stand = seg(lt, 3.6, 4.2);
  const walk = seg(lt, 4.4, 7.2);
  const cz = lerp(-260, 40, eIO(seg(lt, 0, 11)));
  const cry = lerp(8, -6, eIO(seg(lt, 0, 11)));
  return (
    <>
      <Cam z={cz} ry={cry}>
        <Bg kind="kraftDark" z={-1200} />
        <Room lit={0.14} neon={false} t={t}>
          {stand <= 0 ? (
            <Sprite who="whale" act="sad" t={lt * 0.5} x={-150} y={194} z={-345} k={2.1} />
          ) : (
            <Sprite who="whale" act={walk > 0 && walk < 1 ? 'walk' : 'idle'} t={t} x={lerp(-150, 150, eIO(walk))} y={FLOOR} z={-300} k={2.3} flip={WALK_LEFT && walk < 1} />
          )}
        </Room>
      </Cam>
      <Dark />
      <Cam z={cz} ry={cry}>
        <Tag text="你也看得到月亮吗？" x={40} y={-10} z={-250} r={-3} size={30} bg="#fff" fg="#333" s={pop(lt, 7.6) * (1 - seg(lt, 11.3, 11.8))} />
      </Cam>
    </>
  );
}

/* ───────────── 3 开了灯 眼前的模样 / 偌大的房 寂寞的床 ───────────── */
export function RoomOn({ t, v, L }: SP) {
  const on = ct(L, 0);
  const pull = eIO(seg(t, ct(L + 1, 0) - 0.3, ct(L + 1, 7) + 1.6));
  const lie = t > ct(L + 1, 4) - 0.1;
  const ghost = v === 2 ? seg(t, ct(L, 3), ct(L, 3) + 0.5) * (1 - seg(t, ct(L + 1, 4), ct(L + 1, 4) + 2.2)) : 0;
  return (
    <>
      <Cam z={lerp(70, -1000, pull) + bump(seg(t, on, on + 0.3)) * 40} ry={lerp(-5, 0, pull) + Math.sin(t * 0.4) * 1.5}>
        <Bg kind="kraft" z={-1200} />
        <Room lit={t < on ? 0.14 : 1} neon={false} t={t} ghost={ghost}>
          {lie ? lying(false) : <Sprite who="whale" act={t > on && t < on + 0.7 ? 'surprise' : 'idle'} t={t > on && t < on + 0.7 ? t - on : t} x={-30} y={FLOOR} z={-300} k={2.3} />}
        </Room>
      </Cam>
      {t < on && <Dark />}
    </>
  );
}

/* ───────────── 4 关了灯 全都一个样 / 心里的伤 无法分享 ───────────── */
export function RoomOff({ t, v, L }: SP) {
  const off = ct(L + 2, 0);
  const neon = t >= off;
  const push = eIO(seg(t, off, ct(L + 3, 0) + 0.8));
  const hurt = ct(L + 3, 0);
  const share = seg(t, ct(L + 3, 4), ct(L + 3, 7) + 1.8);
  const up = t > hurt - 0.35;
  const beat = 1 + 0.12 * Math.abs(Math.sin((t - hurt) * Math.PI / 0.789));
  return (
    <Cam z={lerp(-1000, -60, push)} ry={lerp(0, 5, push)} x={lerp(0, 20, push)}>
      <Bg kind={neon ? 'ink' : 'kraft'} z={-1200} />
      <Room lit={1} neon={neon} t={t} ghost={v === 2 && neon ? 0.5 * (1 - seg(t, hurt, hurt + 1.5)) : 0}>
        {up ? <Sprite who="whale" act="sad" t={t - hurt} x={-40} y={FLOOR} z={-290} k={2.3} filter={NEON('#9dff8a')} /> : lying(neon)}
        {/* 贴着创可贴的心 */}
        <P x={70} y={120 - share * 30} z={-250} w={110} h={100} s={pop(t, hurt) * beat * (1 - share * 0.35)} r={jit(t, 3, 2)}>
          <Heart size={110} color="rgba(255,93,122,.25)" stroke="#ff5d7a" />
          <div style={{ position: 'absolute', left: 20, top: 38, width: 70, height: 20, background: '#ffe9d6', transform: 'rotate(35deg)', boxShadow: '0 0 8px #ffb48a' }} />
          <div style={{ position: 'absolute', left: 20, top: 38, width: 70, height: 20, background: '#ffe9d6', transform: 'rotate(-35deg)', boxShadow: '0 0 8px #ffb48a' }} />
        </P>
        {/* 想递出去，却散掉了 */}
        {share > 0 && Array.from({ length: 22 }, (_, i) => {
          const u = clamp(share * 1.5 - rnd(i, 7) * 0.5);
          const a = rnd(i, 8) * Math.PI * 2;
          return <P key={i} x={70 + Math.cos(a) * 60 + u * (180 + rnd(i, 9) * 260)} y={115 + Math.sin(a) * 50 - u * 80 * rnd(i, 10)} z={-250 + u * 150 * (rnd(i, 11) - 0.3)} w={8} h={8} r={u * 400} o={u > 0 ? 1 - u : 0} style={{ background: ['#ff5d7a', '#ffa25e', '#ffe66d'][i % 3], boxShadow: '0 0 6px #ff8ad8' }} />;
        })}
      </Room>
    </Cam>
  );
}

/* ───────────── 5 生命 随年月流去 随白发老去 ───────────── */
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
export function Calendar({ t, lt, L }: SP) {
  const old = seg(t, ct(L + 4, 7), ct(L + 4, 11) + 0.5);
  return (
    <Cam z={lerp(40, -120, seg(lt, 0, 7))} rx={6} ry={Math.sin(lt * 0.5) * 4}>
      <Bg kind="kraft" />
      <P x={-90} y={-30} z={-380} w={1050} h={640} r={1} style={{ ...GRID, clipPath: torn(12) }} />
      {MONTHS.map((m, i) => {
        const at = ct(L + 4, i);
        const u = seg(t, at, at + 1.15);
        const dir = i % 2 ? 1 : -1;
        const gray = i >= 7;
        return (
          <P key={i} x={-90 + dir * eIn(u) * 760 + jit(t, i, 0.6)} y={-40 + u * u * 380 - Math.sin(Math.PI * u) * 150} z={-220 - i * 3 + Math.sin(Math.PI * u * 0.85) * 330} rx={u * 220} r={dir * u * 140 + (rnd(i, 2) - 0.5) * 6} w={230} h={270} o={1 - seg(u, 0.85, 1)} style={{ background: '#fdfcf7', boxShadow: '3px 5px 0 rgba(0,0,0,.25)', filter: gray ? 'grayscale(1)' : undefined }}>
            <div style={{ height: 62, background: ['#e0483e', '#4f9fe8', '#57b86b', '#f59a3d', '#8a63d2', '#e0483e'][i % 6], color: '#fff', fontFamily: FONT, fontSize: 34, textAlign: 'center', lineHeight: '62px' }}>{m}</div>
            <div style={{ fontFamily: FONT, fontSize: 150, textAlign: 'center', lineHeight: '200px', color: '#2b2b2b' }}>{[4, 11, 18, 25][i % 4]}</div>
          </P>
        );
      })}
      <Sprite who="whale" act="sad" t={lt * 0.6} x={440} y={320} z={-80} k={2.7} filter={`${STICKER} grayscale(${old * 0.95})`} />
    </Cam>
  );
}

/* ───────────── 6 随着你离去 快乐渺无音讯 ───────────── */
export function Leave({ t, lt, L }: SP) {
  const go = seg(t, ct(L + 5, 0), ct(L + 5, 4) + 1.4);
  const letter = seg(t, ct(L + 5, 5), ct(L + 5, 8));
  return (
    <Cam z={lerp(-60, 60, seg(lt, 0, 7))} x={lerp(-30, 30, seg(lt, 0, 7))}>
      <Bg kind="paper" style={{ background: 'linear-gradient(#f3b98c,#f6e3c0)' }} />
      <P x={270} y={-170} z={-420} w={170} h={190} r={6} style={{ background: '#fdf6e3', boxShadow: '3px 5px 0 rgba(0,0,0,.18)' }}>
        <div style={{ position: 'absolute', left: 35, top: 40, width: 100, height: 100, borderRadius: '50%', background: '#f0643c', border: '10px dotted #f59a3d' }} />
      </P>
      <P y={250} z={-380} w={2600} h={420} style={{ background: '#a99bd6', clipPath: hill(1, 18, 40) }} />
      <P y={300} z={-260} w={2400} h={400} style={{ background: '#8fcf9b', clipPath: hill(2, 14, 36) }} />
      <P x={120} y={330} z={-200} w={900} h={330} style={{ background: '#f6edd6', clipPath: 'polygon(42% 0,58% 0,100% 100%,0 100%)' }} />
      {/* 小克越走越远 */}
      <Sprite who="claude" act="walk" t={t} x={lerp(40, 300, go)} y={lerp(310, 190, go)} z={lerp(-100, -560, go)} k={2.6} flip={WALK_LEFT} o={1 - seg(go, 0.75, 1)} />
      <Sprite who="whale" act={t < ct(L + 5, 3) ? 'wave' : 'sad'} t={t < ct(L + 5, 3) ? t : t - ct(L + 5, 3)} x={-350} y={320} z={-70} k={2.8} />
      {letter > 0 && <Envelope x={lerp(900, 130, eOut(letter))} y={lerp(-300, 40, eOut(letter)) - Math.sin(letter * Math.PI) * 80} z={-30} r={lerp(-200, 8, eOut(letter))} s={1.5} stamp={pop(t, ct(L + 5, 10))} />}
    </Cam>
  );
}

/* ───────────── 7 随往事淡去 随梦境睡去 ───────────── */
export function Fade({ t, lt, L }: SP) {
  const down = eIO(seg(t, ct(L + 6, 5) - 0.4, ct(L + 6, 6) + 0.5));
  return (
    <Cam y={down * 400} z={lerp(-40, 40, seg(lt, 0, 6))} ry={lerp(-4, 4, seg(lt, 0, 6))}>
      <Bg kind="night" />
      {stars(50, 9, 1, -450, t)}
      <P y={-150} z={-200} w={1500} h={3} r={1.5} style={{ background: '#f1ece0' }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <Photo x={-440 + i * 220} y={-70 + i * 5 + Math.sin(t * 1.3 + i) * 4} z={-195} r={Math.sin(t * 1.1 + i * 2) * 3} w={150} kind={i + 1} fade={seg(t, ct(L + 6, i), ct(L + 6, i) + 1.3)} />
          <P x={-440 + i * 220} y={-150 + i * 5} z={-190} w={14} h={30} style={{ background: ['#ef6461', '#f6d54a', '#6fcf8b', '#4f9fe8', '#f7a8c8'][i] }} />
        </React.Fragment>
      ))}
      {/* 睡在月亮上 */}
      <Moon x={30} y={470} z={-200} size={380} r={-35} />
      <Sprite who="whale" act="sad" t={99} x={-45} y={512 + Math.sin(t * 1.2) * 3} z={-150} k={2.2} r={-62} />
      {[0, 1, 2].map((i) => {
        const u = (t * 0.5 + i * 0.33) % 1;
        return <div key={i} style={{ position: 'absolute', left: 640 - 150 - u * 60, top: 360 + 370 - u * 110, color: '#fff', fontFamily: FONT, fontSize: 26 + u * 26, opacity: down * (1 - u), transform: 'translateZ(-140px)' }}>z</div>;
      })}
    </Cam>
  );
}

/* ───────────── 8 随麻痹的心 逐渐远去 ───────────── */
export function Numb({ t, lt, L }: SP) {
  const far = eIn(seg(t, ct(L + 7, 0), ct(L + 7, 8) + 1.0));
  return (
    <Cam ry={lerp(-6, 6, seg(lt, 0, 4))}>
      <Bg kind="ink" />
      {Array.from({ length: 34 }, (_, i) => (
        <P key={i} x={((rnd(i, 1) * 2600 + t * (500 + rnd(i, 2) * 700)) % 2600) - 1300} y={(rnd(i, 3) - 0.5) * 760} z={-400 + rnd(i, 4) * 500} w={90 + rnd(i, 5) * 220} h={3} style={{ background: 'rgba(255,255,255,.75)', borderRadius: 2 }} />
      ))}
      <P x={lerp(0, 160, far)} y={lerp(-20, -120, far)} z={lerp(40, -3200, far)} w={220} h={200} r={far * 200 + jit(t, 1, 2)}>
        <Heart size={220} color="#8d8fa3" stroke="#fff" sw={5} />
        {[-28, 0, 28].map((a, i) => <div key={i} style={{ position: 'absolute', left: 10, top: 70 + (i - 1) * 34, width: 200, height: 24, background: '#f4ead8', transform: `rotate(${a}deg)`, boxShadow: '1px 2px 0 rgba(0,0,0,.3)' }} />)}
      </P>
      <Sprite who="whale" act="point" t={lt * 0.4} x={-380} y={330} z={-40} k={2.7} filter={`${STICKER} grayscale(.7) brightness(.8)`} />
    </Cam>
  );
}

/* ───────────── 9 我好想你 好想你 / 却不露痕迹 ───────────── */
export function Chorus({ t, lt, v, L }: SP) {
  const calm = eIO(seg(t, ct(L + 9, 0), ct(L + 9, 4) + 0.5));
  const second = t > ct(L + 8, 4) - 0.2;
  const wipe = v === 2 ? eIO(seg(t, ct(L + 9, 0), ct(L + 9, 4) + 0.8)) : 0;
  return (
    <Cam z={lerp(-80, 50, eOut(seg(lt, 0, 6))) - calm * 60} rz={Math.sin(lt * 0.6) * 1.5}>
      <Bg kind="paper" />
      <Burst a={v === 1 ? '#f7c531' : '#3f7fd6'} b={v === 1 ? '#fbe38a' : '#7fb0ee'} rot={t * 9} o={v === 1 ? 1 - calm : 1} />
      {Array.from({ length: 16 }, (_, i) => {
        const at = ct(L + 8, i % 7) + 0.05;
        const a = (i / 16) * Math.PI * 2 + 0.3;
        const R = 430 + rnd(i, 3) * 160;
        const s = pop(t, at) * (1 - calm);
        const x = Math.cos(a) * R * 1.25;
        const y = Math.sin(a) * R * 0.62 + calm * 500;
        const z = -300 + rnd(i, 4) * 280;
        return i % 4 === 0 ? <Photo key={i} x={x} y={y} z={z} r={(rnd(i, 5) - 0.5) * 50} w={96} kind={i} s={s} /> : i % 4 === 1 ? (
          <P key={i} x={x} y={y} z={z} w={44} h={40} s={s} r={jit(t, i, 4)}><Heart size={44} color={['#ef6461', '#f49ac1'][i % 2]} /></P>
        ) : <Star key={i} x={x} y={y} z={z} s={s * 1.5} r={t * 30 + i * 40} color={['#4f9fe8', '#f49ac1', '#fff', '#b59cf2'][i % 4]} />;
      })}
      {/* 第二遍：拿白漆把它刷掉 */}
      {v === 2 && wipe > 0 && (
        <>
          <P x={lerp(-2300, 0, wipe)} z={-300} w={2600} h={1600} style={{ background: '#f1ece0', boxShadow: '10px 0 0 #fff' }} />
          <P x={lerp(-1000, 1300, wipe)} z={-290} w={44} h={1500} style={{ background: '#e9e2d0', borderRadius: 20, boxShadow: '4px 0 0 rgba(0,0,0,.15)' }} />
        </>
      )}
      {/* 喊出来的那一下之后，转过身去装没事 */}
      <Sprite who="whale" act={calm > 0.05 ? 'idle' : second ? 'wave' : 'sway'} t={t} x={440} y={325} z={-50} k={2.9} flip={calm > 0.3} />
      <Tag text="……" x={330} y={90} z={-20} r={-5} size={30} s={pop(t, ct(L + 9, 2)) * (1 - seg(t, ct(L + 9, 4) + 1.2, ct(L + 9, 4) + 1.6))} />
    </Cam>
  );
}

/* ───────────── 10 我还踮着脚思念 ───────────── */
export function Tiptoe({ t, lt, v, L }: SP) {
  const base = v === 2 ? 130 : 0;
  let hgt = base;
  const books = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const p = pop(t, ct(L + 10, i), 0.22);
    hgt += 30 * clamp(p);
    return { p, i };
  });
  // 她每垫高一本书，月亮和那张合照也跟着高一截：永远差那么一点够不着
  const GY = 250;
  const top = GY - hgt;
  const moonY = top - 455;
  return (
    <Cam y={-hgt * 0.9} z={lerp(40, -60, seg(lt, 0, 6))} ry={lerp(-5, 3, seg(lt, 0, 6))}>
      <Bg kind="night" />
      {stars(46, 12, 1, -450, t)}
      <Moon x={280} y={moonY} z={-220} size={300} />
      <P x={160} y={moonY + 105} z={-200} w={2} h={90} style={{ background: '#f1ece0' }} />
      <Photo x={160 + Math.sin(t * 1.4) * 5} y={moonY + 215} z={-195} r={Math.sin(t * 1.4) * 5} w={120} kind={2} />
      <P x={-120} y={moonY + 90} z={-300} w={260} h={90} style={{ background: 'repeating-linear-gradient(#cfd3e6 0 6px,#e9ecf7 6px 12px)', borderRadius: 40, opacity: 0.9 }} />
      {v === 2 && <P x={-150} y={GY - 65} z={-100} w={230} h={130} style={{ background: '#c9995a', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 3px, transparent 3px 12px)', boxShadow: '3px 5px 0 rgba(0,0,0,.25)' }} />}
      {books.map(({ p, i }) => (
        <P key={i} x={-150 + (rnd(i, 6) - 0.5) * 36} y={GY - base - 15 - i * 30 - (1 - clamp(p)) * 200} z={-100} w={170 + rnd(i, 7) * 50} h={30} r={(rnd(i, 8) - 0.5) * 5} s={clamp(p) > 0 ? 1 : 0} o={clamp(p * 3)} style={{ background: ['#ef6461', '#f6d54a', '#4f9fe8', '#6fcf8b', '#f59a3d', '#b59cf2', '#f7a8c8'][i], borderLeft: '10px solid rgba(0,0,0,.2)', boxShadow: '2px 3px 0 rgba(0,0,0,.25)' }} />
      ))}
      <Sprite who="whale" act="point" t={(t - ct(L + 10, 2)) * 0.8} x={-140} y={top - Math.abs(Math.sin(t * 6)) * 5} z={-95} k={2.5} />
    </Cam>
  );
}

/* ───────────── 11 我还任记忆盘旋 ───────────── */
export function Orbit({ t, lt, v, L }: SP) {
  const N = v === 1 ? 9 : 14;
  return (
    <Cam rx={12} z={lerp(-140, 20, eOut(seg(lt, 0, 6)))} y={-30}>
      <Bg kind={v === 1 ? 'purple' : 'ink'} />
      {v === 2 && stars(40, 5, 1, -450, t)}
      {[420, 560].map((R, k) => (v === 2 || k === 0) && <P key={k} y={60} w={R * 2} h={R * 2} rx={84} style={{ borderRadius: '50%', border: `3px solid ${['rgba(255,255,255,.35)', 'rgba(255,170,220,.4)'][k]}` }} />)}
      <P y={175} z={0} w={220} h={80} rx={84} style={{ borderRadius: '50%', background: 'rgba(0,0,0,.25)' }} />
      <Sprite who="whale" act="spin" t={t * 0.55} x={0} y={170} z={0} k={2.8} />
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2 + t * 0.85;
        const R = 420;
        return <Photo key={i} x={Math.cos(a) * R} y={40 + Math.sin(a * 2 + i) * 46} z={Math.sin(a) * R} r={Math.sin(t * 2 + i) * 10} w={120} kind={i} s={pop(t, ct(L + 11, i % 7) + (i >= 7 ? 0.15 : 0))} />;
      })}
      {v === 2 && Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - t * 0.6;
        return <Person key={i} x={Math.cos(a) * 560} y={60 + Math.sin(a * 3 + i) * 80} z={Math.sin(a) * 560} s={1.5} r={t * 50 + i * 30} color={['#5aa9e6', '#f59a3d', '#6fcf8b', '#f7a8c8', '#f6d54a'][i % 5]} />;
      })}
    </Cam>
  );
}

const tear = (key: number, x: number, y: number, z: number, o: number, s = 1) => (
  <P key={key} x={x} y={y} z={z} w={20} h={28} s={s} o={o} style={{ background: '#bfe6ff', border: '3px solid #fff', borderRadius: '50% 50% 50% 50% / 68% 68% 38% 38%' }} />
);

/* ───────────── 12 我还闭着眼流泪 ───────────── */
export function Tears({ t, lt, v, L }: SP) {
  const rise = eIO(seg(t, ct(L + 12, 2), ct(L + 12, 6) + 1.4));
  if (v === 2) {
    const bob = Math.sin(t * 1.6) * 8;
    return (
      <Cam z={lerp(-80, 60, seg(lt, 0, 6))} ry={lerp(4, -4, seg(lt, 0, 6))}>
        <Bg kind="night" />
        {stars(30, 3, 1, -450, t)}
        <Moon x={330} y={-170} z={-300} size={300} />
        <Wave y={150} z={-200} color="#2c4ea3" shift={Math.sin(t * 0.8) * 60} />
        <Sprite who="whale" act="sad" t={99} x={-40} y={235 + bob} z={-150} k={2.5} r={Math.sin(t * 1.6) * 4} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const u = seg(t, ct(L + 12, 2 + (i % 5)) + (i > 4 ? 0.3 : 0), ct(L + 12, 2 + (i % 5)) + 1.0);
          return tear(i, -40 + (i % 2 ? 26 : -26), 100 + bob + u * 90, -140, u > 0 ? 1 - u : 0, 0.7);
        })}
        <Wave y={210} z={-100} color="#3b63c4" shift={Math.sin(t * 1.1 + 1) * 80 - 40} />
        <Wave y={290} z={-20} color="#2a4a9c" shift={Math.sin(t * 0.9 + 2) * 70 + 30} />
        <Rain t={t} n={50} />
      </Cam>
    );
  }
  return (
    <Cam z={lerp(-140, 30, eOut(seg(lt, 0, 6)))}>
      <Bg kind="rain" />
      <Sprite who="whale" act="bigblink" t={t} x={0} y={372 + jit(t, 1, 1)} z={-120} k={4.3} />
      {Array.from({ length: 12 }, (_, i) => {
        const at = ct(L + 12, 2 + (i % 5)) + Math.floor(i / 5) * 0.35;
        const u = seg(t, at, at + 1.25);
        return tear(i, (i % 2 ? 62 : -62) + (rnd(i, 2) - 0.5) * 14, 20 + eIn(u) * 330, -100, u > 0 ? 1 - seg(u, 0.75, 1) : 0, 1.3);
      })}
      <Wave y={lerp(420, 190, rise)} z={-60} color="#2f58b5" shift={Math.sin(t * 0.8) * 70} />
      <Wave y={lerp(470, 240, rise)} z={-20} color="#4573cf" shift={Math.sin(t * 1.1 + 1) * 90 - 40} />
      <Wave y={lerp(520, 300, rise)} z={20} color="#27489b" shift={Math.sin(t * 0.9 + 2) * 70 + 30} />
      <Rain t={t} />
    </Cam>
  );
}

function MaskFace() {
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#fdfdfd', border: '4px solid #d8d8d8', boxShadow: '3px 5px 0 rgba(0,0,0,.25)' }}>
      {[52, 122].map((x) => <div key={x} style={{ position: 'absolute', left: x, top: 62, width: 40, height: 26, borderTop: '7px solid #333', borderRadius: '50% 50% 0 0' }} />)}
      <div style={{ position: 'absolute', left: 57, top: 108, width: 100, height: 52, background: '#e0483e', borderRadius: '0 0 60px 60px', borderTop: '6px solid #333' }} />
      {[30, 160].map((x) => <div key={x} style={{ position: 'absolute', left: x, top: 100, width: 26, height: 16, background: '#ffb3c7', borderRadius: '50%' }} />)}
    </div>
  );
}

/* ───────────── 13 我还装作无所谓 ───────────── */
export function Mask({ t, lt, v, L }: SP) {
  const on = eOut(seg(t, ct(L + 13, 2) - 0.25, ct(L + 13, 2) + 0.1));
  const crack = v === 2 ? seg(t, ct(L + 13, 5), ct(L + 13, 5) + 1.3) : 0;
  const tags: [string, number, number, number, string][] = [['OK', -400, -150, 3, '#f6d54a'], ['没事的', 370, -170, 4, '#f7a8c8'], ['哈哈', -380, 110, 6, '#fff'], ['哈哈哈', 400, 100, 6, '#6fcf8b']];
  return (
    <Cam z={lerp(-100, 40, eOut(seg(lt, 0, 5)))} rz={Math.sin(lt * 0.7) * 1.2}>
      {v === 1 ? <><Bg kind="paper" /><Burst a="#4fbf82" b="#9be3b6" rot={-t * 9} /></> : <Bg kind="night" />}
      {v === 2 && Array.from({ length: 14 }, (_, i) => {
        const x = -620 + i * 96;
        const len = 120 + rnd(i, 3) * 260;
        const sw = Math.sin(t * 1.2 + i) * 4;
        return (
          <React.Fragment key={i}>
            <P x={x + sw / 2} y={-360 + len / 2} z={-300} w={2} h={len} r={-sw * 0.3} style={{ background: 'rgba(255,255,255,.5)' }} />
            {i % 3 === 0 ? <P x={x + sw} y={-360 + len} z={-300} w={30} h={27}><Heart size={30} color="#ef6461" /></P> : <Star x={x + sw} y={-360 + len} z={-300} s={1.2} color={['#ffe27a', '#f49ac1', '#7df9ff'][i % 3]} />}
          </React.Fragment>
        );
      })}
      <Sprite who="whale" act={crack > 0.3 ? 'bigblink' : 'big'} t={t} x={0} y={380} z={-120} k={3.9} />
      {crack > 0.3 && [0, 1, 2, 3].map((i) => {
        const u = (t * 0.9 + i * 0.25) % 1;
        return tear(i, i % 2 ? 56 : -56, 20 + eIn(u) * 260, -100, 1 - u, 1.2);
      })}
      {/* 笑脸面具；第二遍唱到「无所谓」时裂开 */}
      {[-1, 1].map((s) => (
        <P key={s} x={s * crack * 150} y={lerp(420, -22, on) + crack * crack * 520 + Math.sin(t * 3) * 3} z={-80} w={214} h={214} r={s * crack * 70 + Math.sin(t * 2) * 2} style={{ clipPath: s < 0 ? 'polygon(0 0,52% 0,44% 30%,55% 55%,47% 100%,0 100%)' : 'polygon(52% 0,100% 0,100% 100%,47% 100%,55% 55%,44% 30%)' }}>
          <MaskFace />
        </P>
      ))}
      {tags.map(([text, x, y, ci, bg], i) => (
        <Tag key={i} text={text} x={x} y={y + crack * crack * 700} z={-40 + i * 10} r={(i % 2 ? 8 : -8) + jit(t, i, 2) + crack * 60 * (i % 2 ? 1 : -1)} size={46} bg={bg} s={pop(t, ct(L + 13, ci) + (i === 3 ? 0.3 : 0))} />
      ))}
    </Cam>
  );
}

/* ───────────── 14 我好想你 好想你 / 却欺骗自己 ───────────── */
export function Mirror({ t, lt, v, L }: SP) {
  const tl = L + 15;
  const lie = seg(t, ct(tl, 0), ct(tl, 4) + 0.6);
  // 第一遍：镜子里一会儿是她、一会儿是自己，最后裂开；第二遍：慢慢只剩自己
  let self = 0;
  if (v === 1) self = t > ct(tl, 4) ? 1 : t > ct(tl, 3) ? 0 : t > ct(tl, 1) ? 1 : 0;
  else self = eIO(lie);
  const crack = v === 1 ? seg(t, ct(tl, 4) + 0.15, ct(tl, 4) + 0.5) : 0;
  return (
    <Cam z={lerp(-80, 40, eOut(seg(lt, 0, 8))) + crack * 60} ry={lerp(6, -3, seg(lt, 0, 11))}>
      <Bg kind="stripes" />
      <P x={-250} y={-20} z={-260} w={330} h={440} style={{ borderRadius: '50%', background: 'linear-gradient(135deg,#f3c868,#b9822c)', boxShadow: '5px 8px 0 rgba(0,0,0,.25)' }} />
      <P x={-250} y={-20} z={-255} w={270} h={380} style={{ borderRadius: '50%', background: 'linear-gradient(160deg,#eef6ff,#bcd3ee)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 135, top: 372 + Math.sin(t * 2) * 3, opacity: 1 - self }}><Mini who="claude" k={2.9} /></div>
        <div style={{ position: 'absolute', left: 135, top: 372, opacity: self }}><Mini who="whale" k={2.9} flip gray={v === 2 ? 0.6 : 0} frame="whale_blink" /></div>
        <div style={{ position: 'absolute', left: 40, top: -40, width: 50, height: 500, background: 'rgba(255,255,255,.35)', transform: 'rotate(22deg)' }} />
        {crack > 0 && [20, 75, 130, 170, -40].map((a, i) => <div key={i} style={{ position: 'absolute', left: 135, top: 170, width: 260 * crack, height: 3, background: '#fff', boxShadow: '0 1px 0 #7a8aa8', transformOrigin: '0 50%', transform: `rotate(${a + i * 31}deg)` }} />)}
      </P>
      {[0, 1, 2, 3, 4].map((i) => <P key={i} x={-520 + rnd(i, 4) * 1000} y={-300 + rnd(i, 5) * 160} z={-300 + i * 30} w={36} h={32} r={Math.sin(t * 3 + i) * 20} s={pop(t, ct(L + 14, i))}><Heart size={36} color={['#f59a3d', '#f7a8c8', '#f6d54a'][i % 3]} /></P>)}
      <Sprite who="whale" act={lie > 0.5 && v === 2 ? 'sad' : lie > 0 ? 'idle' : 'wave'} t={lie > 0.5 ? t - ct(tl, 2) : t} x={190} y={330} z={-70} k={2.9} flip />
    </Cam>
  );
}
