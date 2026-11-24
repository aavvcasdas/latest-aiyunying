#!/usr/bin/env node
// Use the repo-local virtualenv when present, otherwise the active python3.
// CI installs requirements.txt with `python3 -m pip install -r requirements.txt`.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const venv = path.join(ROOT, '.venv/bin/python');
const exe = fs.existsSync(venv) ? venv : 'python3';
const args = process.argv.slice(2);
if (!args.length) {
  console.error('用法：node tools/run_python.mjs <python 脚本> [参数…]');
  process.exit(2);
}
const result = spawnSync(exe, args, { stdio: 'inherit', cwd: ROOT });
process.exit(result.status ?? 1);
