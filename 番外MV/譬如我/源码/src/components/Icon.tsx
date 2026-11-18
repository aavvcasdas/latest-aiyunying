import type { CSSProperties } from 'react'

export type IconName = 'play' | 'pause' | 'next' | 'volume' | 'mute' | 'expand' | 'shrink' | 'bookmark' | 'check' | 'book' | 'film' | 'lyrics' | 'cast' | 'left' | 'right' | 'arrow' | 'close' | 'headphones' | 'settings' | 'download' | 'loop' | 'info' | 'link' | 'sun' | 'sound' | 'menu' | 'back' | 'cc'

const paths: Record<IconName, React.ReactNode> = {
  play: <path d="m7 4.7 13 7.3-13 7.3z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" /></>,
  next: <><path d="m5 5 11 7-11 7z" fill="currentColor" stroke="none" /><path d="M19 5v14" strokeWidth="2.6" /></>,
  volume: <><path d="m11 4-5.3 4.5H2.5v7h3.2L11 20z" /><path d="M15.4 8a6 6 0 0 1 0 8m3-11.3a10 10 0 0 1 0 14.6" /></>,
  mute: <><path d="m11 4-5.3 4.5H2.5v7h3.2L11 20z" /><path d="m16 9 5 6m0-6-5 6" /></>,
  expand: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />,
  shrink: <path d="M3 9h6V3m6 0v6h6M9 21v-6H3m18 0h-6v6" />,
  bookmark: <path d="M5.5 4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17l-6.5-4-6.5 4z" />,
  check: <path d="m4 12 5 5L20 6" />,
  book: <><path d="M3 4.5c3.5-1 6.5-.5 9 1.5 2.5-2 5.5-2.5 9-1.5v14c-3.5-1-6.5-.5-9 1.5-2.5-2-5.5-2.5-9-1.5z" /><path d="M12 6v14" /></>,
  film: <><rect x="2.5" y="4.5" width="19" height="15" rx="2" /><path d="M7 4.5v15m10-15v15M2.5 9H7m-4.5 6H7m10-6h4.5M17 15h4.5" /></>,
  lyrics: <><rect x="3" y="4" width="18" height="15" rx="2.5" /><path d="M7 9h10M7 13h7m-8 6v2l4-2" /></>,
  cast: <><circle cx="9" cy="8" r="3.3" /><path d="M2.5 20c0-4.3 2.6-7 6.5-7s6.5 2.7 6.5 7m.8-15.2a3.3 3.3 0 0 1 0 6.4m1.1 2.2c2.5.6 4.1 2.8 4.1 6.6" /></>,
  left: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  right: <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  arrow: <path d="M5 18 18 5M6.5 5H18v11.5" />,
  back: <path d="M20 12H4m7-7-7 7 7 7" />,
  close: <path d="m5 5 14 14m0-14L5 19" />,
  headphones: <><path d="M3.5 14v-3a8.5 8.5 0 0 1 17 0v3" /><rect x="2.5" y="12" width="4.5" height="8" rx="2" /><rect x="17" y="12" width="4.5" height="8" rx="2" /></>,
  settings: <><path d="m9.8 2.8 4.4.1.8 2.5 2 .9 2.5-.9 2 3.7-1.8 1.9v2.1l1.8 2-2.1 3.6-2.4-.7-2.1 1.2-.6 2.2H9.8l-.7-2.4-2.1-1-2.5.7-2-3.6 1.8-1.9v-2.3L2.6 9l2-3.6 2.4.8 2.1-1.1z" /><circle cx="12" cy="12" r="3" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5" /></>,
  loop: <><path d="M4 11a8 8 0 1 1 2.5 7M4 4v7h7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.25" /></>,
  link: <><path d="m9 15 6-6m-3 7-2 2a4.7 4.7 0 0 1-6.6-6.6l3-3m5.6-.4 2-2a4.7 4.7 0 0 1 6.6 6.6l-3 3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2" /></>,
  sound: <path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  cc: <><rect x="1.5" y="4" width="21" height="16" rx="3" /><path d="M10.5 9a3.1 3.1 0 1 0 0 6m7-6a3.1 3.1 0 1 0 0 6" /></>,
}

export function Icon({ name, size = 20, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>{paths[name]}</svg>
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? 'brand-compact' : ''}`}>
    <svg className="brand-mark" viewBox="0 0 42 40" fill="none" aria-hidden="true">
      <path d="M3 9.5c8.8.1 11 8.5 17.6 9.3L32 14l-5.1 10.8c-3.4 7.2-13 10-18.8 4.3C3.2 24.3 6.5 16.7 3 9.5Z" fill="currentColor" />
      <path d="M24 16.2c-.3-8.2 2.8-11.5 6.1-13.8 1.7 3.3 2 6.2.8 9.7 3.4-3.1 6.5-3.8 10.3-3.5-2.9 6.7-7.5 9.5-13.7 9.6Z" fill="currentColor" />
      <path d="m12.6 18 7.3 4.1-7.3 4.1Z" fill="#092327" />
    </svg>
    <span className="brand-type"><strong>鲸映</strong><span>WHALE CINEMA</span></span>
  </span>
}