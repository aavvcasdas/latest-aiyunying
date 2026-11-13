import { useEffect, useRef, useState } from "react";
import atlasUrl from "@/assets/cast_atlas.png";
import type { MVPlayer } from "@/hooks/useMVPlayer";
import type { Cue } from "@/lib/mv";
import { FH, FW } from "@/lib/mv";
import { Stage } from "@/three/stage";

interface Props {
  p: MVPlayer;
  cue: Cue;
  fxOn: boolean;
  words3d: boolean;
  showTags: boolean;
  pointer: React.MutableRefObject<{ x: number; y: number; tx: number; ty: number }>;
  onReady?: () => void;
}

/** three.js 画布：固定按 1600×900 渲，外层整体缩放贴屏 */
export function StageView({ p, cue, fxOn, words3d, showTags, pointer, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<Stage | null>(null);
  const cueRef = useRef(cue);
  cueRef.current = cue;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: Stage;
    try {
      stage = new Stage(canvas);
    } catch (err) {
      console.error("[stage] WebGL 不可用", err);
      setFailed(true);
      return;
    }
    stageRef.current = stage;
    if ((window as unknown as { __stage?: Stage }).__stage === undefined) {
      (window as unknown as { __stage?: Stage }).__stage = stage; // 调试/出片测速用，不影响画面
    }
    stage.setCue(cueRef.current, true);
    let alive = true;
    stage
      .ready(atlasUrl)
      .then(() => {
        if (alive) onReady?.();
      })
      .catch((e) => console.error("[stage] 图集加载失败", e));

    const unsub = p.subscribe((t, e) => {
      const pt = pointer.current;
      pt.x += (pt.tx - pt.x) * 0.06;
      pt.y += (pt.ty - pt.y) * 0.06;
      stage.pointer.x = pt.x;
      stage.pointer.y = pt.y;
      stage.update(t, e);
    });
    return () => {
      alive = false;
      unsub();
      stage.dispose();
      stageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    stageRef.current?.setCue(cue);
  }, [cue]);

  useEffect(() => {
    stageRef.current?.setFx(fxOn);
  }, [fxOn]);

  useEffect(() => {
    const s = stageRef.current;
    if (s) s.words.enabled = words3d;
  }, [words3d]);

  useEffect(() => {
    const s = stageRef.current;
    if (!s) return;
    s.showTags = showTags;
    s.setCue(cueRef.current, true);
  }, [showTags]);

  return (
    <>
      <canvas ref={canvasRef} width={FW} height={FH} className="absolute inset-0 block" style={{ width: FW, height: FH }} />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-[#0c0819]">
          <div className="paper max-w-[520px] rounded-[3px] p-6 text-center">
            <div className="font-display text-[26px] text-[#241c44]">这台机器打不开 WebGL</div>
            <p className="mt-2 text-[13px] text-[#4a3d63]">立体世界要靠显卡画。换一个支持 WebGL2 的浏览器（Chrome / Edge / Firefox / Safari 16+）再试。</p>
          </div>
        </div>
      )}
    </>
  );
}
