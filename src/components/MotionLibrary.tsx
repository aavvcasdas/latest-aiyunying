import { motion } from 'framer-motion';
import { ArrowRight, Check, Download, Search, Sparkles, X } from 'lucide-react';
import type { RefObject } from 'react';
import { asset, CATEGORIES, type Action, type Character } from '../data';
import { Sprite } from './Preview';

export function SearchInput({ value, onChange, inputRef }: { value: string; onChange: (value: string) => void; inputRef: RefObject<HTMLInputElement | null> }) {
  return <div className="search-input"><Search size={14} /><input ref={inputRef} aria-label="搜索动作" value={value} onChange={(event) => onChange(event.target.value)} placeholder="搜索动作..." />{value ? <button aria-label="清除搜索" onClick={() => onChange('')}><X size={13} /></button> : <kbd>/</kbd>}</div>;
}

export function CategoryTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="category-tabs" aria-label="动作分类">{CATEGORIES.map((item) => <button key={item} className={value === item ? 'selected' : ''} onClick={() => onChange(item)} aria-pressed={value === item}>{item}{item === '专属动作' && <Sparkles size={12} />}</button>)}</div>;
}

export function ActionTile({ owner, action, selected, index, onSelect, onDownload, showOwner }: { owner: Character; action: Action; selected?: boolean; index: number; onSelect: () => void; onDownload: () => void; showOwner?: boolean }) {
  return <motion.div className={`action-tile ${selected ? 'selected' : ''}`} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: index * .025 }}><button className="action-select" onClick={onSelect} aria-label={`预览${owner.name}的${action.name}`} aria-pressed={!!selected}><div className="action-art"><Sprite character={owner} action={action} thumbnail index={index} />{selected ? <span className="selected-action-check"><Check size={11} strokeWidth={3} /></span> : action.category === '专属动作' ? <span className="exclusive-label">专属</span> : <span className="format-label">GIF</span>}</div><div className="action-details"><h3>{action.name}</h3><span>{showOwner ? owner.name : action.id}<span className="action-detail-dot">·</span>{showOwner ? owner.model : '24 帧'}</span></div></button><a className="action-download" aria-label={`下载${owner.name}的${action.name} GIF`} title="下载 GIF" href={asset(owner.id, `${action.id}.gif`)} download={`${owner.id}-${action.id}.gif`} onClick={onDownload}><Download size={13} /></a></motion.div>;
}

export function EmptyResults({ onReset }: { onReset: () => void }) {
  return <div className="empty-results"><Search size={28} strokeWidth={1.4} /><h3>这个小动作，还没找到。</h3><p>试试动作名称、英文 ID，或换一个分类。</p><button className="button button-secondary" onClick={onReset}>清除筛选<ArrowRight size={14} /></button></div>;
}