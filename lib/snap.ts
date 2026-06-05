import type { Vec2D, Wall } from "@/types/puter";

/**
  * Snaps a 2D coordinate to the nearest grid size (in feet).
  */
export function snapToGrid(pt: Vec2D, gridSize = 1.0): Vec2D {
  return {
    x: Math.round(pt.x / gridSize) * gridSize,
    y: Math.round(pt.y / gridSize) * gridSize,
  };
}

/**
  * Snaps a target point to any nearby wall endpoints (Magnetic snapping).
  * Tolerance is in feet. Returns the snapped point if found, otherwise returns original.
  */
export function snapToWallEndpoints(pt: Vec2D, walls: Wall[], tolerance = 1.0): Vec2D {
  let closestPt = { ...pt };
  let minDistance = Infinity;

  walls.forEach((wall) => {
    // Check wall start
    const distStart = Math.hypot(pt.x - wall.start.x, pt.y - wall.start.y);
    if (distStart < minDistance && distStart <= tolerance) {
      minDistance = distStart;
      closestPt = { ...wall.start };
    }

    // Check wall end
    const distEnd = Math.hypot(pt.x - wall.end.x, pt.y - wall.end.y);
    if (distEnd < minDistance && distEnd <= tolerance) {
      minDistance = distEnd;
      closestPt = { ...wall.end };
    }
  });

  return closestPt;
}

/**
  * Snaps a vector (end point relative to start point) to key angles (e.g. 0, 45, 90, 135, 180 degrees).
  * Useful for drawing perfectly horizontal, vertical, or 45-degree walls!
  */
export function snapToAngle(start: Vec2D, end: Vec2D, snapAngles = [0, 45, 90, 135, 180, 225, 270, 315]): Vec2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) return end;

  // Calculate angle in degrees (0 to 360)
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  // Find the closest snap angle
  let closestAngle = snapAngles[0] || 0;
  let minDiff = Infinity;

  snapAngles.forEach((snapAngle) => {
    let diff = Math.abs(angle - snapAngle);
    // Handle wrap around difference (e.g. 359 vs 0)
    if (diff > 180) diff = 360 - diff;

    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = snapAngle;
    }
  });

  // Reconstruct point from closest angle and length
  const rad = (closestAngle * Math.PI) / 180;
  return {
    x: start.x + length * Math.cos(rad),
    y: start.y + length * Math.sin(rad),
  };
}

/**
 * Snaps any wall endpoints that are within `tolerance` feet of each other
 * to the exact same coordinates to ensure clean CAD joins and eliminate visual gaps.
 */
export function snapCloseWallEndpoints(walls: Wall[], tolerance = 0.15): Wall[] {
  // Make a deep copy of start/end coordinates to avoid mutating state directly
  const snapped = walls.map(w => ({
    ...w,
    start: { x: w.start.x, y: w.start.y },
    end: { x: w.end.x, y: w.end.y }
  }));

  for (let i = 0; i < snapped.length; i++) {
    const w1 = snapped[i]!;
    for (let j = 0; j < snapped.length; j++) {
      if (i === j) continue;
      const w2 = snapped[j]!;

      // Start to Start
      if (Math.hypot(w1.start.x - w2.start.x, w1.start.y - w2.start.y) < tolerance) {
        w2.start.x = w1.start.x;
        w2.start.y = w1.start.y;
      }
      // Start to End
      if (Math.hypot(w1.start.x - w2.end.x, w1.start.y - w2.end.y) < tolerance) {
        w2.end.x = w1.start.x;
        w2.end.y = w1.start.y;
      }
      // End to Start
      if (Math.hypot(w1.end.x - w2.start.x, w1.end.y - w2.start.y) < tolerance) {
        w2.start.x = w1.end.x;
        w2.start.y = w1.end.y;
      }
      // End to End
      if (Math.hypot(w1.end.x - w2.end.x, w1.end.y - w2.end.y) < tolerance) {
        w2.end.x = w1.end.x;
        w2.end.y = w1.end.y;
      }
    }
  }

  return snapped;
}
