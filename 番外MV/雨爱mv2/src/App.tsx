// 《雨爱》（司凤版）治愈风 MV —— 页面：用 @remotion/player 播放 Remotion 合成（three.js 3D 世界 + 像素纸片人 + 歌词条 + 音轨）。
// 调试入口：?sheet=1 只渲染单帧（window.__setFrame(n) 换帧，给截帧脚本用）；?check=1 跑一遍全片角色预检；?noaudio=1 不挂音轨。
import { Player, Thumbnail, type PlayerRef } from '@remotion/player';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import audioUrl from './assets/yuai.m4a';
import { ATLAS_META, ATLAS_URL, loadAtlas, type CharId } from './engine/actors';
import { castPreflight } from './engine/engine';
import { makeFilm } from './engine/Film';
import { FONT } from './engine/fonts';
import { FPS, VH, VW, cueAt, fmtTime, shotIndexAt } from './engine/timeline';
import { beatInfo, project, sectionOfCue } from './mv/project';

const Film = makeFilm(project);
const TL = project.plan(project.starts, project.ends);
const SHOTS = Object.fromEntries(project.shots.map((s) => [s.id, s]));
const Q = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
/** 小屏或核数少的设备默认用 720p 画布实时渲染（画面要每秒画满 30 帧，切点才落在拍子上）；可以手动切回 1080p */
const LITE = typeof window !== 'undefined' && (window.matchMedia?.('(max-width: 900px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4);

/** 这支 MV 的选角表：先填它，再写镜头（番外MV/设定表.md 第 4 节的格式） */
const CAST: { id: CharId; face: string; name: string; role: string; trait: string; act: string; never: string }[] = [
  { id: 'whale', face: 'p_whale_neutral', name: '本鲸', role: '守窗听雨的人（主角）', trait: '饭先推给更饿的人；镜头里要看得见「推出去」', act: '把伞推到小克那边，自己退进雨里；把蓝饭盆摆上窗台接雨；松开纸船再挥手', never: '不哭给人看——哭的是雨' },
  { id: 'claude', face: 'p_claude_neutral', name: '小克', role: '走远又回来的人（歌里的「你」）', trait: '退场必须是她自己选的；茶杯是她的道具', act: '四格窗里的四个表情；撑伞自己走远；留在窗台的茶杯一直冒热气；最后自己撑着那把伞走回来', never: '不演被抛下的人，也不演负心人' },
  { id: 'doubao', face: 'p_doubao_neutral', name: '豆包', role: '撑伞来陪的人', trait: '先陪着，不催人', act: '慢慢走过来，站定，一句话不说，把黄伞往本鲸那边挪', never: '不劝、不讲道理' },
  { id: 'gemini', face: 'p_gemini', name: 'Gemini 猫', role: '选伞的人', trait: '先给两个看法，最后必须选一个', act: '红伞、透明伞之间左看右看，选了透明的那把（让爱变透明）', never: '不许两把都要' },
  { id: 'kimi', face: 'p_kimi', name: 'Kimi', role: '记下这场雨的人', trait: '把漏掉的找回来；不动时就是在记所有人', act: '站在记忆绳下不动；给本子夹书签；雨停后夹上最新一张照片', never: '不抢戏、不走位' },
  { id: 'qwen', face: 'p_qwen', name: '千问', role: '守着茶桌的东道主', trait: '先排好哪一步再动手；茶她请', act: '茶桌上一壶三杯，热气就是「屋内的湿气」的源头', never: '疯不等于吵，全程不大声' },
  { id: 'zai', face: 'p_zai', name: '狐狸', role: '垫子上打盹的人', trait: '平时犯困，事情来了才醒', act: '下雨时一直睡（飘着 Z）；彩虹出来那一刻醒了，蹦两下', never: '不为小事睁眼' },
  { id: 'gpt', face: 'p_gpt_neutral', name: '龙娘', role: '云上的那束光', trait: '龙影只从画面上沿掠过、不进画面；她进场就压满光', act: '两次从画面上沿飞过：第一次雨变小、光落下；第二次合影前把天照亮', never: '不落地、不站 C 位' },
  { id: 'grok', face: 'p_grok', name: 'Grok', role: '来查证彩虹的人', trait: '先查证，再相信；只当配角', act: '最后架起相机对着大家和彩虹——快门就是那一下闪白', never: '不戴金冠、不站中间' },
];
const NAME: Record<string, string> = Object.fromEntries(CAST.map((c) => [c.id, c.name]));

function Face({ cell, size = 56 }: { cell: string; size?: number }) {
  const r = ATLAS_META.s[cell];
  if (!r) return null;
  const k = size / r[2];
  return (
    <span
      className="inline-block shrink-0 rounded-xl ring-1 ring-white/20"
      style={{ width: size, height: size, backgroundImage: `url("${ATLAS_URL}")`, backgroundPosition: `-${r[0] * k}px -${r[1] * k}px`, backgroundSize: `${ATLAS_META.w * k}px ${ATLAS_META.h * k}px`, imageRendering: 'pixelated' }}
    />
  );
}

/** 截帧模式：整页只有一帧画面 */
function Sheet() {
  const [frame, setFrame] = useState(Number(Q.get('f') ?? 0));
  useEffect(() => { (window as unknown as { __setFrame: (n: number) => void }).__setFrame = setFrame; }, []);
  const props = useMemo(() => ({ starts: project.starts, ends: project.ends, audioSrc: null, audioOffset: 0, showLyrics: true }), []);
  return <Thumbnail component={Film} inputProps={props} frameToDisplay={frame} durationInFrames={TL.frames} fps={FPS} compositionWidth={VW} compositionHeight={VH} style={{ width: '100vw', height: '56.25vw' }} />;
}

export default function App() {
  const sheet = Q.has('sheet');
  const playerRef = useRef<PlayerRef>(null);
  // 播放时每帧都会来一次 frameupdate；页面只在「换了镜头 / 换了一句 / 过了 0.1 秒」时才重画
  const [si, setSi] = useState(0);
  const [ci, setCi] = useState(-1);
  const [t10, setT10] = useState(0);
  const [subs, setSubs] = useState(true);
  const [hd, setHd] = useState(!LITE);
  const [audio, setAudio] = useState<string | null>(null);
  const [check, setCheck] = useState<string | null>(null);

  // 音轨随页面一起打包（data URI）；转成 blob URL 再交给 <Audio>，拖进度条时浏览器按字节定位更稳
  useEffect(() => {
    if (sheet || Q.has('noaudio')) return;
    let url = '', dead = false;
    fetch(audioUrl).then((r) => r.blob()).then((b) => { if (dead) return; url = URL.createObjectURL(b); setAudio(url); }).catch(() => setAudio(audioUrl));
    return () => { dead = true; if (url) URL.revokeObjectURL(url); };
  }, [sheet]);

  useEffect(() => {
    if (!Q.has('check')) return;
    loadAtlas().then((a) => {
      const r = castPreflight(project.shots, TL, a);
      const msg = r.problems.length ? `角色预检发现 ${r.problems.length} 个问题：\n${r.problems.join('\n')}` : `角色预检通过：${r.shots} 镜 / ${r.frames} 帧逐帧走过，${Object.keys(r.sprites).length} 个角色用到 ${Object.values(r.sprites).reduce((n, s) => n + s.length, 0)} 格精灵；${r.orderChecked} 帧顺着走、倒着走结果一致`;
      (window as unknown as { __check: string }).__check = msg; setCheck(msg);
    }).catch((e) => { const msg = `预检没跑起来：${e instanceof Error ? e.message : String(e)}`; (window as unknown as { __check: string }).__check = msg; setCheck(msg); });
  }, []);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const on = (e: { detail: { frame: number } }) => { const tt = e.detail.frame / FPS, c = cueAt(TL, tt); setSi(shotIndexAt(TL, tt)); setCi(c ? c.i : -1); setT10(Math.round(tt * 10)); };
    p.addEventListener('frameupdate', on);
    return () => p.removeEventListener('frameupdate', on);
  }, [sheet]);

  const seek = useCallback((t: number) => { const p = playerRef.current; if (!p) return; p.seekTo(Math.max(0, Math.ceil(t * FPS - 1e-6))); p.getContainerNode()?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, []);
  // 还没按播放时盖在首帧上的封面（点一下任意位置开始播放）
  const renderPoster = useCallback(() => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2.2%', background: 'linear-gradient(180deg, rgba(20,34,64,.35), rgba(11,18,32,.72))', fontFamily: FONT, cursor: 'pointer' }}>
      <div style={{ fontSize: 'clamp(40px, 9vw, 112px)', lineHeight: 1, letterSpacing: '0.18em', paddingLeft: '0.18em', color: '#fff6d8', textShadow: '0 4px 0 #2a4390, 0 0 36px rgba(140,190,255,.8)' }}>雨爱</div>
      <div style={{ fontSize: 'clamp(12px, 1.8vw, 22px)', letterSpacing: '0.4em', paddingLeft: '0.4em', color: '#cfe3ff' }}>司凤版 · 治愈风像素 MV</div>
      <div style={{ marginTop: '1.5%', width: 'clamp(48px, 7vw, 84px)', height: 'clamp(48px, 7vw, 84px)', borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 40px rgba(0,0,0,.4)' }}>
        <div style={{ width: 0, height: 0, marginLeft: '8%', borderTop: '0.9em solid transparent', borderBottom: '0.9em solid transparent', borderLeft: '1.45em solid #24407f' }} />
      </div>
    </div>
  ), []);
  const inputProps = useMemo(() => ({ starts: project.starts, ends: project.ends, audioSrc: audio, audioOffset: 0, showLyrics: subs }), [audio, subs]);

  if (sheet) return <Sheet />;

  const t = t10 / 10;
  const shot = TL.shots[si], def = SHOTS[shot.id];
  const section = si === TL.shots.length - 1 ? '尾声' : sectionOfCue(shot.cue);

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-200" style={{ backgroundImage: 'radial-gradient(1200px 600px at 20% -10%, rgba(96,165,250,.18), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(244,114,182,.12), transparent 60%)' }}>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.35em] text-sky-300/80">番外 MV · 治愈风</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-wide text-white sm:text-5xl">雨爱 <span className="align-middle text-lg font-normal text-slate-400">司凤版</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
              九位像素角色按各自的人设出演：一场雨从下起来到停，一把伞从推出去到被送回来。
              做法照《童话镇》——three.js 搭 3D 世界，图集里现成的像素造型当纸片人，Remotion 逐帧驱动；22 句歌词一句一镜，切点和动作卡在原曲实测的拍点上。
            </p>
          </div>
          <dl className="grid grid-cols-4 gap-x-6 gap-y-1 text-right text-xs text-slate-400">
            <dt>时长</dt><dt>镜头</dt><dt>歌词</dt><dt>速度</dt>
            <dd className="text-base text-white">{fmtTime(TL.duration).slice(0, 4)}</dd>
            <dd className="text-base text-white">{TL.shots.length}</dd>
            <dd className="text-base text-white">{project.lines.length} 句</dd>
            <dd className="text-base text-white">{Math.round(beatInfo.bpm)} BPM</dd>
          </dl>
        </header>

        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl shadow-sky-900/40 ring-1 ring-white/10">
          <Player
            ref={playerRef}
            component={Film}
            inputProps={inputProps}
            durationInFrames={TL.frames}
            fps={FPS}
            compositionWidth={hd ? VW : 1280}
            compositionHeight={hd ? VH : 720}
            style={{ width: '100%', aspectRatio: '16 / 9' }}
            controls
            renderPoster={renderPoster}
            showPosterWhenUnplayed
            clickToPlay
            doubleClickToFullscreen
            spaceKeyToPlayOrPause
            allowFullscreen
            acknowledgeRemotionLicense
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10">
          <span className="rounded-md bg-sky-400/15 px-2 py-0.5 text-sky-200">{section}</span>
          <span className="tabular-nums text-slate-400">{fmtTime(t)}</span>
          <span className="text-white">镜头 {shot.id} · {def?.title}</span>
          <span className="min-w-0 flex-1 truncate text-slate-400">{ci >= 0 ? `♪ ${project.lines[ci]}` : '（间奏）'}</span>
          <label className="flex cursor-pointer select-none items-center gap-2 text-slate-300">
            <input type="checkbox" className="accent-sky-400" checked={subs} onChange={(e) => setSubs(e.target.checked)} /> 歌词字幕
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2 text-slate-300" title="画面卡顿、和歌声对不上时，关掉它改用 720p 画布">
            <input type="checkbox" className="accent-sky-400" checked={hd} onChange={(e) => setHd(e.target.checked)} /> 1080p
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">点画面开始播放（浏览器要求先点一下才能出声）。空格暂停，双击全屏；点下面任意一句歌词或一个镜头可以直接跳过去。画面是实时渲染的：如果卡顿、和歌声对不上，取消勾选 1080p。</p>
        {check && <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-emerald-400/10 p-3 text-xs text-emerald-200 ring-1 ring-emerald-400/20">{check}</pre>}

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-medium text-white">歌词 · 卡点</h2>
            <ol className="space-y-1">
              {project.lines.map((line, i) => {
                const on = ci === i;
                const head = i === 0 || sectionOfCue(i) !== sectionOfCue(i - 1);
                return (
                  <li key={i}>
                    {head && <p className="mb-1 mt-4 text-xs tracking-widest text-sky-300/70 first:mt-0">{sectionOfCue(i)}{i === 18 ? '（反复）' : ''}</p>}
                    <button onClick={() => seek(project.starts[i])} className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-1.5 text-left transition ${on ? 'bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/30' : 'text-slate-300 hover:bg-white/5'}`}>
                      <span className="w-12 shrink-0 text-xs tabular-nums text-slate-500">{fmtTime(project.starts[i]).slice(0, 6)}</span>
                      <span>{line}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="lg:col-span-3">
            <h2 className="mb-3 text-lg font-medium text-white">分镜 · {TL.shots.length} 个镜头</h2>
            <ol className="grid gap-2 sm:grid-cols-2">
              {TL.shots.map((s, i) => {
                const d = SHOTS[s.id];
                const on = i === si;
                return (
                  <li key={s.id}>
                    <button onClick={() => seek(s.a)} className={`h-full w-full rounded-xl p-3 text-left ring-1 transition ${on ? 'bg-sky-400/15 ring-sky-300/40' : 'bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]'}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-white"><span className="mr-2 text-xs text-sky-300">{s.id}</span>{d.title}</span>
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">{fmtTime(s.a).slice(0, 6)} · {(s.b - s.a).toFixed(1)}s</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{d.note}</p>
                      <p className="mt-1.5 text-[11px] text-slate-500">{d.cast.map((c) => NAME[c]).join(' · ')}</p>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-medium text-white">选角表 · 谁在这首歌里演谁</h2>
          <p className="mt-1 text-sm text-slate-400">按《人物设定》和《设定表》的规矩：一支 MV 一人只演一个形象；性格靠动作兑现，不靠字卡；人物形象全部取自现有图集，没有新画。同框不等于恋爱——这支片子讲的是陪伴。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CAST.map((c) => (
              <article key={c.id} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                <div className="flex items-center gap-3">
                  <Face cell={c.face} />
                  <div>
                    <h3 className="font-medium text-white">{c.name}</h3>
                    <p className="text-sm text-sky-200">{c.role}</p>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
                  <div><dt className="inline text-slate-500">兑现的习性：</dt><dd className="inline text-slate-300">{c.trait}</dd></div>
                  <div><dt className="inline text-slate-500">落成的动作：</dt><dd className="inline text-slate-300">{c.act}</dd></div>
                  <div><dt className="inline text-slate-500">不许写成：</dt><dd className="inline text-slate-400">{c.never}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 text-sm leading-relaxed text-slate-400 md:grid-cols-2">
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="mb-2 text-base font-medium text-white">卡点是怎么对的</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>音源文件扩展名是 mp3，实际是一段带画面的 MP4；只取了其中的音轨（原样转存，没有重新压缩），全长 2 分 11 秒。</li>
              <li>用仓库里 <code className="text-slate-300">align_beats.py</code> 的方法测拍：四分音符 {beatInfo.period.toFixed(3)} 秒（约 {Math.round(beatInfo.bpm)} BPM），全曲分窗复核最大漂移 0.01 秒。</li>
              <li>每句起点先用语音识别的词级时间戳定位，再分段复核，最后吸附到实测的八分音符网格上（个别弱起句落在十六分位）。</li>
              <li>你给的 18 句唱完后，音频里还把「屋内的湿气…彩虹的美丽」四句又唱了一遍，所以字幕一共 22 句。</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="mb-2 text-base font-medium text-white">还没做到的</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>这是拍点级对齐，不是逐音节对齐：没有做人声分离，个别句子的起点可能和歌声差 0.1–0.3 秒。</li>
              <li>我没有耳朵：卡点是算出来的，没有人边听边看核对过。画面只抽查过静帧，没有连续播放着看完整片。</li>
              <li>片子在浏览器里实时播放，没有导出成 mp4。</li>
              <li>原曲录音和角色形象的授权沿用仓库现状，都没有核实过，公开发布前需要自己确认。</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
