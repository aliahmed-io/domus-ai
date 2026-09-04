import type { Wall, Room } from "@/types/puter";

/**
 * Robust Planar Graph Face Detection to automatically find all closed rooms
 * from a set of intersecting or welded CAD wall segments.
 */
export function detectAllRooms(walls: Wall[], existingRooms: Room[] = []): Room[] {
  if (!walls || walls.length < 3) return [];

  // 1. Unify vertices (snap within 0.5ft)
  const vertices: { x: number; y: number }[] = [];
  const getVertexIdx = (pt: { x: number; y: number }) => {
    let idx = vertices.findIndex((v) => Math.hypot(v.x - pt.x, v.y - pt.y) < 0.5);
    if (idx === -1) {
      idx = vertices.length;
      vertices.push({ ...pt });
    }
    return idx;
  };

  const edges: { from: number; to: number; wallId: string; angle: number }[] = [];
  walls.forEach((w) => {
    const u = getVertexIdx(w.start);
    const v = getVertexIdx(w.end);
    if (u !== v) {
      const dx = vertices[v]!.x - vertices[u]!.x;
      const dy = vertices[v]!.y - vertices[u]!.y;
      edges.push({ from: u, to: v, wallId: w.id, angle: Math.atan2(dy, dx) });
      edges.push({ from: v, to: u, wallId: w.id, angle: Math.atan2(-dy, -dx) });
    }
  });

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
      const revAngle = Math.atan2(
        vertices[curr.from]!.y - vertices[curr.to]!.y,
        vertices[curr.from]!.x - vertices[curr.to]!.x
      );

      // Find edge with angle just greater than reverse angle
      let nextEdgeIdx = -1;
      for (let i = 0; i < outEdges.length; i++) {
        if (outEdges[i]!.angle > revAngle) {
          nextEdgeIdx = i;
          break;
        }
      }
      if (nextEdgeIdx === -1) nextEdgeIdx = 0; // Wrap around

      curr = outEdges[nextEdgeIdx]!;

      if (curr.from === startEdge.from && curr.to === startEdge.to) {
        break; // Loop closed
      }

      if (faceEdges.length > walls.length * 2) {
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
    if (signedArea > 15) { // Minimum 15 sq ft to filter tiny artifact slivers
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

      // Semantic architectural naming heuristic based on room size
      let defaultLabel = `Room ${rooms.length + 1}`;
      let defaultType: Room["type"] = "bedroom";

      if (areaSqFt >= 240) {
        defaultLabel = "Living Room";
        defaultType = "living";
      } else if (areaSqFt >= 160) {
        defaultLabel = "Primary Bedroom";
        defaultType = "bedroom";
      } else if (areaSqFt >= 110) {
        defaultLabel = "Kitchen / Dining";
        defaultType = "kitchen";
      } else if (areaSqFt <= 60) {
        defaultLabel = "Bathroom";
        defaultType = "bathroom";
      }

      rooms.push({
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
        wallIds: faceEdges.map((fe) => fe.wallId),
        floorMaterial: matchedRoom?.floorMaterial || "hardwood",
      });
    }
  });

  return rooms;
}
