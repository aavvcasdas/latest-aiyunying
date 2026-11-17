// 序章 I1 纯净两行片名卡（严格遵循目标分支规矩：零水印、零角标、只放片名与副题）
import React from 'react';
import { FONT } from '../mv/fonts';

interface TitleCardProps {
  visible: boolean;
  progress: number;
  S: number;
}

export const TitleCard: React.FC<TitleCardProps> = ({ visible, progress, S }) => {
  if (!visible || progress <= 0.01) return null;
  const lift = (1 - progress) * 18 * S;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-start"
      style={{
        paddingTop: `${115 * S}px`,
        opacity: progress,
        transform: `translateY(${lift}px)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: `${118 * S}px`,
          lineHeight: 1.08,
          color: '#fff8e7',
          letterSpacing: `${14 * S}px`,
          textShadow: `0 ${6 * S}px 0 #3b2116, 0 ${12 * S}px ${36 * S}px rgba(0,0,0,0.55), 0 0 ${42 * S}px rgba(255,209,102,0.45)`,
        }}
      >
        慌啥子嘛
      </div>
      <div
        style={{
          marginTop: `${16 * S}px`,
          padding: `${6 * S}px ${32 * S}px`,
          borderTop: `${2.5 * S}px solid rgba(255, 216, 110, 0.85)`,
          borderBottom: `${2.5 * S}px solid rgba(255, 216, 110, 0.85)`,
          fontSize: `${40 * S}px`,
          color: '#ffd86b',
          letterSpacing: `${12 * S}px`,
          textShadow: `0 ${3 * S}px ${12 * S}px rgba(0,0,0,0.6)`,
        }}
      >
        慢慢来
      </div>
    </div>
  );
};
