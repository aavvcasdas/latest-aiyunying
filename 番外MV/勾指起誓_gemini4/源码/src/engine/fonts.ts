export const FONT_FAMILY = 'ZCOOL KuaiLe';
export const FONT_FILE = 'ZCOOLKuaiLe-Regular.ttf';
export const FONT = `"${FONT_FAMILY}","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif`;

const fontUrl = './assets/ZCOOLKuaiLe-Regular.ttf';
export const cssUrl = (u: string) => `url("${u.replace(/["\\\n]/g, (c) => (c === '\n' ? '\\a ' : `\\${c}`))}")`;

let pending: Promise<void> | null = null;
export function loadFonts(): Promise<void> {
  if (!pending) {
    pending = (async () => {
      try {
        const face = new FontFace(FONT_FAMILY, `${cssUrl(fontUrl)} format('truetype')`, {
          weight: '400',
          style: 'normal',
        });
        await face.load();
        document.fonts.add(face);
        await document.fonts.ready;
      } catch (err) {
        console.warn('[fonts] Fallback font in use:', err);
      }
    })();
  }
  return pending;
}
