import type { Vec2D, Wall } from "@/types/puter";

// Topology precision is different from the larger, user-facing magnetic snap radius.
export const TOPOLOGY_TOLERANCE_FEET = 1 / 64;
export interface PlanEdge {
  from: number;
  to: number;
  wallIds: string[];
}
export interface PlanTopology {
  vertices: Vec2D[];
  edges: PlanEdge[];
}

/** Build a derived planar graph without changing wall IDs or opening positions. */
export function buildPlanTopology(
  walls: Wall[],
  tolerance = TOPOLOGY_TOLERANCE_FEET,
): PlanTopology {
  const valid = walls.filter(
    (wall) =>
      [wall.start.x, wall.start.y, wall.end.x, wall.end.y].every(
        Number.isFinite,
      ) &&
      Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y) >
        tolerance,
  );
  const cuts = valid.map(() => [0, 1]);
  const cross = (a: Vec2D, b: Vec2D) => a.x * b.y - a.y * b.x;
  const vector = (a: Vec2D, b: Vec2D): Vec2D => ({
    x: b.x - a.x,
    y: b.y - a.y,
  });
  const cutAtPoint = (index: number, point: Vec2D) => {
    const wall = valid[index]!;
    const d = vector(wall.start, wall.end),
      q = vector(wall.start, point);
    const lengthSquared = d.x * d.x + d.y * d.y;
    const t = (q.x * d.x + q.y * d.y) / lengthSquared;
    if (t < 0 || t > 1) return;
    if (
      Math.hypot(
        wall.start.x + t * d.x - point.x,
        wall.start.y + t * d.y - point.y,
      ) <= tolerance
    )
      cuts[index]!.push(t);
  };
  for (let i = 0; i < valid.length; i++)
    for (let j = i + 1; j < valid.length; j++) {
      const a = valid[i]!,
        b = valid[j]!;
      // Endpoint projections also handle T junctions, duplicate and overlapping segments.
      cutAtPoint(i, b.start);
      cutAtPoint(i, b.end);
      cutAtPoint(j, a.start);
      cutAtPoint(j, a.end);
      const r = vector(a.start, a.end),
        s = vector(b.start, b.end),
        q = vector(a.start, b.start);
      const denominator = cross(r, s);
      if (Math.abs(denominator) < 1e-10) continue;
      const t = cross(q, s) / denominator,
        u = cross(q, r) / denominator;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        cuts[i]!.push(t);
        cuts[j]!.push(u);
      }
    }
  const vertices: Vec2D[] = [],
    edges: PlanEdge[] = [];
  const vertexAt = (point: Vec2D) => {
    const existing = vertices.findIndex(
      (vertex) =>
        Math.hypot(vertex.x - point.x, vertex.y - point.y) <= tolerance,
    );
    if (existing >= 0) return existing;
    vertices.push(point);
    return vertices.length - 1;
  };
  const byPair = new Map<string, PlanEdge>();
  valid.forEach((wall, index) => {
    const values = [...new Set(cuts[index])].sort((a, b) => a - b);
    for (let k = 1; k < values.length; k++) {
      const pointAt = (t: number) => ({
        x: wall.start.x + t * (wall.end.x - wall.start.x),
        y: wall.start.y + t * (wall.end.y - wall.start.y),
      });
      const a = pointAt(values[k - 1]!),
        b = pointAt(values[k]!);
      if (Math.hypot(b.x - a.x, b.y - a.y) <= tolerance) continue;
      const from = vertexAt(a),
        to = vertexAt(b);
      if (from === to) continue;
      const key = `${Math.min(from, to)}:${Math.max(from, to)}`;
      const existing = byPair.get(key);
      if (existing) {
        if (!existing.wallIds.includes(wall.id)) existing.wallIds.push(wall.id);
      } else {
        const edge = { from, to, wallIds: [wall.id] };
        edges.push(edge);
        byPair.set(key, edge);
      }
    }
  });
  return { vertices, edges };
}
