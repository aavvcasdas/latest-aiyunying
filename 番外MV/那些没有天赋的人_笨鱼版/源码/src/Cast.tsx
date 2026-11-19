import { useEffect, useRef } from "react";
import { AIS, figure, sigil, whale } from "./mv/art";

// 角色小卡：用同一套矢量美术画出来
export function CastCard({ i }: { i: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!;
    c.clearRect(0, 0, 160, 200);
    const g = c.createRadialGradient(80, 40, 4, 80, 60, 130);
    g.addColorStop(0, AIS[i].color + "55");
    g.addColorStop(1, "#00000000");
    c.fillStyle = g;
    c.fillRect(0, 0, 160, 200);
    figure(c, 80, 186, 150, i, 1, "#0a0c13");
    sigil(c, i, 80, 22, 13, AIS[i].color, 0.95);
  }, [i]);
  return <canvas ref={ref} width={160} height={200} className="h-[130px] w-[104px]" />;
}

export function WhaleCard() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!;
    c.clearRect(0, 0, 160, 200);
    const g = c.createRadialGradient(80, 100, 4, 80, 100, 110);
    g.addColorStop(0, "#4d6bfe55");
    g.addColorStop(1, "#00000000");
    c.fillStyle = g;
    c.fillRect(0, 0, 160, 200);
    whale(c, { x: 82, y: 108, s: 0.62, flip: -1, bowl: 1, mood: "neutral" });
  }, []);
  return <canvas ref={ref} width={160} height={200} className="h-[130px] w-[104px]" />;
}
