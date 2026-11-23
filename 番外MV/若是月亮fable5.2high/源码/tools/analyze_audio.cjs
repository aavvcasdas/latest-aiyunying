// 实测卡点：读 WAV → 10ms 一帧的能量包络 + 人声频带频谱通量 → 起音点
// 用法：node tools/analyze_audio.cjs <wav> [--dump]
const fs = require("fs");

const file = process.argv[2];
const buf = fs.readFileSync(file);
let p = 12, fmt = null, data = null;
while (p < buf.length - 8) {
  const id = buf.toString("ascii", p, p + 4);
  const sz = buf.readUInt32LE(p + 4);
  if (id === "fmt ") fmt = { ch: buf.readUInt16LE(p + 10), sr: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
  if (id === "data") data = { off: p + 8, size: sz };
  p += 8 + sz + (sz % 2);
}
const { ch, sr } = fmt;
const n = data.size / (ch * 2);
const mono = new Float32Array(n);
for (let i = 0; i < n; i++) {
  let s = 0;
  for (let c = 0; c < ch; c++) s += buf.readInt16LE(data.off + (i * ch + c) * 2);
  mono[i] = s / ch / 32768;
}

// radix-2 FFT
function fft(re, im) {
  const N = re.length;
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br; im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br; im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

const HOP = Math.round(sr * 0.01), WIN = 2048;
const frames = Math.floor((n - WIN) / HOP);
const lo = Math.floor((250 / sr) * WIN), hi = Math.floor((3500 / sr) * WIN);
const rms = new Float32Array(frames), vocal = new Float32Array(frames), flux = new Float32Array(frames);
let prev = new Float32Array(hi - lo);
const hann = new Float32Array(WIN).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1)));
for (let f = 0; f < frames; f++) {
  const re = new Float32Array(WIN), im = new Float32Array(WIN);
  let e = 0;
  for (let i = 0; i < WIN; i++) { const v = mono[f * HOP + i]; e += v * v; re[i] = v * hann[i]; }
  rms[f] = Math.sqrt(e / WIN);
  fft(re, im);
  let ve = 0, fl = 0;
  const cur = new Float32Array(hi - lo);
  for (let k = lo; k < hi; k++) {
    const m = Math.log1p(100 * Math.hypot(re[k], im[k]));
    cur[k - lo] = m; ve += m;
    const d = m - prev[k - lo]; if (d > 0) fl += d;
  }
  vocal[f] = ve / (hi - lo); flux[f] = fl; prev = cur;
}
// 平滑 + 自适应阈值取峰
const sm = (a, r) => a.map((_, i) => { let s = 0, c = 0; for (let j = i - r; j <= i + r; j++) if (j >= 0 && j < a.length) { s += a[j]; c++; } return s / c; });
const fs2 = sm(flux, 1), base = sm(flux, 25);
const onsets = [];
for (let i = 2; i < frames - 2; i++) {
  if (fs2[i] > fs2[i - 1] && fs2[i] >= fs2[i + 1] && fs2[i] > base[i] * 1.25 && fs2[i] > 4) {
    if (!onsets.length || i - onsets[onsets.length - 1].f > 9) onsets.push({ f: i, t: +(i * 0.01 + WIN / 2 / sr).toFixed(2), s: +(fs2[i] / base[i]).toFixed(2) });
  }
}
const out = { sr, ch, seconds: n / sr, hop: 0.01, onsets, rms: Array.from(sm(rms, 2)).map((v) => +v.toFixed(4)), vocal: Array.from(sm(vocal, 2)).map((v) => +v.toFixed(3)) };
if (process.argv.includes("--dump")) fs.writeFileSync("/tmp/audio_analysis.json", JSON.stringify(out));
// 打印 0.1s 粒度的包络
let line = "";
for (let i = 0; i < frames; i += 10) {
  const r = out.rms[i], v = out.vocal[i];
  line += `${(i * 0.01).toFixed(1).padStart(5)}s rms ${r.toFixed(3)} voc ${v.toFixed(2)} ${"#".repeat(Math.round(r * 120))}\n`;
}
console.log(line);
console.log("onsets:", onsets.map((o) => `${o.t}(${o.s})`).join(" "));
