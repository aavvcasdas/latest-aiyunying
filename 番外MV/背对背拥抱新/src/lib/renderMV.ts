import { characterTiming, getChapter, getCue, type CaptionMode, type LyricCue, type Motif, type SceneName } from '../data/mv';
import actionData from '../data/actions.json';

export interface RenderOptions {
  captions: boolean;
  mode: CaptionMode;
  motion: boolean;
  offset: number;
}

export type ImageAssets = Record<string, CanvasImageSource>;
type Action = { frames: string[]; fps: number; loop: boolean; size: number[] };
const actions = actionData as unknown as Record<string, Record<string, Action>>;
export const defaultOptions: RenderOptions = { captions: true, mode: 'character', motion: true, offset: 0 };
export const assetNames = [
  'scene-letters', 'scene-twilight', 'scene-rain', 'scene-sunrise',
  'whale_idle', 'claude_front_0', 'claude_side_0',
  ...Object.values(actions).flatMap((character) => Object.values(character).flatMap((action) => action.frames)),
];

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

function drawBackground(ctx: CanvasRenderingContext2D, assets: ImageAssets, scene: SceneName, time: number, motion: boolean) {
  const image = assets[`scene-${scene}`];
  if (!image) return;
  const zoom = motion ? 1.035 + Math.sin(time * 0.075) * 0.012 : 1.035;
  const pan = motion ? Math.sin(time * 0.06) * 9 : 0;
  ctx.drawImage(image, -(1280 * (zoom - 1)) / 2 + pan, -(720 * (zoom - 1)) / 2, 1280 * zoom, 720 * zoom);
}

function paperHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, healed: boolean, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#fff3dd';
  ctx.fillStyle = healed ? '#f5c4c5' : '#ecd4e2';
  ctx.beginPath();
  ctx.moveTo(0, 0.7);
  ctx.bezierCurveTo(-1.55, -0.2, -0.75, -1.5, 0, -0.65);
  ctx.bezierCurveTo(0.75, -1.5, 1.55, -0.2, 0, 0.7);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = healed ? '#ffeeb7' : '#a899bd';
  ctx.lineWidth = healed ? 0.045 : 0.025;
  ctx.beginPath(); ctx.moveTo(0, -0.65); ctx.lineTo(-0.14, -0.2); ctx.lineTo(0.12, 0.1); ctx.lineTo(0, 0.7); ctx.stroke();
  ctx.restore();
}

function drawAtmosphere(ctx: CanvasRenderingContext2D, time: number, scene: SceneName, motif: Motif, motion: boolean) {
  const t = motion ? time : 48;
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const x = ((i * 163.7 + t * (4 + i % 3)) % 1340) - 30;
    const y = 85 + ((i * 71.3 + Math.sin(t * 0.4 + i) * 22) % 520);
    ctx.globalAlpha = 0.25 + (Math.sin(t * 1.3 + i) + 1) * 0.24;
    ctx.fillStyle = scene === 'rain' ? '#f1e4ff' : '#fff9d7';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(x, y, 1.7 + i % 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  if (motif === 'silence') {
    for (let i = 0; i < 32; i++) {
      const x = (i * 71.1 + t * 20) % 1300;
      const y = (i * 37.3 + t * 105) % 610;
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#f9f3ff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14); ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.3 + i / 3) % 1;
      ctx.globalAlpha = (1 - phase) * 0.35;
      ctx.strokeStyle = '#fff8ed'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(640, 530, 80 + phase * 260, 10 + phase * 38, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (['letters', 'pages', 'embers'].includes(motif)) {
    for (let i = 0; i < 7; i++) {
      const x = 280 + i * 123 + Math.sin(t * 0.5 + i) * 28;
      const y = 260 + Math.sin(t * 0.6 + i * 1.5) * 110;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.4 + i) * 0.3);
      ctx.globalAlpha = 0.68;
      ctx.fillStyle = motif === 'embers' ? '#ffc99e' : '#fff7df';
      ctx.shadowColor = '#8c78934d'; ctx.shadowBlur = 8;
      ctx.fillRect(-17, -11, 34, 23);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#c6abac'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-17, -11); ctx.lineTo(0, 2); ctx.lineTo(17, -11); ctx.stroke();
      ctx.restore();
    }
  }
  if (['circles', 'ribbon', 'time'].includes(motif)) {
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.28 - i * 0.055;
      ctx.lineWidth = 5 - i;
      ctx.strokeStyle = '#fff1e1';
      ctx.beginPath(); ctx.ellipse(640, 370, 160 + i * 55, 100 + i * 28, Math.sin(t * 0.3) * 0.15 + i * 0.2, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawActor(ctx: CanvasRenderingContext2D, assets: ImageAssets, character: string, action: string, time: number, x: number, feet: number, height: number, flip = false, side = false) {
  const animation = actions[character]?.[action] ?? actions[character]?.idle;
  const frame = animation?.frames[Math.floor(time * (animation?.fps ?? 8)) % (animation?.frames.length ?? 1)];
  const key = side ? 'claude_side_0' : frame;
  const image = assets[key] ?? assets[character === 'whale' ? 'whale_idle' : 'claude_front_0'];
  if (!image) return;
  const dimensions = image as { width?: number; height?: number };
  const width = height * ((dimensions.width ?? 84) / (dimensions.height ?? 90));
  ctx.save();
  ctx.fillStyle = '#7461842b';
  ctx.beginPath(); ctx.ellipse(x, feet + 4, width * 0.34, height * 0.048, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(x, feet);
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = '#fff7ec'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;
  ctx.drawImage(image, -width / 2, -height, width, height);
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, cue: LyricCue | undefined, time: number, mode: CaptionMode) {
  if (!cue) return;
  const text = cue.text;
  const size = text.length > 10 ? 52 : text.length > 8 ? 59 : 67;
  const spacing = size * 1.13;
  const total = (text.length - 1) * spacing;
  const entrance = smooth((time - cue.start) / 0.32);
  const exit = clamp((cue.end - time) / 0.2);
  let wordStart = 0;
  const starts = cue.words.flatMap((word) => {
    const start = wordStart;
    wordStart += word.length;
    return Array(word.length).fill(start) as number[];
  });
  ctx.save();
  ctx.globalAlpha = Math.min(entrance, exit);
  ctx.font = `${size}px "ZCOOL KuaiLe"`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const y = 606 + (1 - entrance) * 16;
  for (let i = 0; i < text.length; i++) {
    const onset = characterTiming(cue, mode === 'word' ? starts[i] : i);
    const isSung = mode === 'line' || time >= onset;
    const pulse = mode === 'line' ? 0 : Math.max(0, 1 - (time - onset) / 0.32);
    const lift = isSung ? Math.sin(clamp(pulse) * Math.PI) * 7 : 0;
    const x = 640 - total / 2 + i * spacing;
    ctx.save(); ctx.translate(x, y - lift);
    ctx.transform(1, (i - text.length / 2) * 0.002, -0.04, 1, 0, 0);
    ctx.shadowColor = '#725e833b'; ctx.shadowBlur = 13; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#9b83ae';
    ctx.fillText(text[i], 5, 8);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    for (let d = 6; d > 0; d--) {
      ctx.fillStyle = '#b59bc2'; ctx.fillText(text[i], d * 0.55, d);
    }
    ctx.strokeStyle = '#fff6ee'; ctx.lineWidth = 2.5; ctx.strokeText(text[i], 0, 0);
    ctx.fillStyle = isSung ? '#fff9e7' : '#ece2f2'; ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

export function renderMV(ctx: CanvasRenderingContext2D, assets: ImageAssets, time: number, options: RenderOptions = defaultOptions) {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.scale(width / 1280, height / 720);
  ctx.clearRect(0, 0, 1280, 720);
  const chapter = getChapter(time);
  const cue = getCue(time - options.offset);
  const motif = cue?.motif ?? (time > 209 ? 'heart' : 'letters');
  let scene = chapter.scene;
  if (chapter.id === 4 && time < 97) scene = 'letters';
  if (chapter.id === 4 && time >= 128.75) scene = 'twilight';
  drawBackground(ctx, assets, scene, time, options.motion);

  // A shared, deterministic time drives the camera, actors, and lyric depth.
  const t = options.motion ? time : Math.floor(time);
  const sceneProgress = cue ? clamp((time - cue.start) / (cue.end - cue.start)) : 0.5;
  const healed = time >= 148.5;
  let separation = healed ? 92 : 138;
  if (motif === 'apart') separation = 210 + smooth(sceneProgress) * 105;
  if (motif === 'letters' || motif === 'pages') separation = 245;
  if (motif === 'walk') separation = 240 - smooth((time - 148.5) / 12) * 145;
  if (motif === 'reach') separation = healed ? 104 - smooth(sceneProgress) * 30 : 175;
  if (motif === 'embrace') separation = healed ? 83 : 128;
  const center = 640 + (options.motion ? Math.sin(time * 0.19) * 10 : 0);
  const feet = 527;
  const breathe = options.motion ? Math.sin(time * 2) * 1.5 : 0;
  const actionA = motif === 'reach' || motif === 'walk' ? 'point' : motif === 'apart' || motif === 'silence' ? 'sad' : 'idle';
  const actionB = motif === 'pages' ? 'read' : motif === 'apart' || motif === 'silence' ? 'sad' : healed ? 'nod' : 'idle';

  drawAtmosphere(ctx, time, scene, motif, options.motion);
  if (motif === 'embrace' || motif === 'heart' || time > 209) {
    paperHeart(ctx, 640, 275 + (options.motion ? Math.sin(time * 1.3) * 5 : 0), 27, healed, 0.86);
  }
  drawActor(ctx, assets, 'whale', actionA, t, center - separation / 2, feet + breathe, 208, !healed);
  drawActor(ctx, assets, 'claude', actionB, t, center + separation / 2, feet - breathe, 211, false, motif === 'embrace' && !healed);

  if (options.captions) {
    drawCaption(ctx, cue, time - options.offset, options.mode);
    if (!cue && time < 12) {
      ctx.save();
      ctx.textAlign = 'center'; ctx.font = '71px "ZCOOL KuaiLe"';
      ctx.shadowColor = '#826d83aa'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#fff9ed'; ctx.fillText('背对背拥抱', 640, 225);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.font = '14px sans-serif'; ctx.fillStyle = '#fff8ec';
      ctx.fillText('A LITTLE STORY ABOUT GETTING CLOSER', 640, 268);
      ctx.restore();
    }
    if (time >= 211) {
      ctx.save(); ctx.globalAlpha = smooth((time - 211) / 3);
      ctx.font = '44px "ZCOOL KuaiLe"'; ctx.textAlign = 'center';
      ctx.shadowColor = '#a38d7a77'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
      ctx.fillStyle = '#fff9e9'; ctx.fillText('这一次，别再放开。', 640, 610); ctx.restore();
    }
  }
  if (time > 232) {
    ctx.fillStyle = `rgba(250, 243, 235, ${clamp((time - 232) / 3.08)})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
  ctx.restore();
}