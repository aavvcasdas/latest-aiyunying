// gif.mjs —— 极简 GIF89a 编码器（调色板索引图直出，255 号当透明色，无损、不抖动）
export function encodeGif({ w, h, frames, palette, delayCs = 10, transparent = 255, loop = 0 }) {
  const out = [];
  const u16 = (v) => out.push(v & 255, (v >> 8) & 255);
  const str = (s) => { for (const c of s) out.push(c.charCodeAt(0)); };
  str('GIF89a'); u16(w); u16(h);
  out.push(0xf7, 0, 0); // 全局色表 256 色
  for (let i = 0; i < 256; i++) { const c = palette[i] ?? [0, 0, 0]; out.push(c[0], c[1], c[2]); }
  out.push(0x21, 0xff, 11); str('NETSCAPE2.0'); out.push(3, 1); u16(loop); out.push(0);
  frames.forEach((idx, fi) => {
    const d = Array.isArray(delayCs) ? delayCs[fi] : delayCs;
    out.push(0x21, 0xf9, 4, 0b00001001, d & 255, (d >> 8) & 255, transparent, 0); // 处置方式 2：恢复背景
    out.push(0x2c); u16(0); u16(0); u16(w); u16(h); out.push(0);
    out.push(8);
    const data = lzw(idx, 8);
    for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); out.push(n); for (let k = 0; k < n; k++) out.push(data[i + k]); }
    out.push(0);
  });
  out.push(0x3b);
  return Uint8Array.from(out);
}

function lzw(px, minSize) {
  const clear = 1 << minSize, eoi = clear + 1;
  let size = minSize + 1, next = eoi + 1;
  let dict = new Map();
  const bytes = []; let cur = 0, bits = 0;
  const emit = (code) => { cur |= code << bits; bits += size; while (bits >= 8) { bytes.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i], key = prefix * 4096 + k;
    const hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
    else { emit(clear); dict = new Map(); size = minSize + 1; next = eoi + 1; }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) bytes.push(cur & 255);
  return bytes;
}
