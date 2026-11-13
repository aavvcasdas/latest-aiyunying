import { ArrowUpRight, BookOpen, Copy, Download, ExternalLink, FileCode2, FileText, Package, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { REPOSITORY } from '../data';
import { Github } from './Icons';

function CodeBlock({ code, onCopy }: { code: string; onCopy: (text: string) => void }) {
  return <div className="code-block"><span className="code-language">{code.startsWith('<') ? 'HTML' : code.includes('whale.') ? 'TYPESCRIPT' : 'TERMINAL'}</span><button aria-label="复制代码" onClick={() => onCopy(code)}><Copy size={14} /></button><pre><code>{code}</code></pre></div>;
}
function GuideStep({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <section className="guide-step"><span className="step-number">{number}</span><div><h3>{title}</h3><p>{description}</p>{children}</div></section>;
}

export default function Documentation({ tab, setTab, actionId, notify, onPatch }: { tab: string; setTab: (tab: string) => void; actionId: string; notify: (message: string) => void; onPatch: () => void }) {
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); notify('已复制到剪贴板'); }
    catch { notify('浏览器未允许复制，请选中代码后手动复制。'); }
  };
  return <section className="docs-layout"><div className="docs-main">
    <div className="docs-tabs"><button className={tab === 'quick' ? 'selected' : ''} onClick={() => setTab('quick')}>快速集成</button><button className={tab === 'guide' ? 'selected' : ''} onClick={() => setTab('guide')}>图片替换指南</button><button className={tab === 'notes' ? 'selected' : ''} onClick={() => setTab('notes')}>素材与使用说明</button></div>
    {tab === 'quick' ? <>
      <div className="document-heading"><span className="doc-eyebrow">A FEW SIMPLE STEPS</span><h2>给你的项目，添一点生命力。</h2><p>GIF 用于预览，PNG 图集负责正式渲染。原有动作保留，新动作按需接入。</p></div>
      <GuideStep number="01" title="下载完整包，准备一个新分支" description="解压后将 ai-motion-v2 文件夹放到源项目根目录。建议先提交当前改动。"><CodeBlock code={'git switch arena/25fbb036-latest-aiyunying\ngit switch -c fix/character-motion-v2'} onCopy={copy} /></GuideStep>
      <GuideStep number="02" title="运行安装器，自动备份和重建" description="先检查补丁，再备份原文件、扩展图集，最后校验重建结果。"><CodeBlock code="node ai-motion-v2/install-motion-v2.mjs" onCopy={copy} /></GuideStep>
      <GuideStep number="03" title="把新动作，写进镜头" description="通过绝对时间确定动作帧，支持跳帧、分段渲染和无缝循环。"><CodeBlock code={`// 替换 whale.front(T)，保留明确的逐帧位置\nwhale.motion('${actionId}', T).at(-1, 0, 0);`} onCopy={copy} /></GuideStep>
      <GuideStep number="04" title="检查图集，再看一遍实际镜头" description="机器校验不等于人工审片。改过镜头后，需要重新渲染相应成片。"><CodeBlock code={'npm run atlas:check\nnpm run typecheck && npm test\nnpm run film -- sheet 番外MV/童话镇'} onCopy={copy} /></GuideStep>
    </> : tab === 'guide' ? <>
      <div className="document-heading"><span className="doc-eyebrow">REPLACEMENT GUIDE</span><h2>选对文件，替换就很简单。</h2><p>先确认你要替换的是普通网页图片，还是 Remotion 镜头动作。</p></div>
      <GuideStep number="01" title="普通网页：使用透明 GIF" description="下载当前动作，把 GIF 放到自己的静态目录，再修改实际图片引用。"><CodeBlock code={'<img src="/characters/whale/offer_rice.gif"\n     alt="鲸鱼娘递出饭碗" width="256" height="256"\n     style="image-rendering: pixelated" />'} onCopy={copy} /></GuideStep>
      <GuideStep number="02" title="正式出片：使用图集，不直接加载 GIF" description="Actor.set() 接受图集格子名，不接受 GIF 路径。先安装补丁，再使用 motion() API。"><CodeBlock code={'whale.motion("offer_rice", T).at(-1, 0, 0);\n// 单次播放，播完停在最后一帧\nwhale.motion("bow", localTime, 1, false);'} onCopy={copy} /></GuideStep>
      <GuideStep number="03" title="需要恢复？一条命令回滚" description="恢复安装前保存的六个文件。回滚会覆盖安装后的修改，请先另存。"><CodeBlock code="node ai-motion-v2/install-motion-v2.mjs --rollback" onCopy={copy} /></GuideStep>
      <div className="inline-notice"><BookOpen size={19} /><div><strong>完整步骤、动作对照和常见问题</strong><p>中文 MD 可离线阅读，也可以直接放进项目文档。</p></div><a href="/downloads/replacement-guide.md" download="人物动作替换指南.md" onClick={() => notify('正在下载人物动作替换指南')}>下载 MD<Download size={14} /></a></div>
    </> : <>
      <div className="document-heading"><span className="doc-eyebrow">MADE WITH CARE</span><h2>保留她是谁，再丰富她的表达。</h2><p>在现有像素上，扩充动作时间、分层位移和道具表现。</p></div>
      <div className="notes-section"><h3>这次具体增加了什么？</h3><p>九位角色各有十个通用动作和两个设定专属动作，共一百零八组。每组二十四帧、十二 FPS、两秒循环，并提供透明 GIF、PNG 横向图集和静帧。</p><h3>原项目会发生什么变化？</h3><p>新增 Actor.motion()，扩展图集烘焙流程并增加回归测试。原有头像、格子和默认动画保持不变，旧存档不做修改。实际镜头需明确选用新动作。</p><h3>这套动作不是什么？</h3><p>这是基于现有像素的程序分层动画，不是全新手绘立绘、骨骼动画、口型同步或完整的位移驱动步态系统。原版对比展示的是原始待机静帧。</p><h3>公开使用前，先确认授权</h3><p>原仓库的人物素材再分发许可尚未确认。当前资源仅供项目内评估，不承诺可商用。公开传播或商业发布前，请核实上游授权。</p><h3>关于验证与交付</h3><p>资源和补丁可在本工作台下载。不自动推送 GitHub，不发布成片，也不声称已完成人工整片审看。详细验证范围见替换指南。</p></div>
    </>}
  </div><aside className="docs-sidebar"><div className="download-heading"><Package size={22} /><h3>带走你需要的</h3><p>本地文件，无需登录。</p></div>
    <a className="resource-download" href="/downloads/ai-motion-v2-complete.zip" download onClick={() => notify('正在下载完整资源包')}><span className="file-icon mint"><Package size={20} /></span><span><strong>完整动作资源包</strong><small>ZIP · 108 组 GIF + PNG + 补丁</small></span><Download size={16} /></a>
    <a className="resource-download" href="/downloads/motion-v2.patch" download onClick={() => notify('正在下载引擎补丁')}><span className="file-icon purple"><FileCode2 size={20} /></span><span><strong>引擎集成补丁</strong><small>PATCH · Actor + 图集 + 测试</small></span><Download size={16} /></a>
    <a className="resource-download" href="/downloads/replacement-guide.md" download="人物动作替换指南.md" onClick={() => notify('正在下载替换指南')}><span className="file-icon sand"><FileText size={20} /></span><span><strong>人物动作替换指南</strong><small>MD · 安装、替换与回滚</small></span><Download size={16} /></a>
    <button className="patch-preview-link" onClick={onPatch}>查看补丁内容<ArrowUpRight size={14} /></button>
    <div className="compatibility-note"><ShieldCheck size={18} /><strong>针对当前分支制作</strong><p>基线提交 <code>2779ffd</code><br />安装前自动检查，不强行覆盖。</p></div>
    <a className="source-link" href={REPOSITORY} target="_blank" rel="noreferrer"><Github size={16} />打开原项目<ExternalLink size={13} /></a>
  </aside></section>;
}