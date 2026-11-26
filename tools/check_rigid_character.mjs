// Interactive template QA only. Never encodes or exports a sample video.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import zlib from 'node:zlib';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {PNG} from 'pngjs';
const require=createRequire(import.meta.url),errors=[];
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'template-rig-check-'));
const env={...process.env};
if(process.platform==='linux'){
 const archive=path.join(path.dirname(require.resolve('@sparticuz/chromium')),'../bin/al2023.tar.br');
 const tar=path.join(temp,'libraries.tar');fs.writeFileSync(tar,zlib.brotliDecompressSync(fs.readFileSync(archive)));execFileSync('tar',['-xf',tar,'-C',temp]);
 env.LD_LIBRARY_PATH=path.join(temp,'lib')+':'+(env.LD_LIBRARY_PATH??'');
}
let browser;
try{
 browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,env});
 const page=await browser.newPage();await page.setViewport({width:1360,height:1200,deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RIG_URL??'http://127.0.0.1:5173/rig.html',{waitUntil:'networkidle0'});
 await page.waitForFunction(()=>window.rigInspector?.ready,{timeout:30000});
 const set=async(id,value)=>page.$eval('#'+id,(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const shot=async(t)=>page.evaluate(t=>window.rigInspector.paint(t),t);
 const write=(name,uri)=>fs.writeFileSync(path.join(temp,name+'.png'),Buffer.from(uri.split(',')[1],'base64'));
 await page.$eval('#bones',e=>{e.checked=false;});
 const a=await shot(.3);await shot(1.1);assert.equal(a,await shot(.3));
 const expressions={};
 for(const name of ['neutral','happy','angry','sad','joy','surprised']){
  await set('emotion',name);expressions[name]=await shot(.3);write(name,expressions[name]);
 }
 assert.equal(new Set(Object.values(expressions)).size,6,'all six expressions must actually change rendered pixels');
 // Expression alone cannot change any pixels in the legs.
 const decode=s=>PNG.sync.read(Buffer.from(s.split(',')[1],'base64'));
 const rest=decode(expressions.neutral);
 for(const s of Object.values(expressions))assert.ok(rest.data.subarray(880*912*4).equals(decode(s).data.subarray(880*912*4)));
 await set('action','bind');await set('emotion','neutral');const straight=await shot(0);
 let state=await page.evaluate(()=>window.rigInspector.state());
 for(const name of ['arm_R','arm_L']){
  const {root,joint,end}=state.chains[name];
  const cross=(joint[0]-root[0])*(end[1]-joint[1])-(joint[1]-root[1])*(end[0]-joint[0]);
  assert.ok(Math.abs(cross)<1e-6,'zero elbow must be geometrically straight');
 }
 write('straight-bind',straight);
 await page.$eval('#bones',e=>{e.checked=true;});await set('action','walk');
 for(const [i,t] of [0,.15,.3,.45,.6,.75,.9,1.05].entries())write('walk-'+i,await shot(t));
 await page.click('#next');const after=await page.evaluate(()=>window.rigInspector.state());
 assert.notDeepEqual(after,state);
 await set('emotion','auto');const auto0=await shot(.3),auto4=await shot(4.3);assert.notEqual(auto0,auto4);
 await page.setViewport({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({video_exported:false,template_class:'Tachie',checks:{six_distinct_expressions:true,expression_does_not_deform_legs:true,zero_elbow_is_straight:true,seek_deterministic:true,frame_step:true,automatic_expression_switch:true,mobile_no_overflow:true,browser_errors:errors},temporary_inspection_images:temp},null,2));
}finally{await browser?.close();}
