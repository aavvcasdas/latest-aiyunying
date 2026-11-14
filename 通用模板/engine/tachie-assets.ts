// 立绘图片地址的注册表：只有浏览器打包时才会碰到这些 .png。
// 作品里 `import '@tpl/tachie-assets';` 一次就够，之后 k.tachie(id) 才找得到图。
import { setTachieUrls } from './tachie';
import whalePng from '../../立绘/art/tachie/whale.png';
import gptPng from '../../立绘/art/tachie/gpt.png';
import claudePng from '../../立绘/art/tachie/claude.png';
import geminiPng from '../../立绘/art/tachie/gemini.png';
import kimiPng from '../../立绘/art/tachie/kimi.png';
import doubaoPng from '../../立绘/art/tachie/doubao.png';
import qwenPng from '../../立绘/art/tachie/qwen.png';
import zaiPng from '../../立绘/art/tachie/zai.png';

setTachieUrls({ whale: whalePng, gpt: gptPng, claude: claudePng, gemini: geminiPng, kimi: kimiPng, doubao: doubaoPng, qwen: qwenPng, zai: zaiPng });
