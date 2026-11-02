import type { FloorPlanLayout } from "@/types/puter";
/** Coordinates are feet in the document and 50 pixels per meter in the drawing group. */
export function fitPlanViewport(
  layout: FloorPlanLayout | null,
  width: number,
  height: number,
) {
  const points = layout?.walls.flatMap((w) => [w.start, w.end]) ?? [];
  if (layout?.blueprint) {
    const b = layout.blueprint,
      w = b.widthPixels / b.pixelsPerFoot,
      h = b.heightPixels / b.pixelsPerFoot;
    points.push({ x: -w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 });
  }
  if (!points.length) return { scale: 1, x: width / 2, y: height / 2 };
  const units = 0.3048 * 50,
    xs = points.map((p) => p.x * units),
    ys = points.map((p) => p.y * units),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = Math.max(
    0.05,
    Math.min(
      2.5,
      (width - 64) / Math.max(maxX - minX, 1),
      (height - 64) / Math.max(maxY - minY, 1),
    ) * 0.85,
  );
  return {
    scale,
    x: width / 2 - ((minX + maxX) / 2) * scale,
    y: height / 2 - ((minY + maxY) / 2) * scale,
  };
}
