export const FPS = 30;
export const DURATION = 131.2667;
export const TOTAL_FRAMES = 3938;
export const INITIAL_FRAME = 486;
export const AUDIO_SRC = '/audio/rain-love.m4a';

export type Lyric = { id: number; text: string; start: number; end: number };
export type Scene = {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  from: number;
  to: number;
  color: string;
  mood: string;
  direction: string;
};
export type VideoSettings = {
  showSubtitles: boolean;
  subtitleStyle: 'clean' | 'soft';
  fontSize: number;
  palette: 'original' | 'warm' | 'dream';
  particles: boolean;
};
export type Project = {
  title: string;
  lyrics: Lyric[];
  scenes: Scene[];
  settings: VideoSettings;
};

export const DEFAULT_LYRICS: Lyric[] = [
  { id: 1, text: '窗外的天气', start: 15.34, end: 20.02 },
  { id: 2, text: '就像是你多变的表情', start: 20.02, end: 25.55 },
  { id: 3, text: '下雨了 雨陪我哭泣', start: 26.34, end: 31.5 },
  { id: 4, text: '看不清 我也不想看清', start: 32.54, end: 37.8 },
  { id: 5, text: '离开你 我安静的抽离', start: 38.28, end: 42.26 },
  { id: 6, text: '不忍揭晓的剧情', start: 42.26, end: 44.86 },
  { id: 7, text: '我的泪流在心里', start: 44.86, end: 47.82 },
  { id: 8, text: '学会放弃', start: 47.82, end: 50.08 },
  { id: 9, text: '听雨的声音 一滴滴清晰', start: 50.08, end: 53.64 },
  { id: 10, text: '你的呼吸像雨滴渗入我的爱里', start: 53.64, end: 58.62 },
  { id: 11, text: '真希望雨能下不停', start: 58.62, end: 62.6 },
  { id: 12, text: '让想念继续 让爱变透明', start: 62.6, end: 68.68 },
  { id: 13, text: '我爱上给我勇气的 Rainie love', start: 68.68, end: 74.04 },
  { id: 14, text: '窗外的雨滴 一滴滴累积', start: 74.64, end: 77.44 },
  { id: 15, text: '屋内的湿气像储存爱你的记忆', start: 77.44, end: 82.28 },
  { id: 16, text: '真希望雨能下不停', start: 82.28, end: 85.92 },
  { id: 17, text: '雨爱的秘密能一直延续', start: 85.92, end: 92.2 },
  { id: 18, text: '我相信我将会看到彩虹的美丽', start: 92.2, end: 98.9 },
  { id: 19, text: '窗外的雨滴 一滴滴累积', start: 99.16, end: 101.56 },
  { id: 20, text: '屋内的湿气像储存爱你的记忆', start: 101.56, end: 106.28 },
  { id: 21, text: '真希望雨能下不停', start: 106.9, end: 109.58 },
  { id: 22, text: '雨爱的秘密能一直延续', start: 109.58, end: 115.56 },
  { id: 23, text: '我相信我将会看到彩虹的美丽', start: 115.56, end: 123.8 },
];

export const DEFAULT_SCENES: Scene[] = [
  {
    id: 1, title: '窗边听雨', subtitle: '把心事，轻轻说给雨听',
    image: '/images/rain-window.png', from: 0, to: 38.28,
    color: '#e4ece7', mood: '安静 · 想念',
    direction: '镜头缓缓推近雨窗，小小的白色精灵静静望向窗外。雨滴顺着玻璃滑落，暖光包裹孤独，让悲伤也变得柔软。',
  },
  {
    id: 2, title: '雨中的拥抱', subtitle: '每一滴雨，都是你的回音',
    image: '/images/rain-umbrella.png', from: 38.28, to: 62.6,
    color: '#e3eaf2', mood: '倾听 · 释怀',
    direction: '跟随歌声走进细雨，透明的小伞挡住风雨。镜头轻轻横移，水面涟漪随歌词亮起，雨不再只是眼泪，也是温柔的陪伴。',
  },
  {
    id: 3, title: '收藏想念', subtitle: '让爱，住进一朵云里',
    image: '/images/cloud-memory.png', from: 62.6, to: 92.2,
    color: '#eee5f2', mood: '温柔 · 勇气',
    direction: '雨滴化作透明的记忆，精灵坐在柔软的云端，怀抱微亮的爱心。镜头随云缓缓浮动，淡紫与粉色讲述被珍藏的想念。',
  },
  {
    id: 4, title: '终于，遇见彩虹', subtitle: '雨会停，美好会发生',
    image: '/images/rainbow-garden.png', from: 92.2, to: DURATION,
    color: '#f4ecdf', mood: '希望 · 新生',
    direction: '在“彩虹”唱起时，画面从云端转向晴朗的山丘。镜头慢慢拉远，完整的彩虹舒展开来，让雨后的光落在小精灵身上。',
  },
];

export const DEFAULT_SETTINGS: VideoSettings = {
  showSubtitles: true, subtitleStyle: 'clean', fontSize: 48,
  palette: 'original', particles: true,
};

export const DEFAULT_PROJECT: Project = {
  title: '雨爱', lyrics: DEFAULT_LYRICS, scenes: DEFAULT_SCENES, settings: DEFAULT_SETTINGS,
};

export function formatTime(seconds: number, precise = false) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}${precise ? `.${Math.floor((Math.max(0, seconds) % 1) * 10)}` : ''}`;
}

export function currentLyric(lyrics: Lyric[], seconds: number) {
  return lyrics.findIndex((line) => seconds >= line.start && seconds < line.end);
}

export function getScene(scenes: Scene[], seconds: number) {
  return scenes.find((scene) => seconds >= scene.from && seconds < scene.to) ?? scenes[scenes.length - 1];
}

// Visual reprises follow the repeated chorus rather than stretching one still to the end.
export function buildShots(project: Project): Scene[] {
  const visualOrder = [0, 0, 0, 0, 1, 1, 2, 1, 1, 1, 1, 2, 2, 0, 0, 1, 2, 3, 0, 0, 1, 2, 3];
  const shots: Scene[] = [{ ...project.scenes[0], from: 0, to: DURATION }];
  project.lyrics.forEach((line, index) => {
    const next = project.scenes[visualOrder[index] ?? 3];
    if (next.id !== shots[shots.length - 1].id) {
      shots[shots.length - 1].to = line.start;
      shots.push({ ...next, from: line.start, to: DURATION });
    }
  });
  return shots;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function makeSrt(lyrics: Lyric[]) {
  const stamp = (s: number) => {
    const ms = Math.round(s * 1000);
    return `${String(Math.floor(ms / 3_600_000)).padStart(2, '0')}:${String(Math.floor(ms / 60_000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  return lyrics.map((line, i) => `${i + 1}\n${stamp(line.start)} --> ${stamp(line.end)}\n${line.text}\n`).join('\n');
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const project = value as Project;
  if (typeof project.title !== 'string' || !project.title.trim() || project.title.length > 14) return false;
  if (!Array.isArray(project.lyrics) || project.lyrics.length !== DEFAULT_LYRICS.length) return false;
  if (project.lyrics.some((line, index) => line.id !== index + 1 || typeof line.text !== 'string' || !line.text.trim() || !Number.isFinite(line.start) || !Number.isFinite(line.end) || line.start < 0 || line.end <= line.start || line.end > DURATION || (index > 0 && line.start < project.lyrics[index - 1].end))) return false;
  if (!Array.isArray(project.scenes) || project.scenes.length !== 4) return false;
  if (project.scenes.some((scene, index) => scene.id !== index + 1 || scene.image !== DEFAULT_SCENES[index].image || typeof scene.title !== 'string' || typeof scene.subtitle !== 'string' || typeof scene.direction !== 'string' || scene.from !== DEFAULT_SCENES[index].from || scene.to !== DEFAULT_SCENES[index].to)) return false;
  const settings = project.settings;
  return !!settings && typeof settings.showSubtitles === 'boolean' && typeof settings.particles === 'boolean'
    && ['clean', 'soft'].includes(settings.subtitleStyle) && ['original', 'warm', 'dream'].includes(settings.palette)
    && Number.isFinite(settings.fontSize) && settings.fontSize >= 34 && settings.fontSize <= 68;
}

export function loadProject(): Project {
  try {
    const raw = localStorage.getItem('rainfilm-project-v2');
    if (!raw) return DEFAULT_PROJECT;
    const saved: unknown = JSON.parse(raw);
    return isProject(saved) ? saved : DEFAULT_PROJECT;
  } catch {
    return DEFAULT_PROJECT;
  }
}