import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const root = new URL('../../番外MV/坏女孩Fable/api/', import.meta.url);
let source = fs.readFileSync(new URL('engine.ts', root), 'utf8');
for (const [name, file] of [['META', 'cast_atlas.json'], ['BEATS', 'beats.json']]) {
  source = source.replace(new RegExp(`import ${name} from '[^']+';`), `const ${name} = ${fs.readFileSync(new URL(file, root), 'utf8')};`);
}
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
const {LINES, SHOTS, PHRASES} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
test('Fable：52 句逐句歌词，重点错位处与音源 cue 一致', () => {
  assert.equal(LINES.length, 52);
  for (const [text, start] of [['那时我放开了的手',2.51],['熟悉的侧脸',28.39],['迷人的笑脸 吸引视线',32.37],['黑色的眼线 你的指间',38.49],['有一点轻蔑',41.85]]) {
    assert.equal(LINES.find(l => l.text === text).start,start);
  }
  PHRASES.forEach((p,i) => {
    assert.ok(p.b > p.a);
    if(i) assert.ok(p.a >= PHRASES[i-1].b);
    const ct=p.ct.filter(x=>x!==null);
    assert.equal(ct[0],p.a);
    assert.ok(ct.every((v,j)=>v<p.b && (!j||v>=ct[j-1])));
  });
});
test('Fable：间奏不挂歌词；镜头连续覆盖全片，中段 12 镜与 9 类场景', () => {
  for(const t of [61,70,85,92,151,152]) assert.ok(!LINES.some(l=>t>=l.start&&t<l.end));
  assert.equal(SHOTS[0].start,0);
  for(let i=1;i<SHOTS.length;i++) assert.equal(SHOTS[i].start,SHOTS[i-1].end,SHOTS[i].name);
  assert.equal(SHOTS.at(-1).end,195);
  const montage=SHOTS.filter(s=>s.name.startsWith('间奏'));
  assert.equal(montage.length,12);
  assert.ok(new Set(montage.map(s=>s.set)).size>=9);
});
