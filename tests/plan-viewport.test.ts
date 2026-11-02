import { it, expect } from "vitest";
import { fitPlanViewport } from "@/lib/plan-viewport";
import { createDemoProject } from "@/lib/demo-project";
it("centers and fits the same plan on a phone and desktop viewport", () => {
  const layout = createDemoProject("viewport").floorPlanData!;
  for (const [width, height] of [
    [390, 650],
    [1352, 908],
  ]) {
    const viewport = fitPlanViewport(layout, width!, height!),
      points = layout.walls.flatMap((w) => [w.start, w.end]);
    const xs = points.map(
        (p) => p.x * 0.3048 * 50 * viewport.scale + viewport.x,
      ),
      ys = points.map((p) => p.y * 0.3048 * 50 * viewport.scale + viewport.y);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(width!);
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(Math.max(...ys)).toBeLessThan(height!);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(width! / 2);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(height! / 2);
  }
});
