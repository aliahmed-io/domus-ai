import type { Room, Wall, Door, Window2D, SceneObject } from "@/types/puter";
import { StandardCatalog } from "./standard-catalog";
import { buildPlanTopology } from "./plan-topology";
import { nanoid } from "./utils";

/**
 * Procedural Constraint Compiler
 * Takes a raw array of Room bounds and extrudes precise structural Walls,
 * interior Doors along shared room boundaries, and exterior Windows.
 */
export function solveLayoutGeometry(
  rooms: Room[],
  options: { naturalLight?: boolean; accessible?: boolean } = {},
): { walls: Wall[]; doors: Door[]; windows: Window2D[] } {
  const sources: Wall[] = [];
  const owners = new Map<string, Room>();
  for (const room of rooms) {
    const { x, y, width, height } = room.bounds;
    const corners = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
    corners.forEach((start, index) => {
      const id = `${room.id}-edge-${index}`;
      sources.push({
        id,
        start,
        end: corners[(index + 1) % 4]!,
        thickness: 6,
        height: 9,
        isLoadBearing: false,
      });
      owners.set(id, room);
    });
  }
  const graph = buildPlanTopology(sources);
  const walls: Wall[] = [],
    doors: Door[] = [],
    windows: Window2D[] = [];
  let entrancePlaced = false;
  for (const edge of graph.edges) {
    const adjacent = [...new Set(edge.wallIds.map((id) => owners.get(id)!))];
    const exterior = adjacent.length === 1;
    const start = graph.vertices[edge.from]!,
      end = graph.vertices[edge.to]!;
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const wall: Wall = {
      id: `wall-${nanoid()}`,
      start,
      end,
      thickness: exterior ? 9 : 6,
      height: 9,
      isLoadBearing: exterior,
    };
    walls.push(wall);
    const circulation = adjacent.some(
      (room) => room.type === "hallway" || room.type === "living",
    );
    if (length >= 4 && circulation && (!exterior || !entrancePlaced)) {
      doors.push({
        id: `door-${nanoid()}`,
        wallId: wall.id,
        position: 0.5,
        width: options.accessible ? 36 : exterior ? 36 : 32,
        height: 80,
        isExterior: exterior,
      });
      if (exterior) entrancePlaced = true;
    } else if (
      exterior &&
      options.naturalLight !== false &&
      length >= 6 &&
      adjacent[0]?.type !== "hallway"
    ) {
      windows.push({
        id: `window-${nanoid()}`,
        wallId: wall.id,
        position: 0.5,
        width: 48,
        height: 48,
        sillHeight: 30,
      });
    }
  }
  return { walls, doors, windows };
}

/**
 * Auto-Furnishing Engine
 * Populates rooms with standard catalog items based on semantic room type.
 */
export function furnishRooms(rooms: Room[]): SceneObject[] {
  const objects: SceneObject[] = [];

  rooms.forEach((room) => {
    // Room center in meters (assuming bounds are in feet, so convert)
    const cx = (room.bounds.x + room.bounds.width / 2) * 0.3048;
    const cz = (room.bounds.y + room.bounds.height / 2) * 0.3048;
    const yFloor = 0;

    const occupied: { x: number; z: number; width: number; depth: number }[] =
      [];
    const spawn = (
      catalogId: string,
      offsetX: number = 0,
      offsetZ: number = 0,
      rotY: number = 0,
    ) => {
      const catalog = StandardCatalog[catalogId];
      if (!catalog) return;
      const width =
        Math.abs(Math.sin(rotY)) > 0.5
          ? catalog.dimensions.depth
          : catalog.dimensions.width;
      const depth =
        Math.abs(Math.sin(rotY)) > 0.5
          ? catalog.dimensions.width
          : catalog.dimensions.depth;
      const minX = room.bounds.x * 0.3048,
        minZ = room.bounds.y * 0.3048;
      const maxX = (room.bounds.x + room.bounds.width) * 0.3048,
        maxZ = (room.bounds.y + room.bounds.height) * 0.3048;
      const candidates = [
        { x: cx + offsetX, z: cz + offsetZ },
        ...[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => ({
            x: cx + x * ((maxX - minX - width) / 2 - 0.1),
            z: cz + z * ((maxZ - minZ - depth) / 2 - 0.1),
          })),
        ),
      ];
      const placement = candidates.find(
        (p) =>
          p.x - width / 2 >= minX + 0.05 &&
          p.x + width / 2 <= maxX - 0.05 &&
          p.z - depth / 2 >= minZ + 0.05 &&
          p.z + depth / 2 <= maxZ - 0.05 &&
          !occupied.some(
            (other) =>
              Math.abs(other.x - p.x) < (other.width + width) / 2 + 0.05 &&
              Math.abs(other.z - p.z) < (other.depth + depth) / 2 + 0.05,
          ),
      );
      if (!placement) return;
      occupied.push({ ...placement, width, depth });
      objects.push({
        id: `furnish-${room.id}-${catalogId}-${nanoid()}`,
        type: "furniture",
        name: StandardCatalog[catalogId]?.name || catalogId,
        position: { x: placement.x, y: yFloor, z: placement.z },
        rotation: { x: 0, y: rotY, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        gltfPath: catalog.gltfUrl,
        materialId: `color-${StandardCatalog[catalogId]?.color || "#fff"}`, // We can parse this later in UI
      });
    };

    switch (room.type) {
      case "bedroom":
        spawn("bed-queen", 0, 0, 0);
        spawn("wardrobe-2door", -1.5, 1.5, Math.PI / 2);
        break;
      case "living":
        spawn("sofa-3seater", 0, -1, 0);
        break;
      case "dining":
        spawn("dining-table-6", 0, 0, 0);
        break;
      case "kitchen":
        spawn("kitchen-island", 0, 0, 0);
        break;
      case "bathroom":
        spawn("bathtub", 0, 0, 0);
        break;
    }
  });

  return objects;
}
