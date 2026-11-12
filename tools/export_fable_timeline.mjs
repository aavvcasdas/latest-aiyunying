// 从渲染引擎导出同源字幕与分镜，避免另维护一条会漂移的 SRT 时间轴。
import fs from 'node:fs';
import ts from 'typescript';
const root = new URL('../番外MV/坏女孩Fable/', import.meta.url);
let source = fs.readFileSync(new URL('api/engine.ts', root), 'utf8');
for (const [name, file] of [['META','cast_atlas.json'],['BEATS','beats.json']]) {
  source = source.replace(new RegExp(`import ${name} from '[^']+';`), `const ${name} = ${fs.readFileSync(new URL(`api/${file}`, root), 'utf8')};`);
}
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
const {LINES, SHOTS} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const time = s => {
  const ms = Math.round(s * 1000);
  return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
};
fs.mkdirSync(new URL('成片/',root), {recursive:true});
fs.writeFileSync(new URL('成片/坏女孩_fable5.2.srt',root), LINES.map((l,i)=>`${i+1}\n${time(l.start)} --> ${time(l.end)}\n${l.text}\n`).join('\n'));
fs.writeFileSync(new URL('成片/分镜时间轴.json',root),JSON.stringify(SHOTS,null,2)+'\n');
console.log(`已导出 ${LINES.length} 句字幕、${SHOTS.length} 个镜头`);
