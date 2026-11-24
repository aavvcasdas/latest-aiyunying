// Declarative rig-layer schema. The current art is a single transparent full-body
// PNG per character, so no independent eyes / mouth / hands layers exist yet.
// These types let a future layered source plug into the same spine rig without
// changing the action API — and they make the limitation explicit to QA.
import anchorsJson from "../../../../通用模板/engine/assets/tachie_anchors.json";
import type { CastId } from "./types";

export interface RigLayerSpec {
  /** Stable layer id, e.g. eyes, mouth, handL, handR. */
  id: string;
  /** Workspace-relative PNG path. */
  src: string;
  /** Anchor in normalized base-image coordinates. */
  anchor: { x: number; y: number };
  /** Which spine segment this layer follows. */
  follows: "head" | "torso" | "legs";
  /** Draw order; larger is closer to camera. */
  z: number;
}

export interface RigManifest {
  id: CastId;
  base: string;
  w: number;
  h: number;
  neck: number;
  cx: number;
  hx: number;
  layerStatus: "single-layer" | "layered";
  layers: RigLayerSpec[];
}

type AnchorJson = {
  schema: number;
  layerStatus: "single-layer" | "layered";
  anchors: Record<CastId, {
    name: string; w: number; h: number; neck: number; cx: number; hx: number;
    base: string; layers: Record<string, string | null>;
  }>;
};

const data = anchorsJson as AnchorJson;

export const RIG_LAYERS: Record<CastId, RigManifest> = Object.fromEntries(
  (Object.keys(data.anchors) as CastId[]).map((id) => {
    const a = data.anchors[id];
    const layers: RigLayerSpec[] = Object.entries(a.layers)
      .filter(([, src]) => typeof src === "string")
      .map(([layerId, src], i) => ({
        id: layerId, src: String(src), anchor: { x: 0.5, y: 0.5 },
        follows: layerId.includes("hand") ? "torso" : "head", z: i + 1,
      }));
    return [id, {
      id, base: a.base, w: a.w, h: a.h, neck: a.neck, cx: a.cx, hx: a.hx,
      layerStatus: layers.length ? "layered" : "single-layer", layers,
    }];
  }),
) as Record<CastId, RigManifest>;

/** True only when a real layered source has been registered. */
export function hasIndependentLayers(id: CastId): boolean {
  return RIG_LAYERS[id].layerStatus === "layered";
}

/** Fail fast rather than silently pretending a single image can blink or lip-sync. */
export function requireLayer(id: CastId, layer: "eyes" | "mouth" | "hands"): RigLayerSpec {
  const found = RIG_LAYERS[id].layers.find((l) => l.id === layer);
  if (!found) throw new Error(`[rig] ${id} 没有独立「${layer}」图层；当前立绘是单张图，不能做眨眼 / 口型 / 抬手`);
  return found;
}
