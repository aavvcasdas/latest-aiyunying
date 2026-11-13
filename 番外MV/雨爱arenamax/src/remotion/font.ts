import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

// 字体只加载一次，但 delayRender 必须在渲染进程「正在渲这一帧」的时候挂着。
// 原来在模块顶层直接 delayRender，等于每个渲染标签页开页面时就挂一个句柄：
// 多帧并发时经常有句柄没人清，渲染跑到两成多就抛
//   A delayRender() "Loading the Chinese subtitle font" ... not cleared after 298000ms
// 改成组件里 useEffect 加载（官方 @remotion/google-fonts 就是这么做的），句柄和这一帧同生共死。
const FONT_FAMILY = 'Rain Sans';
const FONT_URL = staticFile('fonts/rain-sans.woff2');

let pending: Promise<void> | null = null;

/** 全进程只真正加载一次；重复调用拿同一个 Promise */
function loadRainSans(): Promise<void> {
  if (!pending) {
    pending = (async () => {
      const font = new FontFace(FONT_FAMILY, `url("${FONT_URL}")`, { weight: '100 900' });
      const loaded = await font.load();
      document.fonts.add(loaded);
      // 等排版真正可用，否则第一帧的字会是兜底字体
      await document.fonts.ready;
    })();
  }
  return pending;
}

export type FontState = 'loading' | 'ready' | 'error';

/**
 * 在合成里调用：返回字体是否就绪。
 * 未就绪时挂一个 delayRender 句柄（每次挂载一个，卸载时清），就绪后自动放行。
 */
export function useRainSans(): FontState {
  const [state, setState] = useState<FontState>('loading');

  useEffect(() => {
    let alive = true;
    if (typeof document === 'undefined') { setState('ready'); return; }
    // 已经加载好的就不必再挂句柄
    if (pending && document.fonts.check(`400 16px "${FONT_FAMILY}"`)) {
      setState('ready');
      return;
    }
    const handle = delayRender('Loading the Chinese subtitle font');
    loadRainSans()
      .then(() => {
        if (!alive) return;
        continueRender(handle);
        setState('ready');
      })
      .catch((error: unknown) => {
        cancelRender(error);
      });
    return () => { alive = false; };
  }, []);

  return state;
}

/** 非组件环境（比如渲染前的预检）用的直接加载 */
export { loadRainSans, FONT_FAMILY };
