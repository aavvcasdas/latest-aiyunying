import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');

test('artwork versions are updateable; missing files and broken live mirrors still fail',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'asset-policy-'));
 try {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets.manifest.json')));
  for(const file of ['tools/check_asset_hashes.mjs','assets.manifest.json',...manifest.files.map(f=>f.path)]){
   const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  const run=(...args)=>spawnSync(process.execPath,['tools/check_asset_hashes.mjs',...args],{cwd:temp,encoding:'utf8'});
  assert.equal(run('--strict').status,0);
  fs.appendFileSync(path.join(temp,'requirements.txt'),'\n# intentional version update\n');
  const advisory=run();assert.equal(advisory.status,0);assert.match(advisory.stderr,/ASSET_VERSION_CHANGED/);
  assert.notEqual(run('--strict').status,0);
  assert.equal(run('--write').status,0);assert.equal(run('--strict').status,0);
  const mirror=path.join(temp,'人物/atlas.png');fs.appendFileSync(mirror,'changed mirror');
  assert.notEqual(run().status,0,'a damaged current mirror is not a valid art update');
  fs.copyFileSync(path.join(temp,'通用模板/engine/assets/cast_atlas.png'),mirror);
  fs.unlinkSync(path.join(temp,'requirements.txt'));
  assert.notEqual(run().status,0,'missing assets/dependencies must still fail');
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
