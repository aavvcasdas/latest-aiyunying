// 本鲸整套动作在「通用模板」引擎里的清晰度检查镜头。
// 每个动作一个全屏镜头，直接用 FilmEngine / Actor.act() 渲染 1920×1080 合成；
// 不是 actions_preview 的 2D atlas 截图，也不是额外生成的角色美术。
import * as THREE from 'three';
import { ACTIONS } from '@tpl/actors';
import { cam, type Kit, type ShotDef } from '@tpl/core';
import { canvasTex, disc } from '@tpl/kit';

const NAMES = Object.keys(ACTIONS.whale) as string[];
const phaseOf = (name: string) => name === 'point' ? 0.625 : 0.25;

function actionLabel(name: string): THREE.Sprite {
  const tex = canvasTex(320, 56, (c) => {
    c.fillStyle = 'rgba(8, 12, 24, 0.9)';
    c.fillRect(0, 0, 320, 56);
    c.strokeStyle = '#86efac';
    c.lineWidth = 2;
    c.strokeRect(1, 1, 318, 54);
    c.fillStyle = '#e5e7eb';
    c.font = 'bold 26px ui-monospace, SFMono-Regular, Menlo, monospace';
    c.textBaseline = 'middle';
    c.fillText(name, 14, 29);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(2.2, 0.38, 1);
  return s;
}

export const SHOTS: ShotDef[] = NAMES.map((name, i) => ({
  id: `A${String(i + 1).padStart(2, '0')}_${name}`,
  look: 'day',
  title: `${name} · ${ACTIONS.whale[name].label}`,
  note: `第 ${i + 1}/${NAMES.length} 个派生动作；用真实模板卡片 shader 渲染，检查手臂、饭碗与边缘在 1920×1080 合成里的清晰度。`,
  cast: ['whale'],
  build: (k: Kit) => {
    k.add(disc(60, 0x18223a, -0.02));
    k.add(actionLabel(name), 0, 3.05, 0);
    const whale = k.actor('whale');
    const A = cam([0, 1.8, 7], [0, 1.4, 0], 34);
    return ({ t }) => {
      whale.act(name, t + phaseOf(name)).at(0, 0, 0).size(1.7).noShadow();
      return A;
    };
  },
}));
