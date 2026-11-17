// 模板自带 ZCOOL KuaiLe 字体加载：优先读取本地 ./assets/，单文件独立打开时自动回退至目标分支原文件
export const FONT_FAMILY = 'ZCOOL KuaiLe';
export const FONT_URLS = [
  './assets/ZCOOLKuaiLe-Regular.ttf',
  'https://raw.githubusercontent.com/aavvcasdas/latest-aiyunying/arena/bb6a02da-latest-aiyunying/%E9%80%9A%E7%94%A8%E6%A8%A1%E6%9D%BF/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf',
];
export const FONT = `"${FONT_FAMILY}","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;

let pending: Promise<void> | null = null;

export function loadFonts(): Promise<void> {
  if (!pending) {
    pending = (async () => {
      for (const url of FONT_URLS) {
        try {
          const face = new FontFace(FONT_FAMILY, `url("${url}") format('truetype')`, {
            weight: '400',
            style: 'normal',
          });
          await face.load();
          document.fonts.add(face);
          await document.fonts.ready;
          document.fonts.check(`58px "${FONT_FAMILY}"`, '慌啥子嘛慢慢来');
          return;
        } catch {
          // 尝试下一候选源
        }
      }
      await document.fonts.ready;
    })();
  }
  return pending;
}
