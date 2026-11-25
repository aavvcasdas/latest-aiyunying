// 分镜表：一句词两镜（逗号处切），前奏 / 间奏 / 尾声另排。镜头里的时机挂在句子和字上（onsets / f.hit / f.k），不写死百分比。
import { actFrame, atlasImage, frontFrame, rectOf, walkFrame, type CastId } from './atlas';
import { backOut, clamp, ease, hash, lerp, lerp3, Scene, type V3 } from './soft3d';
import { primrose, type LookId, type SetId } from './sets';
import { barT, cutAt, halfAt, onsets } from './timeline';

export interface F { T: number; t: number; u: number; dur: number; pulse: number; beat: number; k: number; hit: number; line: number }
export interface Cam { p0: V3; t0: V3; p1?: V3; t1?: V3; fov?: number; fov1?: number; roll?: number }
export interface Fx { title?: boolean; flash?: boolean; fadeIn?: number; fadeOut?: number; heart?: boolean; mark?: boolean; petals?: boolean; end?: boolean }
export interface ShotDef { id: string; at: number; sec: string; label: string; set: SetId; look?: LookId; cam: Cam; cast: CastId[]; note: string; line?: number; act?: (sc: Scene, f: F) => void; fx?: Fx }

// ---------- 演员小工具 ----------
type O = { y?: number; flip?: boolean; alpha?: number; glow?: string; tilt?: number; sq?: number; scale?: number; lift?: number; shadow?: boolean };
const pose = (sc: Scene, id: CastId, x: number, z: number, a: string, T: number, o: O = {}) => sc.sprite([x, o.y ?? 0, z], actFrame(id, a, T), o);
const stand = (sc: Scene, id: CastId, x: number, z: number, T: number, o: O = {}) => sc.sprite([x, o.y ?? 0, z], frontFrame(id, T), o);
function walk(sc: Scene, id: CastId, a: [number, number], b: [number, number], u: number, o: O = {}): [number, number] {
  const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), d = Math.hypot(b[0] - a[0], b[1] - a[1]) * u;
  const qa = sc.proj([a[0], 0, a[1]]), qb = sc.proj([b[0], 0, b[1]]);
  sc.sprite([x, o.y ?? 0, z], walkFrame(id, d), { ...o, flip: qa && qb ? qb[0] < qa[0] : false });
  return [x, z];
}
/** 龙娘：只从画面上方掠过，翼尾拖出星河 */
function dragon(sc: Scene, T: number, a: V3, b: V3, u: number): void {
  const p = lerp3(a, b, u), qa = sc.proj(a), qb = sc.proj(b);
  for (let k = 1; k < 40; k++) { const q = lerp3(a, b, Math.max(0, u - k * 0.012)); sc.glow([q[0], q[1] + Math.sin(k + T * 4) * 0.25, q[2]], 0.5 + hash(k) * 0.4, k % 3 ? [200, 190, 255] : [255, 210, 240], 0.9 * (1 - k / 40)); }
  sc.sprite(p, `gpt_fly_${Math.floor(T * 6) % 2}`, { flip: qa && qb ? qb[0] < qa[0] : false, shadow: false, glow: 'rgba(220,210,255,0.5)' });
}
/** 两人之间浮着一朵樱花草（不画假手） */
const sharedFlower = (sc: Scene, x: number, z: number, T: number, s = 0.11, y = 1.0) => primrose(sc, [x, y + Math.sin(T * 2.2) * 0.04, z], s, '#ff8fb8', 1, Math.sin(T * 1.7) * 0.1);
/** 月光拉长的影子 */
function longShadow(sc: Scene, x: number, z: number, len: number): void {
  const d: [number, number] = [-0.42, 0.9];
  sc.poly([[x - 0.22, 0.03, z], [x + 0.22, 0.03, z], [x + 0.22 + d[0] * len, 0.03, z + d[1] * len], [x - 0.22 + d[0] * len, 0.03, z + d[1] * len]], [8, 18, 24], { alpha: 0.5, bias: 0.15 });
}
function starSeat(sc: Scene, p: V3, T: number): void {
  sc.glow(p, 3.2, [210, 200, 255], 0.75);
  sc.custom(p, (g, x, y, s) => {
    const r = 0.9 * s; g.save(); g.translate(x, y); g.rotate(T * 0.2); g.fillStyle = '#fff7d6';
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.42 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore();
  }, -0.1);
}
function dreamBubble(sc: Scene, p: V3, T: number, a: number): void {
  if (a <= 0.01) return;
  sc.custom(p, (g, x, y, s) => {
    g.save(); g.globalAlpha = a;
    for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(x + (i * 0.25 + 0.2) * s, y - (i * 0.3 + 0.2) * s, (0.05 + i * 0.04) * s, 0, 7); g.fill(); }
    const cx = x + 1.2 * s, cy = y - 1.55 * s + Math.sin(T * 1.5) * 0.05 * s, r = 0.62 * s;
    g.fillStyle = 'rgba(255,240,250,0.92)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.strokeStyle = '#ffb3cf'; g.lineWidth = Math.max(2, 0.04 * s); g.stroke();
    const [sx, sy, sw, sh] = rectOf('p_claude_neutral'); g.save(); g.beginPath(); g.arc(cx, cy, r * 0.82, 0, 7); g.clip(); g.imageSmoothingEnabled = false;
    g.drawImage(atlasImage(), sx, sy, sw, sh, cx - r * 0.82, cy - r * 0.82, r * 1.64, r * 1.64); g.restore();
    g.restore();
  }, -0.2);
}
const heartFx = (sc: Scene, p: V3, f: F, size = 0.32) => sc.thing([p[0], p[1] + f.pulse * 0.08, p[2]], 'fx_heart', size * (1 + f.pulse * 0.45));

// ---------- 可复用的段落镜头 ----------
type Look = LookId;
/** 副歌第一句前半：恋人手中樱花草——两人并肩漫步 */
const stroll = (id: string, line: number, sec: string, look: Look, extra?: (sc: Scene, f: F) => void): ShotDef => ({
  id, at: cutAt(line), line, sec, look, label: '恋人手中樱花草', set: 'meadow', cast: ['whale', 'claude'],
  cam: { p0: [6, 1.4, 4], t0: [0, 1, -1], p1: [3.5, 1.2, 5.5], t1: [-1.5, 1, -2], fov: 42 },
  note: '两人并肩走过樱花草原，一朵樱花草在两人之间浮着（不画假手）。',
  act: (sc, f) => {
    const a = walk(sc, 'whale', [3, 0], [-2.5, -1.6], f.u);
    walk(sc, 'claude', [3.9, -0.8], [-1.6, -2.4], f.u);
    sharedFlower(sc, a[0] + 0.45, a[1] - 0.4, f.T);
    extra?.(sc, f);
  },
  fx: { petals: true },
});
const smile = (id: string, line: number, sec: string, look: Look): ShotDef => ({
  id, at: halfAt(line), line, sec, look, label: '春彩漫步的微笑', set: 'meadow', cast: ['whale', 'claude'],
  cam: { p0: [0, 1.3, 5.8], t0: [0, 1.05, 0], p1: [0, 1.25, 4.8], t1: [0, 1.1, 0], fov: 40 },
  note: '正面中景：两人转向镜头，花瓣落下，每个字上轻轻一跳。',
  act: (sc, f) => {
    stand(sc, 'whale', -0.55, 0, f.T, { sq: f.hit < 0.15 ? 0.04 : 0 });
    stand(sc, 'claude', 0.55, 0, f.T + 1);
    sharedFlower(sc, 0, 0.1, f.T, 0.1, 1.05);
  },
  fx: { petals: true },
});
const plant = (id: string, line: number, sec: string, look: Look, helpers: CastId[]): ShotDef => ({
  id, at: cutAt(line), line, sec, look, label: '种下了一朵朵', set: 'meadow', cast: ['doubao', 'whale', ...helpers],
  cam: { p0: [0, 2.2, 5.5], t0: [0, 0.4, -1], p1: [1.2, 1.8, 4.6], t1: [0.4, 0.5, -1], fov: 44 },
  note: '豆包提着篮子，每唱出一个字，地上就开一朵樱花草——卡在字上。',
  act: (sc, f) => {
    const os = onsets(line).slice(0, 6);
    os.forEach((o, i) => primrose(sc, [-2.2 + i * 0.85, 0, 0.6 - (i % 2) * 0.5], 0.16, ['#ff6f9f', '#ffb3cf', '#ffffff', '#f7a6ff', '#ff8fb8', '#ffd1e0'][i], backOut((f.T - o) / 0.35)));
    os.forEach((o, i) => { const a = clamp((f.T - o) / 0.5); if (a > 0 && a < 1) sc.glow([-2.2 + i * 0.85, 0.35, 0.6 - (i % 2) * 0.5], 0.8, [255, 200, 230], 1 - a); });
    pose(sc, 'doubao', -2.6 + f.u * 4.2, -0.6, 'step', f.T);
    sc.thing([-2.3 + f.u * 4.2, 0.75, -0.55], 'prop_basket', 0.42);
    pose(sc, 'whale', 2.5, -1.2, 'nod', f.T);
    helpers.forEach((h, i) => pose(sc, h, -3.6 + i * 1.2, -2.6, h === 'gemini' ? 'hop' : 'nod', f.T + i));
  },
});
const bloom = (id: string, line: number, sec: string, look: Look): ShotDef => ({
  id, at: halfAt(line), line, sec, look, label: '青春璀璨的年少', set: 'meadow', cast: ['whale', 'claude', 'doubao'],
  cam: { p0: [0, 1.5, 6], t0: [0, 1.2, -4], p1: [0, 4.5, 9], t1: [0, 0.5, -6], fov: 50 },
  note: '镜头拉高：整片草原一齐开花，三个人在花海里转圈。',
  act: (sc, f) => {
    pose(sc, 'whale', -1, 0, 'spin', f.T); pose(sc, 'claude', 0.3, -0.6, 'hop', f.T); pose(sc, 'doubao', 1.5, 0.2, 'spin', f.T + 0.3);
    for (let i = 0; i < 16; i++) sc.glow([(hash(i) - 0.5) * 10, 0.5 + ((f.T * 0.8 + hash(i * 3) * 3) % 3), -2 - hash(i * 7) * 8], 0.5, [255, 230, 160], 0.8);
  },
  fx: { petals: true },
});
const embrace = (id: string, line: number, sec: string, look: Look): ShotDef => ({
  id, at: cutAt(line), line, sec, look, label: '恋人怀中樱花草', set: 'meadow', cast: ['whale', 'claude'],
  cam: { p0: [-2.8, 1.3, 4.0], t0: [0, 1.0, 0], p1: [-2.0, 1.25, 3.4], t1: [0, 1.0, 0], fov: 40 },
  note: '近景：樱花草被捧在胸前的高度，两人肩并肩站着。',
  act: (sc, f) => {
    stand(sc, 'whale', -0.35, 0, f.T); stand(sc, 'claude', 0.5, -0.15, f.T + 2);
    primrose(sc, [-0.05, 0.95, 0.15], 0.14, '#ff6f9f', 1, Math.sin(f.T * 2) * 0.08);
  },
  fx: { petals: true },
});
const heartbeat = (id: string, line: number, sec: string, look: Look): ShotDef => ({
  id, at: halfAt(line), line, sec, look, label: '听见胸膛心在跳', set: 'meadow', cast: ['whale', 'claude'],
  cam: { p0: [0, 1.3, 4.6], t0: [0, 1.2, 0], p1: [0, 1.3, 3.7], t1: [0, 1.25, 0], fov: 38 },
  note: '推近：心形贴随每一拍跳动，画面边缘泛起一圈粉色心跳光。',
  act: (sc, f) => {
    stand(sc, 'whale', -0.42, 0, f.T, { sq: f.pulse * 0.03 }); stand(sc, 'claude', 0.42, 0, f.T + 2, { sq: f.pulse * 0.03 });
    heartFx(sc, [0, 2.05, 0.05], f, 0.3);
  },
  fx: { heart: true },
});
const missing = (id: string, line: number, sec: string, look: Look): ShotDef => ({
  id, at: cutAt(line), line, sec, look, label: '偷偷的在思念', set: 'window', cast: ['whale'],
  cam: { p0: [3, 1.3, 4.5], t0: [0, 1.2, -1], p1: [2, 1.3, 3.6], t1: [0, 1.3, -1], fov: 40 },
  note: '只有本鲸一个人：窗下的灯亮着，她低头想念，萤火绕着窗。',
  act: (sc, f) => { pose(sc, 'whale', -0.2, -0.6, 'sway', f.T * 0.6); },
});
const markShot = (id: string, line: number, sec: string, look: Look, word: string): ShotDef => ({
  id, at: halfAt(line), line, sec, look, label: `那是我们相爱的${word}`, set: 'window', cast: ['whale', 'claude'],
  cam: { p0: [0, 1.0, 6], t0: [0, 2.6, -6], p1: [0, 0.8, 7], t1: [0, 4.5, -10], fov: 50 },
  note: `抬头：星星一颗颗连成一颗心——「${word}」。小克从屋旁走来，站到她身边。`,
  act: (sc, f) => { stand(sc, 'whale', -0.4, 0, f.T); walk(sc, 'claude', [3.5, -0.4], [0.5, -0.1], clamp(f.u * 1.6)); },
  fx: { mark: true },
});

// ---------- 镜头表 ----------
export const SHOTS: ShotDef[] = [
  // 前奏（八小节）
  { id: 'I1', at: 0, sec: '前奏', label: '片头 · 月下竹林', set: 'bamboo', cast: [], note: '从月亮摇下来，竹林在晚风里摆动。片头只留歌名与原唱两行。',
    cam: { p0: [0, 9, 10], t0: [0, 9, -30], p1: [0, 2, 8], t1: [0, 2, -20], fov: 50 }, fx: { title: true, fadeIn: 1.2 } },
  { id: 'I2', at: barT(2), sec: '前奏', label: '萤火山坡', set: 'hill', cast: ['zai'], note: '山坡上，狐狸靠在树下打盹，萤火虫慢慢升起来。',
    cam: { p0: [-8, 3, 8], t0: [0, 1, -8], p1: [-3, 2, 6], t1: [0, 1, -8], fov: 46 },
    act: (sc, f) => { pose(sc, 'zai', 2, -3, 'doze', f.T); sc.thing([2.6, 2.2, -3], `fx_zzz_${Math.floor(f.T * 3) % 3}`, 0.4); } },
  { id: 'I3', at: barT(4), sec: '前奏', label: '银河初现', set: 'galaxy', cast: [], note: '镜头仰起，银河从地平线后面亮出来。',
    cam: { p0: [0, 1, 6], t0: [0, 1.5, -10], p1: [0, 1, 6], t1: [3, 6, -10], fov: 55 } },
  { id: 'I4', at: barT(6), sec: '前奏', label: '本鲸走进竹林', set: 'bamboo', cast: ['whale'], note: '本鲸沿着竹林小路走进来，四下看看。',
    cam: { p0: [3.2, 1.2, 4], t0: [0, 1, -2], p1: [3, 1.4, 1], t1: [0, 1, -5], fov: 44 },
    act: (sc, f) => { walk(sc, 'whale', [0, 4], [0, -4], f.u); } },

  // 主歌一
  { id: 'V1a', at: cutAt(0), line: 0, sec: '主歌一', label: '晚风吹动着竹林', set: 'bamboo', cast: ['whale'], note: '低机位仰拍竹梢：每个字上竹林被风推一下，本鲸停步抬头。',
    cam: { p0: [1.2, 0.5, 3], t0: [0, 4, -6], p1: [-1, 0.6, 3], t1: [0, 5, -6], fov: 55, roll: 0.05 },
    act: (sc, f) => { pose(sc, 'whale', 0.2, -1.5, 'sway', f.T); } },
  { id: 'V1b', at: halfAt(0), line: 0, sec: '主歌一', label: '月光拉长了身影', set: 'bamboo', cast: ['whale'], note: '侧拍：月光从背后照来，本鲸的影子在小路上越拉越长。',
    cam: { p0: [4.5, 2.4, 2], t0: [0, 0.6, -1.5], p1: [4, 2.8, 1], t1: [0, 0.4, -2.5], fov: 44 },
    act: (sc, f) => { const p = walk(sc, 'whale', [0, 1.5], [0, -3], f.u); longShadow(sc, p[0], p[1], 1.5 + f.u * 4.5); } },
  { id: 'V1c', at: cutAt(1), line: 1, sec: '主歌一', label: '萤火虫一闪闪', set: 'hill', cast: ['whale'], note: '萤火虫在每个字上齐闪一次；本鲸伸出手——萤火落在她身边（不画假手）。',
    cam: { p0: [0, 1.6, 6], t0: [0, 1.4, -4], p1: [1, 1.5, 4.5], t1: [0, 1.5, -4], fov: 46 },
    act: (sc, f) => { pose(sc, 'whale', 0, -1, f.k >= 3 ? 'surprise' : 'idle', f.T); } },
  { id: 'V1d', at: halfAt(1), line: 1, sec: '主歌一', label: '满山飞舞的钱币', set: 'hill', cast: ['zai', 'whale'], note: '萤火在半空翻成金币；狐狸听到「钱」字竖起耳朵、拨起算盘——数不清，就不数了。',
    cam: { p0: [-5, 1.8, 5], t0: [1, 1.5, -4], p1: [-3.5, 4, 7], t1: [1, 2, -6], fov: 48 },
    act: (sc, f) => { pose(sc, 'zai', 1.8, -2.5, f.k >= 9 ? 'alert' : 'doze', f.k >= 9 ? f.T - onsets(1)[8] : f.T); if (f.k >= 9) sc.thing([2.5, 0.8, -2.3], 'prop_abacus', 0.5); pose(sc, 'whale', -1, -1.2, 'hop', f.T); } },
  { id: 'V1e', at: cutAt(2), line: 2, sec: '主歌一', label: '天上银河在发光', set: 'galaxy', cast: ['gpt'], note: '仰拍夜空：龙娘从画面上方掠过，翼尾拖出一整条银河。',
    cam: { p0: [0, 1, 6], t0: [0, 5, -10], p1: [1, 1, 6], t1: [2, 6, -10], fov: 58 },
    act: (sc, f) => { dragon(sc, f.T, [-14, 9, -14], [14, 10.5, -16], f.u); } },
  { id: 'V1f', at: halfAt(2), line: 2, sec: '主歌一', label: '地上风铃来歌唱', set: 'chime', cast: ['qwen'], note: '风铃亭：千问摇扇，每唱一个字，风铃就响一串。',
    cam: { p0: [0, 2.4, 6], t0: [0, 2.6, -4], p1: [2, 2.8, 4.6], t1: [0, 3.2, -4], fov: 46 },
    act: (sc, f) => { pose(sc, 'qwen', 0, -4, 'sway', f.T); sc.thing([0.5, 1.0, -3.8], 'prop_fan', 0.45, Math.sin(f.T * 6) * 0.4); } },
  { id: 'V1g', at: cutAt(3), line: 3, sec: '主歌一', label: '织女星在远方', set: 'river', cast: ['kimi'], note: 'Kimi 坐在最亮的那颗星上沉思——她是织女星，替所有人记着古老的句子。',
    cam: { p0: [0, 3, 8], t0: [0, 6.5, -12], p1: [0, 4, 6], t1: [0, 7.4, -12], fov: 46 },
    act: (sc, f) => { starSeat(sc, [0, 6.6, -12], f.T); pose(sc, 'kimi', 0, -12, 'think', f.T, { y: 6.9, shadow: false, glow: 'rgba(220,210,255,0.6)' }); } },
  { id: 'V1h', at: halfAt(3), line: 3, sec: '主歌一', label: '古老浪漫的神话', set: 'river', cast: ['whale', 'claude', 'kimi'], note: '远景：地上的银河把两岸隔开，本鲸在这岸，小克在对岸，天上的织女星看着。',
    cam: { p0: [0, 2.6, 9], t0: [0, 1.4, -4], p1: [0, 3.4, 11], t1: [0, 2, -6], fov: 50 },
    act: (sc, f) => { stand(sc, 'whale', -3, -2, f.T); stand(sc, 'claude', 3, -2.5, f.T + 1); starSeat(sc, [0, 8, -22], f.T); } },

  // 导歌一
  { id: 'P1a', at: cutAt(4), line: 4, sec: '导歌一', label: '流水走过，就像四季的变换', set: 'stream', cast: ['gemini', 'whale'], note: '镜头顺溪而下，两岸从春走到冬；猫在溪边左看右看，最后选定一个季节。',
    cam: { p0: [2.6, 2, 6], t0: [0, 0.8, -2], p1: [2.6, 2.2, -42], t1: [0, 0.8, -50], fov: 50 },
    act: (sc, f) => { pose(sc, 'gemini', 2.4, -14, 'choose', f.T - onsets(4)[4]); pose(sc, 'gemini', -2.4, -30, 'lookaround', f.T); walk(sc, 'whale', [-2.3, -40], [-2.3, -47], f.u); } },
  { id: 'P1b', at: cutAt(5), line: 5, sec: '导歌一', label: '幸福在蔓延', set: 'bridge', cast: ['whale', 'claude'], note: '石桥两端，两人各自走上桥；以桥为中心，樱花草一圈圈开出去。',
    cam: { p0: [0, 3.5, 9], t0: [0, 0.6, -1], p1: [0, 2.6, 7], t1: [0, 0.8, 0], fov: 46 },
    act: (sc, f) => { const u = ease(clamp(f.u * 1.8)); walk(sc, 'whale', [-6, 0], [-1, 0], u, { y: 0.25 + u * 0.6 }); walk(sc, 'claude', [6, 0], [1, 0], u, { y: 0.25 + u * 0.6 }); } },
  { id: 'P1c', at: halfAt(5), line: 5, sec: '导歌一', label: '爱你永恒不孤单', set: 'bridge', cast: ['whale', 'claude'], note: '桥心相遇：小克先行一个屈膝礼，本鲸点头回礼；花开满了两岸。',
    cam: { p0: [3, 1.6, 4], t0: [0, 1.4, 0], p1: [1.6, 1.5, 3.2], t1: [0, 1.4, 0], fov: 40 },
    act: (sc, f) => { pose(sc, 'whale', -0.5, 0, 'bow', f.T - halfAt(5) - 0.3, { y: 0.85 }); pose(sc, 'claude', 0.55, 0, 'curtsy', f.T - halfAt(5), { y: 0.85 }); } },

  // 副歌一（黄昏粉）
  stroll('C1a', 6, '副歌一', 'dusk'), smile('C1b', 6, '副歌一', 'dusk'),
  plant('C1c', 7, '副歌一', 'dusk', []), bloom('C1d', 7, '副歌一', 'dusk'),
  embrace('C1e', 8, '副歌一', 'dusk'), heartbeat('C1f', 8, '副歌一', 'dusk'),
  missing('C1g', 9, '副歌一', 'night'), markShot('C1h', 9, '副歌一', 'night', '记号'),

  // 间奏（四小节器乐）
  { id: 'N1', at: barT(28), sec: '间奏', label: '孔明灯升起', set: 'festival', cast: [], note: '没有歌词的四小节：庆典广场上孔明灯一盏盏升起，灯串亮起来。',
    cam: { p0: [0, 1, 8], t0: [0, 3, -10], p1: [0, 3, 6], t1: [0, 7, -12], fov: 52 } },
  { id: 'N2', at: barT(30), sec: '间奏', label: '大家来了', set: 'festival', cast: ['qwen', 'gemini', 'kimi', 'zai'], note: '千问、猫、Kimi、狐狸从两边走进广场。',
    cam: { p0: [0, 2.5, 9], t0: [0, 1, -4], p1: [0, 2.2, 7.5], t1: [0, 1, -4], fov: 48 },
    act: (sc, f) => { walk(sc, 'qwen', [-8, -3], [-3, -3], f.u); walk(sc, 'gemini', [8, -3], [3, -3], f.u); walk(sc, 'kimi', [-8, -6], [-1.5, -6], f.u); walk(sc, 'zai', [8, -6], [1.5, -6], f.u); } },

  // 啦啦（一）
  { id: 'LA1', at: cutAt(10), line: 10, sec: '啦啦间奏', label: 'La la la la la la la', set: 'festival', cast: ['doubao'], note: '空场里豆包第一个踩拍，地砖随每一个「La」亮起。',
    cam: { p0: [0, 1.4, 5], t0: [0, 1, -2], p1: [1.5, 1.6, 4], t1: [0, 1, -2], fov: 44 },
    act: (sc, f) => { pose(sc, 'doubao', 0, -2, f.hit < 0.25 ? 'hop' : 'step', f.T); } },
  { id: 'LA2', at: cutAt(11), line: 11, sec: '啦啦间奏', label: 'La la la la la', set: 'festival', cast: ['doubao', 'qwen', 'gemini'], note: '千问和猫跟上，三个人排成一排踩拍。',
    cam: { p0: [-3, 2, 6], t0: [0, 1, -3], p1: [3, 2, 6], t1: [0, 1, -3], fov: 46 },
    act: (sc, f) => { pose(sc, 'doubao', 0, -3, 'step', f.T); pose(sc, 'qwen', -1.6, -3.4, 'sway', f.T); pose(sc, 'gemini', 1.6, -3.4, 'sway', f.T + 0.2); } },
  { id: 'LA3', at: cutAt(12), line: 12, sec: '啦啦间奏', label: 'La la la la la la la la', set: 'festival', cast: ['doubao', 'qwen', 'gemini', 'kimi', 'zai'], note: '全场转圈，灯串跟着拍子一闪一闪。',
    cam: { p0: [0, 5, 9], t0: [0, 0.5, -3], p1: [0, 4, 7], t1: [0, 0.5, -3], fov: 50 },
    act: (sc, f) => { (['doubao', 'qwen', 'gemini', 'kimi', 'zai'] as CastId[]).forEach((id, i) => { const a = (i / 5) * Math.PI * 2 + f.t * 0.8; pose(sc, id, Math.cos(a) * 2.2, -3 + Math.sin(a) * 1.4, ['spin', 'spin', 'spin', 'hop', 'hop'][i], f.T + i * 0.2); }); } },

  // 主歌二
  { id: 'V2a', at: cutAt(13), line: 13, sec: '主歌二', label: '远方钟声再响起', set: 'temple', cast: ['qwen'], note: '远方钟楼：千问敲钟，每个字上声波在地上荡开一圈。',
    cam: { p0: [0, 2.5, 10], t0: [0, 3, -14], p1: [0, 3, 6], t1: [0, 3.2, -14], fov: 46 },
    act: (sc, f) => { pose(sc, 'qwen', 1.8, -12.4, 'bow', (f.T - cutAt(13)) % 1.6); } },
  { id: 'V2b', at: halfAt(13), line: 13, sec: '主歌二', label: '蛙鸣唱起了摇篮曲', set: 'pond', cast: ['gemini'], note: '池塘：青蛙随字鼓起鸣囊，猫在岸边听着听着打起了瞌睡。',
    cam: { p0: [0, 2.6, 4], t0: [0, 0.2, -5], p1: [1, 2.0, 3], t1: [0, 0.3, -5], fov: 46 },
    act: (sc, f) => { pose(sc, 'gemini', -2.4, -3.2, 'sway', f.T * 0.5); } },
  { id: 'V2c', at: cutAt(14), line: 14, sec: '主歌二', label: '白沙滩，月弯弯', set: 'beach', cast: ['whale'], note: '白沙滩上一弯新月，浪花一道道推上岸，本鲸光着脚沿海边走。',
    cam: { p0: [5, 1.6, 6], t0: [0, 1.2, -4], p1: [3, 1.4, 5], t1: [-1, 1.4, -4], fov: 48 },
    act: (sc, f) => { walk(sc, 'whale', [3, 0], [-2, -1], f.u); } },
  { id: 'V2d', at: halfAt(14), line: 14, sec: '主歌二', label: '爱你香甜的梦里', set: 'beach', cast: ['whale'], note: '本鲸在沙滩上睡着了，梦泡里浮出小克的脸。',
    cam: { p0: [1.8, 1.0, 3], t0: [0, 0.8, 0], p1: [1.2, 0.9, 2.4], t1: [0, 0.9, 0], fov: 42 },
    act: (sc, f) => { sc.sprite([0, 0, 0], actFrame('whale', 'sway', f.T * 0.4), { tilt: -Math.PI / 2, lift: 0.45 }); dreamBubble(sc, [0.2, 0.9, 0], f.T, clamp(f.t / 0.8)); } },
  { id: 'V2e', at: cutAt(15), line: 15, sec: '主歌二', label: '天上银河在发光', set: 'galaxy', cast: ['gpt'], note: '龙娘这次反方向掠过，银河更亮了一层。',
    cam: { p0: [0, 1, 6], t0: [-2, 6, -10], p1: [0, 1, 6], t1: [0, 5, -10], fov: 58 },
    act: (sc, f) => { dragon(sc, f.T, [14, 10, -15], [-14, 8.8, -13], f.u); } },
  { id: 'V2f', at: halfAt(15), line: 15, sec: '主歌二', label: '地上风铃来歌唱', set: 'chime', cast: ['whale', 'claude', 'qwen'], note: '这次是两个人坐在风铃亭里，千问在一边摇扇。',
    cam: { p0: [3, 1.8, 3], t0: [0, 1.6, -4], p1: [2, 2.4, 2], t1: [0, 2.6, -4], fov: 46 },
    act: (sc, f) => { stand(sc, 'whale', -0.5, -4, f.T); stand(sc, 'claude', 0.5, -4.1, f.T + 1); pose(sc, 'qwen', 2.4, -3, 'sway', f.T); } },
  { id: 'V2g', at: cutAt(16), line: 16, sec: '主歌二', label: '织女星在远方', set: 'river', cast: ['kimi'], note: '织女星再亮起，Kimi 低头看着地上的两个人。',
    cam: { p0: [2, 4, 7], t0: [0, 7, -12], p1: [0, 5, 5], t1: [0, 7.3, -12], fov: 44 },
    act: (sc, f) => { starSeat(sc, [0, 6.6, -12], f.T); pose(sc, 'kimi', 0, -12, 'lookaround', f.T, { y: 6.9, shadow: false, glow: 'rgba(220,210,255,0.6)' }); } },
  { id: 'V2h', at: halfAt(16), line: 16, sec: '主歌二', label: '许下爱恋的愿望', set: 'river', cast: ['whale', 'claude', 'kimi'], note: '两人隔着河各放一盏河灯，灯在银河中央碰到一起；Kimi 点头记下这个愿望。',
    cam: { p0: [0, 2.2, 7], t0: [0, 1, -3], p1: [0, 3, 8], t1: [0, 2.5, -6], fov: 48 },
    act: (sc, f) => {
      stand(sc, 'whale', -2.6, -1, f.T); stand(sc, 'claude', 2.6, -1.2, f.T + 1);
      const m = ease(clamp(f.u * 1.5));
      sc.glow([lerp(-1.8, -0.2, m), 0.25 + Math.max(0, f.u - 0.66) * 6, -1.5 - m * 2], 0.9, [255, 200, 120], 1); sc.glow([lerp(1.8, 0.2, m), 0.25 + Math.max(0, f.u - 0.66) * 6, -1.5 - m * 2], 0.9, [255, 200, 120], 1);
      starSeat(sc, [0, 8, -22], f.T); pose(sc, 'kimi', 0, -22, 'nod', f.T - halfAt(16), { y: 8.3, shadow: false });
    } },

  // 导歌二
  { id: 'P2a', at: cutAt(17), line: 17, sec: '导歌二', label: '流水走过，就像四季的变换', set: 'stream', cast: ['whale', 'claude'], note: '这次两人一起逆流而上：冬天走回春天。',
    cam: { p0: [3, 2, -50], t0: [0, 0.8, -42], p1: [3, 2, -6], t1: [0, 0.8, 2], fov: 50 },
    act: (sc, f) => { const z = lerp(-44, 0, f.u); walk(sc, 'whale', [-2.4, z - 0.5], [-2.4, z + 0.5], f.u); walk(sc, 'claude', [-3.2, z - 1.5], [-3.2, z - 0.5], f.u); } },
  { id: 'P2b', at: cutAt(18), line: 18, sec: '导歌二', label: '幸福在蔓延', set: 'bridge', look: 'night', cast: ['whale', 'claude'], note: '夜里的石桥：两人已经并肩站在桥心，花从脚下开出去。',
    cam: { p0: [0, 4, 10], t0: [0, 0.8, 0], p1: [0, 2.5, 6], t1: [0, 1, 0], fov: 46 },
    act: (sc, f) => { stand(sc, 'whale', -0.45, 0, f.T, { y: 0.85 }); stand(sc, 'claude', 0.45, 0, f.T + 1, { y: 0.85 }); } },
  { id: 'P2c', at: halfAt(18), line: 18, sec: '导歌二', label: '爱你永恒不孤单', set: 'bridge', look: 'night', cast: ['whale', 'claude'], note: '绕着桥心环拍半圈，萤火聚过来。',
    cam: { p0: [-3, 1.5, 3], t0: [0, 1.4, 0], p1: [3, 1.5, 3], t1: [0, 1.4, 0], fov: 40 },
    act: (sc, f) => { stand(sc, 'whale', -0.45, 0, f.T, { y: 0.85 }); stand(sc, 'claude', 0.45, 0, f.T + 1, { y: 0.85 }); heartFx(sc, [0, 2.8, 0], f, 0.28); for (let i = 0; i < 10; i++) sc.glow([Math.cos(i + f.T) * 1.6, 1.4 + Math.sin(i * 2 + f.T) * 0.6, Math.sin(i + f.T) * 1.2], 0.3, [255, 220, 120], 0.9); } },

  // 副歌二（夜·紫）
  stroll('C2a', 19, '副歌二', 'violet'), smile('C2b', 19, '副歌二', 'violet'),
  plant('C2c', 20, '副歌二', 'violet', ['gemini']), bloom('C2d', 20, '副歌二', 'violet'),
  embrace('C2e', 21, '副歌二', 'violet'), heartbeat('C2f', 21, '副歌二', 'violet'),
  missing('C2g', 22, '副歌二', 'night'), markShot('C2h', 22, '副歌二', 'night', '味道'),

  // 啦啦（二）：庆典
  { id: 'LB1', at: cutAt(23), line: 23, sec: '啦啦尾奏', label: 'La la la la la la la', set: 'festival', cast: ['doubao', 'zai'], note: '庆典再开：豆包拉着狐狸踩拍，狐狸摘下眼罩认真跳。',
    cam: { p0: [2, 1.6, 5], t0: [0, 1, -2], p1: [-1, 1.6, 4.5], t1: [0, 1, -2], fov: 44 },
    act: (sc, f) => { pose(sc, 'doubao', -0.7, -2, 'hop', f.T); pose(sc, 'zai', 0.8, -2.2, f.k > 2 ? 'hop' : 'alert', f.T); } },
  { id: 'LB2', at: cutAt(24), line: 24, sec: '啦啦尾奏', label: 'La la la la la', set: 'festival', cast: ['qwen', 'gemini'], note: '千问转扇、猫转圈。',
    cam: { p0: [-2, 1.4, 4.5], t0: [0, 1, -2], p1: [1, 1.5, 4], t1: [0, 1, -2], fov: 44 },
    act: (sc, f) => { pose(sc, 'qwen', -0.8, -2, 'spin', f.T); pose(sc, 'gemini', 0.9, -2, 'spin', f.T + 0.3); } },
  { id: 'LB3', at: cutAt(25), line: 25, sec: '啦啦尾奏', label: 'La la la la la la la la', set: 'festival', cast: ['kimi', 'whale', 'claude'], note: 'Kimi 从星上下来了，本鲸和小克被拉进圈里。',
    cam: { p0: [0, 2, 6], t0: [0, 1, -2], p1: [0, 1.6, 4.5], t1: [0, 1, -2], fov: 46 },
    act: (sc, f) => { pose(sc, 'kimi', 0, -3, 'hop', f.T); pose(sc, 'whale', -1.2, -2, 'hop', f.T + 0.2); pose(sc, 'claude', 1.2, -2, 'hop', f.T + 0.4); } },
  { id: 'LB4', at: cutAt(26), line: 26, sec: '啦啦尾奏', label: 'La la la la la la la', set: 'festival', cast: ['whale', 'claude', 'doubao', 'qwen', 'gemini', 'kimi', 'zai', 'gpt'], note: '俯拍：七个人围成圈转，龙娘从上方掠过。',
    cam: { p0: [0, 8, 6], t0: [0, 0, -3], p1: [0, 7, 4], t1: [0, 0, -3], fov: 52 },
    act: (sc, f) => {
      (['whale', 'claude', 'doubao', 'qwen', 'gemini', 'kimi', 'zai'] as CastId[]).forEach((id, i) => { const a = (i / 7) * Math.PI * 2 + f.t * 0.7; pose(sc, id, Math.cos(a) * 2.6, -3 + Math.sin(a) * 1.8, 'hop', f.T + i * 0.15); });
      dragon(sc, f.T, [-14, 9, -12], [14, 9, -12], f.u);
    } },
  { id: 'LB5', at: cutAt(27), line: 27, sec: '啦啦尾奏', label: 'La la la la la', set: 'festival', cast: ['whale', 'claude'], note: '人群里，两人靠在一起看孔明灯。',
    cam: { p0: [0, 1.0, 5], t0: [0, 2.2, -4], p1: [0, 1.0, 4.4], t1: [0, 3.0, -6], fov: 46 },
    act: (sc, f) => { stand(sc, 'whale', -0.45, -2.4, f.T); stand(sc, 'claude', 0.45, -2.4, f.T + 1); } },
  { id: 'LB6', at: cutAt(28), line: 28, sec: '啦啦尾奏', label: 'La la la la la la la la', set: 'galaxy', look: 'dawn', cast: ['gpt'], note: '天色转亮：龙娘掠过黎明，银河退成晨光，接最后两遍副歌。',
    cam: { p0: [0, 1, 6], t0: [0, 4, -10], p1: [0, 1, 6], t1: [0, 2, -10], fov: 56 },
    act: (sc, f) => { dragon(sc, f.T, [14, 8, -14], [-14, 9.5, -15], f.u); } },

  // 副歌三（黎明）
  stroll('C3a', 29, '副歌三', 'dawn'), smile('C3b', 29, '副歌三', 'dawn'),
  plant('C3c', 30, '副歌三', 'dawn', ['gemini', 'qwen', 'zai']), bloom('C3d', 30, '副歌三', 'dawn'),
  embrace('C3e', 31, '副歌三', 'dawn'), heartbeat('C3f', 31, '副歌三', 'dawn'),
  { id: 'C3g', at: cutAt(32), line: 32, sec: '副歌三', label: '偷偷的在思念', set: 'meadow', look: 'dawn', cast: ['whale'], note: '晨光里本鲸一个人回头看来时的路。', cam: { p0: [3, 1.3, 4], t0: [0, 1.1, -1], p1: [2.2, 1.3, 3.2], t1: [0, 1.2, -1], fov: 40 },
    act: (sc, f) => { pose(sc, 'whale', 0, -1, 'sway', f.T * 0.7); } },
  { id: 'C3h', at: halfAt(32), line: 32, sec: '副歌三', label: '那是我们相爱的记号', set: 'meadow', look: 'dawn', cast: ['whale', 'claude', 'doubao', 'gemini', 'qwen', 'zai', 'kimi'], note: '俯拍：大家种下的樱花草在草原上排成一颗心——这就是记号。',
    cam: { p0: [0, 6.5, 9], t0: [0, 0, -3], p1: [0, 5.2, 7.5], t1: [0, 0.2, -3], fov: 48 },
    act: (sc, f) => {
      for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, hx = 16 * Math.pow(Math.sin(a), 3), hz = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); primrose(sc, [hx * 0.3, 0, -3 + hz * 0.22], 0.3, i % 2 ? '#ff6f9f' : '#ffb3cf', backOut(f.u * 2.2 - i / 46)); }
      stand(sc, 'whale', -0.4, -3, f.T); stand(sc, 'claude', 0.4, -3, f.T + 1);
      (['doubao', 'gemini', 'qwen', 'zai', 'kimi'] as CastId[]).forEach((id, i) => pose(sc, id, -6 + i * 3, -6.5, 'nod', f.T + i * 0.3));
    } },

  // 副歌四（春日）
  stroll('C4a', 33, '副歌四', 'spring', (sc, f) => { pose(sc, 'doubao', -3, -4, 'step', f.T); pose(sc, 'gemini', 2.5, -5, 'hop', f.T); }), smile('C4b', 33, '副歌四', 'spring'),
  plant('C4c', 34, '副歌四', 'spring', ['gemini', 'qwen', 'zai', 'kimi']), bloom('C4d', 34, '副歌四', 'spring'),
  embrace('C4e', 35, '副歌四', 'spring'), heartbeat('C4f', 35, '副歌四', 'spring'),
  { id: 'C4g', at: cutAt(36), line: 36, sec: '副歌四', label: '偷偷的在思念', set: 'meadow', look: 'spring', cast: ['whale', 'claude'], note: '本鲸把那朵樱花草推给小克——好东西先推出去。',
    cam: { p0: [-2.4, 1.3, 3.4], t0: [0, 1.0, 0], p1: [-1.8, 1.3, 2.8], t1: [0, 1.0, 0], fov: 40 },
    act: (sc, f) => { pose(sc, 'whale', -0.6, 0, 'point', f.t); stand(sc, 'claude', 0.6, 0, f.T); primrose(sc, [lerp(-0.25, 0.3, ease(f.u)), 1.0, 0.1], 0.13, '#ff6f9f', 1); } },
  { id: 'C4h', at: halfAt(36), line: 36, sec: '副歌四', label: '那是我们相爱的味道', set: 'meadow', look: 'spring', cast: ['whale', 'claude', 'doubao', 'gemini', 'qwen', 'zai', 'kimi', 'gpt'], note: '全员挥手，镜头升起；龙娘最后一次掠过天空。',
    cam: { p0: [0, 1.6, 7], t0: [0, 1.2, -1], p1: [0, 5, 12], t1: [0, 2, -4], fov: 48 },
    act: (sc, f) => {
      (['zai', 'qwen', 'whale', 'claude', 'gemini', 'kimi', 'doubao'] as CastId[]).forEach((id, i) => {
        const x = -3.6 + i * 1.2, a = id === 'whale' ? 'wave' : id === 'claude' ? 'curtsy' : 'hop';
        pose(sc, id, x, -0.5 - Math.abs(i - 3) * 0.3, a, id === 'claude' ? f.t : f.T + i * 0.2);
      });
      dragon(sc, f.T, [-14, 9, -14], [14, 10, -14], f.u);
    }, fx: { petals: true } },

  // 尾声
  { id: 'OUT', at: 260.2, sec: '尾声', label: '尾声 · 银河', set: 'galaxy', look: 'violet', cast: [], note: '镜头升向银河，渐黑；最后一个音落下就结束，不加片尾卡。',
    cam: { p0: [0, 1, 6], t0: [0, 2, -10], p1: [0, 3, 6], t1: [0, 9, -10], fov: 56 }, fx: { fadeOut: 4.5, end: true } },
];
