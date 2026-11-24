#!/usr/bin/env node
// 模板动作预览台：零依赖静态服务，直接读 canonical 图集 / 动作表。
// 监听 0.0.0.0，方便 Arena 的远程浏览器预览；页面全部用相对 URL，不写 localhost。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PORT = Number(process.env.PORT || 4173);
const HOST = '0.0.0.0';

const ATLAS_PNG = path.join(ROOT, '通用模板/engine/assets/cast_atlas.png');
const ATLAS_JSON = path.join(ROOT, '通用模板/engine/assets/cast_atlas.json');
const ACTIONS_JSON = path.join(ROOT, '通用模板/engine/assets/cast_actions.json');
const FILM_DIR = path.join(HERE, 'film_compare');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.md': 'text/markdown; charset=utf-8',
  '.ttf': 'font/ttf',
};

const STATIC = {
  '/': path.join(HERE, 'index.html'),
  '/index.html': path.join(HERE, 'index.html'),
  '/app.js': path.join(HERE, 'app.js'),
  '/styles.css': path.join(HERE, 'styles.css'),
  '/README.md': path.join(HERE, 'README.md'),
  '/fonts/ZCOOLKuaiLe-Regular.ttf': path.join(HERE, 'fonts/ZCOOLKuaiLe-Regular.ttf'),
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function serveFile(res, file) {
  try {
    const body = fs.readFileSync(file);
    send(res, 200, body, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch (err) {
    send(res, 500, `STATIC_READ_FAIL ${err.message}`);
  }
}

// 步态序列前缀，必须和 engine/actors.ts 的 CAST_SETS 一致。
// 帧数不写死：从 0 连着数，数到图集里缺号为止（同 actors.ts 的 framesIn）。
const WALK_PREFIX = {
  whale: 'walk_whale_',
  claude: 'walk_claude_',
  kimi: 'walk_kimi_',
  gemini: 'walk_gemini_',
  qwen: 'walk_qwen_',
  zai: 'walk_zai_',
  doubao: 'walk_doubao_big_',
  gpt: 'gpt_fly_',
};

function walkSets(cells) {
  const out = {};
  for (const [who, prefix] of Object.entries(WALK_PREFIX)) {
    const frames = [];
    while (cells[`${prefix}${frames.length}`]) frames.push(`${prefix}${frames.length}`);
    if (!frames.length) continue;
    const [w, h] = [cells[frames[0]][2], cells[frames[0]][3]];
    out[who] = { prefix, frames, size: [w, h], fps: 10, loop: true };
  }
  return out;
}

function castPayload() {
  const rects = JSON.parse(fs.readFileSync(ATLAS_JSON, 'utf8'));
  const actions = JSON.parse(fs.readFileSync(ACTIONS_JSON, 'utf8'));
  return {
    generatedBy: '通用模板/actions_preview/server.mjs',
    note: '实时读取 canonical 母版与动作表；不生成 GIF，不写盘。',
    master: {
      png: '/assets/cast_atlas.png',
      w: rects.w,
      h: rects.h,
      cells: Object.keys(rects.s).length,
      sha256: sha256(ATLAS_PNG),
      bytes: fs.statSync(ATLAS_PNG).size,
    },
    rects: rects.s,
    actions: actions.actions,
    walk: walkSets(rects.s),
    props: actions.props,
    propsOf: actions.propsOf,
    fx: actions.fx,
    actionsNote: actions.note,
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://preview.local');
  const pathname = url.pathname;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'METHOD_NOT_ALLOWED');
    return;
  }
  if (pathname === '/favicon.ico') {
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
    return;
  }
  if (pathname === '/api/cast') {
    try {
      send(res, 200, JSON.stringify(castPayload()), MIME['.json']);
    } catch (err) {
      send(res, 500, `CAST_READ_FAIL ${err.message}`);
    }
    return;
  }
  if (pathname === '/assets/cast_atlas.png') {
    try {
      const body = fs.readFileSync(ATLAS_PNG);
      send(res, 200, body, MIME['.png']);
    } catch (err) {
      send(res, 500, `ATLAS_READ_FAIL ${err.message}`);
    }
    return;
  }
  if (pathname === '/film' || pathname === '/film/') {
    serveFile(res, path.join(FILM_DIR, 'index.html'));
    return;
  }
  if (pathname.startsWith('/film/')) {
    let rel = '';
    try { rel = decodeURIComponent(pathname.slice('/film/'.length)).replace(/^\/+/, ''); }
    catch { send(res, 400, 'BAD_PATH'); return; }
    const file = path.resolve(FILM_DIR, rel || 'index.html');
    if (!file.startsWith(FILM_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      send(res, 404, 'NOT_FOUND');
      return;
    }
    serveFile(res, file);
    return;
  }
  const file = STATIC[pathname];
  if (file) {
    serveFile(res, file);
    return;
  }
  send(res, 404, 'NOT_FOUND');
});

server.listen(PORT, HOST, () => {
  console.log(`ACTIONS_PREVIEW_READY http://${HOST}:${PORT}/ · atlas ${ATLAS_PNG}`);
});
