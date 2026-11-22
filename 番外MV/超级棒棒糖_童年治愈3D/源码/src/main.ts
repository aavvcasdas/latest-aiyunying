// 《超级棒棒糖》Vite 单页：预览 + 出帧钩子（tools/shoot_vite_mv.mjs 用）
import './style.css';
import { MvEngine } from './mv/engine';
import { SHOTS, SONG } from './mv/data';

declare global {
  interface Window {
    __mv?: { duration: number; shots: number; ready: () => boolean; render: (t: number, clean?: boolean, w?: number, h?: number) => string };
    __seek?: (t: number) => void;
  }
}

const clean = new URLSearchParams(location.search).has('clean');
if (clean) document.body.classList.add('clean');
const app = document.getElementById('app')!;
app.innerHTML = `<div class="stage"><canvas id="mv" width="1280" height="720"></canvas></div>
<div class="bar"${clean ? ' hidden' : ''}><button id="play">播放</button><input id="seek" type="range" min="0" max="${SONG.duration}" step="0.01" value="0" /><span id="info"></span></div>`;
const canvas = document.getElementById('mv') as HTMLCanvasElement;
const btn = document.getElementById('play') as HTMLButtonElement;
const seek = document.getElementById('seek') as HTMLInputElement;
const info = document.getElementById('info') as HTMLSpanElement;
const audio = new Audio('./mv/chaoji-bangbangtang.wav');
audio.preload = 'auto';

(async () => {
  const eng = new MvEngine(canvas, { atlasUrl: './mv/atlas.png', fontUrl: './mv/kuaile.otf' });
  await eng.load();
  eng.render(0);
  window.__mv = { duration: SONG.duration, shots: SHOTS.length, ready: () => eng.ready, render: (t, _clean, w = 1280, h = Math.round((w * 9) / 16)) => eng.snapshot(t, w, h, 0.94) };
  window.__seek = (t) => { audio.currentTime = t; eng.render(t); };
  let playing = false;
  const show = (t: number) => { seek.value = String(t); info.textContent = `${t.toFixed(2)} 秒 · ${SHOTS[eng.lastShot].id} ${SHOTS[eng.lastShot].title}`; };
  btn.onclick = async () => { if (playing) { audio.pause(); playing = false; btn.textContent = '播放'; } else { await audio.play(); playing = true; btn.textContent = '暂停'; } };
  seek.oninput = () => { const t = Number(seek.value); audio.currentTime = t; eng.render(t); show(t); };
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); btn.click(); } });
  audio.onended = () => { playing = false; btn.textContent = '播放'; };
  const loop = () => { if (playing) { const t = audio.currentTime; eng.render(t); show(t); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  show(0);
})().catch((e) => { console.error(e); app.insertAdjacentHTML('beforeend', `<p style="padding:16px;color:#ff9a9a">${String(e)}</p>`); });
