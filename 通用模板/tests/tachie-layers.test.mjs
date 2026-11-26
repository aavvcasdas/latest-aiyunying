import test from 'node:test';
import assert from 'node:assert/strict';
import './tpl-loader.mjs';
const {drawTachie}=await import('../../人物/立绘/src/mv/rig.ts');
const {basePose}=await import('../../人物/立绘/src/mv/actions.ts');
const {TACHIE,preloadTachie,setTachieUrls}=await import('../engine/tachie.ts');

function context(){
 const stack=[],calls=[];
 return {calls,globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},
 translate(...n){assert.ok(n.every(Number.isFinite));},scale(...n){assert.ok(n.every(Number.isFinite));},rotate(n){assert.ok(Number.isFinite(n));},
 drawImage(img,...args){assert.ok(args.every(Number.isFinite));calls.push({img,args,alpha:this.globalAlpha});}};
}
const meta={w:912,h:1136,neck:480/1136,cx:.5,hx:.48};

test('layered character is additive; legacy eight remain single-layer',()=>{
 assert.equal(Object.keys(TACHIE).length,9);
 assert.equal(TACHIE.whale.layerStatus,'single-layer');
 assert.equal(TACHIE.whale_cutout.layerStatus,'layered');
 assert.equal(TACHIE.whale_cutout.rig,'rigid/whale/bind.json');
 assert.equal(TACHIE.whale_cutout.layers.hands,null,'never use a flattened hands layer for rigid arms');
});
test('drawTachie draws each independent artwork ONCE at its spine attachment',()=>{
 const ctx=context(),base={},eyes={},mouth={},hands={};
 const layers=[{img:eyes,pivot:[438,375],opacity:.3},{img:mouth,pivot:[438,430],opacity:0},{img:hands,pivot:[456,552],rotation:.2}];
 drawTachie(ctx,{img:base,w:912,h:1136},meta,basePose(),456,1136,1136,false,layers);
 for(const img of [eyes,mouth,hands])assert.equal(ctx.calls.filter(c=>c.img===img).length,1);
 assert.equal(ctx.calls.find(c=>c.img===eyes).alpha,.3);
 assert.equal(ctx.calls.find(c=>c.img===mouth).alpha,0);
 assert.equal(ctx.calls.find(c=>c.img===hands).alpha,1);
 assert.equal(ctx.globalAlpha,1);
 assert.ok(ctx.calls.filter(c=>c.img===base).length>=48);
});
test('legacy render has no implicit layers, and arbitrary seeks are stateless',()=>{
 const run=()=>{const ctx=context();drawTachie(ctx,{img:'base',w:912,h:1136},meta,basePose(),456,1136,1136,false);return ctx.calls;};
 const a=run();run();assert.deepEqual(a,run());assert.ok(a.every(c=>c.img==='base'));
});
test('preloading an unregistered character fails instead of silently omitting layers',async()=>{
 await assert.rejects(preloadTachie('whale_cutout'),/素材未注册/);
});

test('declared rigid characters NEVER silently fall back to legacy strips',async()=>{
 setTachieUrls({whale_cutout:'test://base.png'});
 try {await assert.rejects(preloadTachie('whale_cutout'),/缺骨架注册.*禁止回退/);}
 finally {TACHIE.whale_cutout.url='';}
});
