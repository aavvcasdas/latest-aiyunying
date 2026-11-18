import { useState } from 'react'
import { Icon } from './Icon'
import { repository, clock, type CastMember } from '../data/film'

export function Notes({ initial = 'notes' }: { initial?: 'notes' | 'sources' }) {
  const [tab, setTab] = useState(initial)
  return <div className="notes-content">
    <div className="notes-cover"><img src="/images/workshop.jpg" alt="那盏始终亮着的书桌台灯" /><div /><span>WHALE CINEMA <i>/</i> PRODUCTION JOURNAL</span></div>
    <div className="notes-body"><div className="journal-tabs"><button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>创作手记</button><button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>素材与制作</button></div>
      {tab === 'notes' ? <div className="journal-article panel-enter"><span className="small-label">DIRECTOR'S NOTE</span><h2>在聚光灯之外</h2><p className="journal-lead">「我能不能在某个角落」不是认输，而是把问题从「我能不能赢」，换成「我还想做什么」。</p><h3>城市很大，工坊很小。</h3><p>本鲸怕自己只有「便宜」才值得被需要。城市把最亮的灯留给了天才，而她把一盏小台灯，留给还没写完的那一页。这不是 AI 的能力排名，而是借她的目光，讲一个普通人的故事。</p><h3>同一句歌词，三次不同的回答。</h3><p>第一次的「譬如我」藏在暗巷；第二次，她在同行者的陪伴下重新摊开草稿；最后一次，她不再仰望高台。那只装过饭的蓝碗成了花盆，花开在没有观众的地方。</p><div className="journal-sign"><span />鲸映创作组 <small>WHALE CINEMA</small></div></div> : <div className="journal-article panel-enter"><span className="small-label">PRODUCTION FILE</span><h2>《譬如我》制作档案</h2><dl className="credits-list"><div><dt>原声音轨</dt><dd>从指定分支的《譬如我.mp4》无重编码提取；同分支 MP3 作为兼容音源。</dd></div><div><dt>角色来源</dt><dd>分支原始像素图集与动作帧。人物性格参考 Agent-Reach 调研及项目设定，不代表官方设定。</dd></div><div><dt>画面创作</dt><dd>六幅原创 AI 辅助场景，以城市、稿纸、追光和花朵构成四幕。封面为本鲸的概念插画，演出沿用分支角色。</dd></div><div><dt>字幕对齐</dt><dd>以提供的歌词为文本，使用中文 CTC 模型与实际音轨强制对齐。41 句、358 个字；词组按语义分段。自动结果尚未经全曲人工听校。</dd></div><div><dt>制作方法</dt><dd>沿用《情歌》的音频主时钟与独立字幕合成思路，不复用其琥珀、书信及回忆场景。</dd></div></dl><div className="ass-downloads"><span>可编辑立体字幕</span><a href="/media/lyrics-character.ass" download="譬如我-逐字.ass">逐字 ASS <Icon name="download" size={12} /></a><a href="/media/lyrics-word.ass" download="譬如我-整词.ass">整词 ASS <Icon name="download" size={12} /></a></div><a className="source-link" href={repository} target="_blank" rel="noreferrer"><Icon name="link" size={15} />查看项目分支与素材来源<Icon name="arrow" size={13} /></a><p className="rights-note">非官方二次创作预览。音乐和角色的公开传播、商用授权需另行确认。</p></div>}
      <div className="download-strip"><a className="download-film" href="/downloads/someone-like-me.mp4" download="譬如我-鲸映原创MV.mp4"><Icon name="download" size={15} />下载成片 <small>MP4</small></a><a href="/media/word-timings.json" download="譬如我-逐字时间轴.json">逐字时间轴<Icon name="download" size={13} /></a></div>
    </div>
  </div>
}

export function CharacterDetail({ member: c, onPlay }: { member: CastMember; onPlay: () => void }) {
  return <div className="character-detail"><div className="character-portrait" style={{ background: `radial-gradient(ellipse at 50% 80%, ${c.color}24, transparent 68%)` }}><span className="small-label">CHARACTER STUDY</span><img src={`/cast/${c.id}.png`} alt={c.name} /></div><div className="character-copy"><span className="small-label" style={{ color: c.color }}>{c.model}</span><h2>{c.name}<small>{c.role}</small></h2><p>{c.note}</p><h3>在《譬如我》中</h3><p>{c.scene}</p><div className="character-prop"><span>角色道具</span>{c.prop}</div><button className="primary-action" onClick={onPlay}><Icon name="play" size={15} />观看出场镜头 <span className="mono">{clock(c.time)}</span></button></div></div>
}