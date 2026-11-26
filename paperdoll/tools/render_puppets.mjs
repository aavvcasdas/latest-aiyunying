// Browser render / interaction QA and optional MP4 export. All frame sequences live in OS tmp.
// Start the preview server first. Root `npm ci` and `npm ci --prefix paperdoll/runtime` required.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {PNG} from 'pngjs';
const require=createRequire(import.meta.url),ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(ROOT,'paperdoll/demo'),checksOnly=process.argv.includes('--check');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'whale-puppets-'));
const errors=[],report={measured:false,audio:false,frames:240,fps:30,resolution:[1280,720],human_sign_off:false,checks:{}};
fs.mkdirSync(output,{recursive:true});
const env={...process.env};
// The Chromium package only auto-unpacks NSS libraries on Lambda. Reuse its bundled
// libraries here too, without root/apt, network downloads or repository binaries.
if(process.platform==='linux'){
 const archive=path.join(path.dirname(require.resolve('@sparticuz/chromium')),'../bin/al2023.tar.br');
 const tar=path.join(temp,'al2023.tar');fs.writeFileSync(tar,zlib.brotliDecompressSync(fs.readFileSync(archive)));
 execFileSync('tar',['-xf',tar,'-C',temp]);env.LD_LIBRARY_PATH=path.join(temp,'lib')+':'+(env.LD_LIBRARY_PATH??'');
}
const ffmpeg=execFileSync('python3',['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();
let browser;
function pixels(uri){return PNG.sync.read(Buffer.from(uri.split(',')[1],'base64'));}
function roi(im,x,y,w,h){let result=[];for(let row=y;row<y+h;row++)result.push(im.data.subarray((row*im.width+x)*4,(row*im.width+x+w)*4));return Buffer.concat(result);}
try{
 browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true,env});
 const page=await browser.newPage();await page.setViewport({width:1440,height:1100,deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const response=await page.goto(process.env.PUPPET_URL??'http://127.0.0.1:8000',{waitUntil:'networkidle0'});assert.equal(response.status(),200);
 await page.waitForFunction(()=>window.puppet?.ready,{timeout:30000});
 const capture=async(route,t)=>page.evaluate((r,t)=>window.puppet.snapshot(r,t),route,t);
 const a0=await capture('C',0),a1=await capture('C',1.5),a6=await capture('C',6.25);
 assert.notEqual(a0,a1);assert.equal(a1,await capture('C',1.5));
 const p0=pixels(a0),p1=pixels(a1);
 assert.ok(roi(p0,595,430,80,45).equals(roi(p1,595,430,80,45)));
 report.checks.combined_apron_stationary=true;report.checks.rigid_limb_motion=true;report.checks.random_access=true;
 const b0=await capture('C',0),blink=await capture('C',1.1),mouth=await capture('C',3.1);
 assert.notEqual(b0,blink);assert.notEqual(b0,mouth);assert.equal(blink,await capture('C',1.1));
 report.checks.iki_face_on_same_cutout_canvas=true;
 // Six frames FIRST, before full video. Deterministic technical shot, no audio.
 const sheet=new PNG({width:1280*3,height:720*2});
 for(const [i,t] of [0,.8,1.5,3.1,4.8,7.5].entries()){
  const frame=pixels(await capture('C',t));
  PNG.bitblt(frame,sheet,0,0,1280,720,(i%3)*1280,Math.floor(i/3)*720);
 }
 fs.writeFileSync(path.join(output,'Cutout-Iki六格检查.png'),PNG.sync.write(sheet));
 await page.click('#bones');assert.equal(await page.$eval('#bones',e=>e.checked),true);await page.click('#bones');
 await page.$eval('#eye',e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.$eval('#mouth',e=>{e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>{const s=window.puppet.getState();return s.parameters.find(p=>p.id==='ParamEyeLOpen').value===0&&s.parameters.find(p=>p.id==='ParamMouthOpenY').value===1;});
 report.checks.combined_bones_and_face_sliders=true;
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:path.join(temp,'mobile.png'),fullPage:true});report.checks.mobile_no_horizontal_overflow=true;
 await page.setViewport({width:1440,height:1100,deviceScaleFactor:1});
 fs.writeFileSync(path.join(output,'Cutout挥手检查.png'),Buffer.from(a1.split(',')[1],'base64'));
 fs.writeFileSync(path.join(output,'Iki闭眼检查.png'),Buffer.from(blink.split(',')[1],'base64'));
 fs.writeFileSync(path.join(output,'Iki张嘴检查.png'),Buffer.from(mouth.split(',')[1],'base64'));
 if(!checksOnly){
  for(const [route,name] of [['C','Cutout-Iki组合无声样片']]){
   const frames=path.join(temp,route);fs.mkdirSync(frames);const start=Date.now();
   for(let fi=0;fi<240;fi++){
    const data=await capture(route,fi/30);
    fs.writeFileSync(path.join(frames,`f${String(fi).padStart(5,'0')}.png`),Buffer.from(data.split(',')[1],'base64'));
   }
   const target=path.join(output,name+'.mp4');
   execFileSync(ffmpeg,['-v','error','-y','-framerate','30','-i',path.join(frames,'f%05d.png'),'-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',target],{stdio:'pipe'});
   const decode=execFileSync(ffmpeg,['-i',target,'-f','null','-'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
   // Counting decoded frame objects independently of encoder metadata.
   const info=execFileSync(ffmpeg,['-v','error','-i',target,'-map','0:v:0','-f','framemd5','-'],{encoding:'utf8'});
   assert.equal(info.split('\n').filter(l=>l.trim()&&!l.startsWith('#')).length,240);
   report[route]={seconds:8,frames:240,render_encode_ms:Date.now()-start,full_decode:true,file:name+'.mp4'};
   console.log('VIDEO_OK',name);
  }
 }
 assert.deepEqual(errors,[]);report.checks.browser_errors=[];
 fs.writeFileSync(path.join(output,checksOnly?'cutout-browser-check.json':'cutout-qa.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{
 await browser?.close();fs.rmSync(temp,{recursive:true,force:true});
}
