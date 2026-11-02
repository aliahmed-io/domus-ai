import type { BuildingStorey, FloorPlanLayout, SceneObject, Staircase } from "@/types/puter";

export function belongsToFloor(object: SceneObject, floorId: string, groundId = "storey-1") {
  return (object.storeyId || groundId) === floorId;
}

export function copyFloorPlan(layout: FloorPlanLayout): FloorPlanLayout {
  const copy = structuredClone(layout);
  const wallIds = new Map(copy.walls.map(w => [w.id, crypto.randomUUID()]));
  copy.id = crypto.randomUUID();
  copy.walls.forEach(w => { w.id = wallIds.get(w.id)!; });
  copy.rooms.forEach(r => { r.id = crypto.randomUUID(); if (r.wallIds) r.wallIds = r.wallIds.map(id => wallIds.get(id)!); });
  [...copy.doors, ...copy.windows].forEach(o => {
    o.id = crypto.randomUUID();
    o.wallId = wallIds.get(o.wallId)!;
  });
  return copy;
}

export function stairsToNextFloor(storeys: BuildingStorey[], activeId: string, x: number, z: number): Staircase | null {
  const start = storeys.find(s => s.id === activeId);
  if (!start) return null;
  const end = storeys.filter(s => s.elevation > start.elevation).sort((a,b) => a.elevation - b.elevation)[0];
  if (!end) return null;
  const riseInches = (end.elevation - start.elevation) * 12;
  const riserCount = Math.ceil(riseInches / 7.5);
  return {
    id: crypto.randomUUID(), startStoreyId: start.id, endStoreyId: end.id,
    width: 36, riserCount, riserHeight: riseInches / riserCount,
    position: { x, y: start.elevation * 0.3048, z },
    rotation: { x: 0, y: 0, z: 0 }, type: "straight",
  };
}

/** Opening bounds follow the tread footprint in local stair coordinates. */
export function stairOpening(stair: Staircase) {
  const width = stair.width * 0.0254;
  const half = Math.floor(stair.riserCount / 2);
  let minX = -width / 2, maxX = width / 2;
  let minZ = -(stair.riserCount - 1) * 0.28 - 0.14, maxZ = 0.14;
  if (stair.type === "l-shape") {
    maxX = width / 2 + (stair.riserCount - half) * 0.28;
    minZ = -half * 0.28 - width;
  } else if (stair.type === "u-shape") {
    maxX = width * 1.65;
    minZ = -half * 0.28 - width;
  } else if (stair.type === "spiral") {
    minX = minZ = -width * 1.05;
    maxX = maxZ = width * 1.05;
  }
  const x = (minX + maxX) / 2, z = (minZ + maxZ) / 2;
  return {
    x: stair.position.x + x * Math.cos(stair.rotation.y) + z * Math.sin(stair.rotation.y),
    z: stair.position.z - x * Math.sin(stair.rotation.y) + z * Math.cos(stair.rotation.y),
    width: maxX - minX + 0.1, depth: maxZ - minZ + 0.1,
  };
}
