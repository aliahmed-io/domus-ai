import { buildPlanTopology } from "@/lib/plan-topology";
import type { Wall, Room } from "@/types/puter";

/**
 * Robust Planar Graph Face Detection to automatically find all closed rooms
 * from a set of intersecting or welded CAD wall segments.
 */
export function detectAllRooms(
  walls: Wall[],
  existingRooms: Room[] = [],
): Room[] {
  if (!walls || walls.length < 3) return [];

  // Intersections are graph vertices even when the source walls were never manually split.
  const { vertices, edges: segments } = buildPlanTopology(walls);
  const edges: {
    from: number;
    to: number;
    wallIds: string[];
    angle: number;
  }[] = [];
  for (const segment of segments) {
    const start = vertices[segment.from]!,
      end = vertices[segment.to]!;
    edges.push({
      ...segment,
      angle: Math.atan2(end.y - start.y, end.x - start.x),
    });
    edges.push({
      from: segment.to,
      to: segment.from,
      wallIds: segment.wallIds,
      angle: Math.atan2(start.y - end.y, start.x - end.x),
    });
  }

  // 2. Sort outgoing edges by angle
  const adj = new Map<number, typeof edges>();
  edges.forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e);
  });
  adj.forEach((outEdges) => {
    outEdges.sort((a, b) => a.angle - b.angle);
  });

  // 3. Traverse faces
  const visited = new Set<string>();
  const rooms: Room[] = [];

  edges.forEach((startEdge) => {
    const edgeKey = `${startEdge.from}->${startEdge.to}`;
    if (visited.has(edgeKey)) return;

    const faceEdges: typeof edges = [];
    let curr = startEdge;
    let valid = true;

    while (true) {
      faceEdges.push(curr);
      visited.add(`${curr.from}->${curr.to}`);

      const outEdges = adj.get(curr.to) || [];
      // Select the neighbour by edge identity, not a floating-point angle comparison.
      // The previous angular neighbour keeps the bounded face on the right in screen coordinates.
      const reverseIndex = outEdges.findIndex((edge) => edge.to === curr.from);
      if (reverseIndex < 0) {
        valid = false;
        break;
      }
      curr = outEdges[(reverseIndex + outEdges.length - 1) % outEdges.length]!;

      if (curr.from === startEdge.from && curr.to === startEdge.to) {
        break; // Loop closed
      }

      if (faceEdges.length > edges.length) {
        valid = false;
        break;
      }
    }

    if (!valid || faceEdges.length < 3) return;

    // 4. Calculate Face Area via Shoelace Formula
    let signedArea = 0;
    const polygonPts: { x: number; y: number }[] = [];
    faceEdges.forEach((fe) => {
      const p1 = vertices[fe.from]!;
      const p2 = vertices[fe.to]!;
      signedArea += p1.x * p2.y - p2.x * p1.y;
      polygonPts.push({ ...p1 });
    });
    signedArea /= 2;

    // Positive signedArea in screen coordinates (Y down) means Counter-Clockwise (internal face)
    if (signedArea > 0.25) {
      // Ignore only sub-quarter-foot numerical slivers, not closets
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      polygonPts.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const areaSqFt = Math.round(signedArea);

      // Check if this matches an existing room ID by proximity of center
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const matchedRoom = existingRooms.find((er) => {
        const ecx = er.bounds.x + er.bounds.width / 2;
        const ecy = er.bounds.y + er.bounds.height / 2;
        return Math.hypot(cx - ecx, cy - ecy) < 3.0;
      });

      // A closed polygon does not reveal how a room is used.
      const defaultLabel = `Room ${rooms.length + 1}`;
      const defaultType: Room["type"] = "unassigned";

      rooms.push({
        ...matchedRoom,
        id: matchedRoom?.id || `room-${Date.now()}-${rooms.length + 1}`,
        label: matchedRoom?.label || defaultLabel,
        type: matchedRoom?.type || defaultType,
        bounds: {
          x: minX,
          y: minY,
          width,
          height,
        },
        polygon: polygonPts,
        area: areaSqFt,
        wallIds: [...new Set(faceEdges.flatMap((edge) => edge.wallIds))],
        floorMaterial: matchedRoom?.floorMaterial || "hardwood",
      });
    }
  });

  return rooms;
}
