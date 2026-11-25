/// <reference types="vite/client" />

declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

interface MVHook {
  ready: () => boolean;
  render: (t: number, clean?: boolean, width?: number) => string;
  cover: (t: number, width?: number) => string;
  seek: (t: number) => void;
  duration: number;
}

interface Window {
  __mv?: MVHook;
  __seek?: (t: number) => void;
  __mvSeek?: (t: number) => void;
  __mvRender?: (t: number, clean?: boolean) => string;
  __mvCover?: (t: number) => string;
}
