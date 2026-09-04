import { describe, it, expect } from "vitest";
import {
  snapToGrid,
  snapToWallEndpoints,
  snapToWallMidpoints,
  snapToAngle,
  snapCloseWallEndpoints,
} from "@/lib/snap";
import type { Wall } from "@/types/puter";

describe("CAD Snapping Engine", () => {
  it("snaps points to grid increments accurately", () => {
    expect(snapToGrid({ x: 10.4, y: 5.6 }, 1.0)).toEqual({ x: 10, y: 6 });
    expect(snapToGrid({ x: 10.24, y: 5.26 }, 0.5)).toEqual({ x: 10.0, y: 5.5 });
  });

  it("magnetically snaps to nearest wall endpoints within tolerance", () => {
    const walls: Wall[] = [
      {
        id: "w1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: false,
      },
    ];

    // Close to end (10, 0)
    const snapped = snapToWallEndpoints({ x: 10.3, y: 0.2 }, walls, 0.8);
    expect(snapped).toEqual({ x: 10, y: 0 });

    // Far from any endpoint
    const notSnapped = snapToWallEndpoints({ x: 5, y: 5 }, walls, 0.8);
    expect(notSnapped).toEqual({ x: 5, y: 5 });
  });

  it("magnetically snaps to wall midpoints", () => {
    const walls: Wall[] = [
      {
        id: "w1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: false,
      },
    ];

    // Midpoint is (5, 0)
    const snapped = snapToWallMidpoints({ x: 5.2, y: 0.1 }, walls, 0.8);
    expect(snapped).toEqual({ x: 5, y: 0 });
  });

  it("strictly snaps angles when holding shift (no threshold)", () => {
    const start = { x: 0, y: 0 };
    // Vector aiming at roughly ~42 degrees
    const end = { x: 10, y: 9 };
    const snapped = snapToAngle(start, end, [0, 45, 90, 135, 180, 225, 270, 315]);
    
    // Snaps to exactly 45 degrees
    const angleRad = Math.atan2(snapped.y, snapped.x);
    const angleDeg = (angleRad * 180) / Math.PI;
    expect(Math.round(angleDeg)).toBe(45);
  });

  it("only snaps angles within threshold when specified", () => {
    const start = { x: 0, y: 0 };
    // 2 degrees off horizontal -> should snap to 0
    const closeEnd = { x: 10, y: 0.35 };
    const snappedClose = snapToAngle(start, closeEnd, [0, 90, 180, 270], 4);
    expect(snappedClose.y).toBeCloseTo(0, 4);

    // 20 degrees off horizontal -> exceeds 4 degree threshold -> remains unchanged
    const farEnd = { x: 10, y: 3.6 };
    const snappedFar = snapToAngle(start, farEnd, [0, 90, 180, 270], 4);
    expect(snappedFar.y).toBe(3.6);
  });

  it("welds close wall endpoints together cleanly", () => {
    const walls: Wall[] = [
      {
        id: "w1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: false,
      },
      {
        id: "w2",
        // Endpoint has a 0.08ft gap from w1's end
        start: { x: 10.08, y: 0.05 },
        end: { x: 10, y: 10 },
        thickness: 6,
        height: 10,
        isLoadBearing: false,
      },
    ];

    const welded = snapCloseWallEndpoints(walls, 0.15);
    expect(welded[1]?.start).toEqual(welded[0]?.end);
  });
});
