// 立绘图片地址的注册表：只有浏览器打包时才会碰到这些 .png。
// 作品里 `import '@tpl/tachie-assets';` 一次就够，之后 k.tachie(id) 才找得到图。
import { setTachieUrls, setTachieRigid } from './tachie';
import whalePng from '../../人物/立绘/art/tachie/whale.png';
import gptPng from '../../人物/立绘/art/tachie/gpt.png';
import claudePng from '../../人物/立绘/art/tachie/claude.png';
import geminiPng from '../../人物/立绘/art/tachie/gemini.png';
import kimiPng from '../../人物/立绘/art/tachie/kimi.png';
import doubaoPng from '../../人物/立绘/art/tachie/doubao.png';
import qwenPng from '../../人物/立绘/art/tachie/qwen.png';
import zaiPng from '../../人物/立绘/art/tachie/zai.png';

setTachieUrls({ whale: whalePng, gpt: gptPng, claude: claudePng, gemini: geminiPng, kimi: kimiPng, doubao: doubaoPng, qwen: qwenPng, zai: zaiPng });

// Additive generated character; historical pixel atlas and eight tachie stay intact.
import cutoutBase from './assets/rigid/whale/body.png';
setTachieUrls({whale_cutout:cutoutBase});

import bind from './assets/rigid/whale/bind.json';
import type { RigidBind } from './rigid-character';
import rigid_body from './assets/rigid/whale/body.png';
import rigid_eye_R from './assets/rigid/whale/eye_R.png';
import rigid_eye_L from './assets/rigid/whale/eye_L.png';
import rigid_arm_R_upper from './assets/rigid/whale/arm_R_upper.png';
import rigid_arm_R_lower from './assets/rigid/whale/arm_R_lower.png';
import rigid_arm_R_end from './assets/rigid/whale/arm_R_end.png';
import rigid_arm_L_upper from './assets/rigid/whale/arm_L_upper.png';
import rigid_arm_L_lower from './assets/rigid/whale/arm_L_lower.png';
import rigid_arm_L_end from './assets/rigid/whale/arm_L_end.png';
import rigid_leg_R_upper from './assets/rigid/whale/leg_R_upper.png';
import rigid_leg_R_lower from './assets/rigid/whale/leg_R_lower.png';
import rigid_leg_R_end from './assets/rigid/whale/leg_R_end.png';
import rigid_leg_L_upper from './assets/rigid/whale/leg_L_upper.png';
import rigid_leg_L_lower from './assets/rigid/whale/leg_L_lower.png';
import rigid_leg_L_end from './assets/rigid/whale/leg_L_end.png';
setTachieRigid('whale_cutout',bind as unknown as RigidBind,{body:rigid_body,eye_R:rigid_eye_R,eye_L:rigid_eye_L,arm_R_upper:rigid_arm_R_upper,arm_R_lower:rigid_arm_R_lower,arm_R_end:rigid_arm_R_end,arm_L_upper:rigid_arm_L_upper,arm_L_lower:rigid_arm_L_lower,arm_L_end:rigid_arm_L_end,leg_R_upper:rigid_leg_R_upper,leg_R_lower:rigid_leg_R_lower,leg_R_end:rigid_leg_R_end,leg_L_upper:rigid_leg_L_upper,leg_L_lower:rigid_leg_L_lower,leg_L_end:rigid_leg_L_end});
