#!/usr/bin/env node
// User-requested MV freeze. Content baseline is outside the protected tree and
// works in shallow clones. --apply also removes local write permission; Git does
// not preserve that permission. This is a workflow guard, not a security sandbox.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/readonly_paths.manifest.json'),'utf8'));
const inside=(p,dir)=>p.startsWith(dir+'/');
const entries=new Map(manifest.files.map(f=>[f.path,f]));
const problems=[];
const sha=async(file)=>{
 const hash=crypto.createHash('sha256');
 for await(const chunk of fs.createReadStream(file))hash.update(chunk);
 return hash.digest('hex');
};
for(const entry of manifest.files){
 if(!manifest.directories.some(dir=>inside(entry.path,dir)))throw new Error('Invalid read-only manifest path: '+entry.path);
 const full=path.join(ROOT,entry.path);
 let stat;
 try{stat=fs.lstatSync(full);}catch{problems.push(`${entry.path}: 已删除或缺失`);continue;}
 const symbolic=stat.isSymbolicLink();
 if(symbolic!==(entry.type==='symlink')){problems.push(`${entry.path}: 文件类型改变`);continue;}
 if(!symbolic&&!stat.isFile()){problems.push(`${entry.path}: 不是文件`);continue;}
 const actual=symbolic?crypto.createHash('sha256').update(fs.readlinkSync(full)).digest('hex'):await sha(full);
 if(actual!==entry.sha256)problems.push(`${entry.path}: 内容与只读基线不一致`);
}
// Include staged additions and untracked nonignored files. Existing ignored
// render outputs are not versioned by this check; local --apply covers them too.
const current=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--',...manifest.directories],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of new Set(current))if(!entries.has(file))problems.push(`${file}: 只读目录内新增文件`);
for(const dir of manifest.directories){
 const stat=fs.lstatSync(path.join(ROOT,dir));
 if(!stat.isDirectory()||stat.isSymbolicLink())problems.push(`${dir}: 只读根目录类型不正确`);
}
if(problems.length){
 console.error('MV_READONLY_FAIL\n  - '+problems.join('\n  - '));
 console.error('番外MV 已由用户冻结；不得自动修改基线、恢复写权限或继续写入。');
 process.exit(1);
}
if(process.argv.includes('--apply')){
 let count=0;
 const protect=(p)=>{
  const stat=fs.lstatSync(p);
  if(stat.isSymbolicLink())return; // never follow links outside the protected tree
  if(stat.isDirectory())for(const entry of fs.readdirSync(p))protect(path.join(p,entry));
  fs.chmodSync(p,stat.mode & ~0o222);count++;
 };
 for(const dir of manifest.directories)protect(path.join(ROOT,dir));
 console.log(`MV_READONLY_APPLIED ${count} files/directories · local permissions only`);
}
console.log(`MV_READONLY_OK ${manifest.files.length} tracked files unchanged · ${manifest.directories.join(', ')}`);
