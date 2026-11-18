/// <reference types="vite/client" />

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}

interface MvHook {
  ready: () => boolean;
  seek: (t: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  duration: () => number;
  time: () => number;
  setLyrics: (visible: boolean) => void;
  render: (t: number, clean?: boolean, width?: number) => string;
  shots: () => { index: number; a: number; b: number; scene: string; v: string; label: string }[];
}

interface Window {
  __mv?: MvHook;
  __seek?: (t: number) => void;
  __mvRender?: (t: number, noLyrics?: boolean) => string;
}
