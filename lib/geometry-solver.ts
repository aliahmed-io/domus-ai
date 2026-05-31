import type { Room, Wall, Door, Window2D, Vec2D, Rect2D, SceneObject } from "@/types/puter";
import { StandardCatalog } from "./standard-catalog";
import { nanoid } from "./utils";

/**
 * Procedural Constraint Compiler
 * Takes a raw array of Room bounds and extrudes precise structural Walls,
 * interior Doors along shared room boundaries, and exterior Windows.
 */
export function solveLayoutGeometry(rooms: Room[]): { walls: Wall[]; doors: Door[]; windows: Window2D[] } {
  const walls: Wall[] = [];
  const doors: Door[] = [];
  const windows: Window2D[] = [];
  
  const WALL_THICKNESS = 6; // inches
  const WALL_HEIGHT = 10; // feet

  // Helper to check if two values are approximately equal
  const approx = (a: number, b: number) => Math.abs(a - b) < 0.1;

  // 1. Detect Shared Interior Boundary Segments between all room pairs
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const r1 = rooms[i]?.bounds;
      const r2 = rooms[j]?.bounds;

      if (!r1 || !r2) continue;

      // Check vertical shared wall (X aligns)
      if (approx(r1.x + r1.width, r2.x) || approx(r2.x + r2.width, r1.x)) {
        const x = approx(r1.x + r1.width, r2.x) ? r1.x + r1.width : r2.x + r2.width;
        // Overlap in Y
        const yStart = Math.max(r1.y, r2.y);
        const yEnd = Math.min(r1.y + r1.height, r2.y + r2.height);
        
        if (yStart < yEnd) {
          const wallId = `wall-int-v-${nanoid()}`;
          walls.push({
            id: wallId,
            start: { x, y: yStart },
            end: { x, y: yEnd },
            thickness: WALL_THICKNESS,
            height: WALL_HEIGHT,
            isLoadBearing: false
          });

          // Place an interior door on this shared wall if it's long enough
          if (yEnd - yStart > 3) {
            doors.push({
              id: `door-int-${nanoid()}`,
              wallId: wallId,
              position: 0.5, // middle of the shared segment
              width: 32, // standard 32" interior door
              isExterior: false
            });
          }
        }
      }

      // Check horizontal shared wall (Y aligns)
      if (approx(r1.y + r1.height, r2.y) || approx(r2.y + r2.height, r1.y)) {
        const y = approx(r1.y + r1.height, r2.y) ? r1.y + r1.height : r2.y + r2.height;
        // Overlap in X
        const xStart = Math.max(r1.x, r2.x);
        const xEnd = Math.min(r1.x + r1.width, r2.x + r2.width);
        
        if (xStart < xEnd) {
          const wallId = `wall-int-h-${nanoid()}`;
          walls.push({
            id: wallId,
            start: { x: xStart, y },
            end: { x: xEnd, y },
            thickness: WALL_THICKNESS,
            height: WALL_HEIGHT,
            isLoadBearing: false
          });

          // Place an interior door
          if (xEnd - xStart > 3) {
            doors.push({
              id: `door-int-${nanoid()}`,
              wallId: wallId,
              position: 0.5,
              width: 32,
              isExterior: false
            });
          }
        }
      }
    }
  }

  // 2. Calculate the global bounding box (Exterior Perimeter)
  if (rooms.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rooms.forEach(r => {
      if (r.bounds.x < minX) minX = r.bounds.x;
      if (r.bounds.y < minY) minY = r.bounds.y;
      if (r.bounds.x + r.bounds.width > maxX) maxX = r.bounds.x + r.bounds.width;
      if (r.bounds.y + r.bounds.height > maxY) maxY = r.bounds.y + r.bounds.height;
    });

    const extWalls = [
      { id: `wall-ext-top`, start: { x: minX, y: minY }, end: { x: maxX, y: minY } },
      { id: `wall-ext-bottom`, start: { x: minX, y: maxY }, end: { x: maxX, y: maxY } },
      { id: `wall-ext-left`, start: { x: minX, y: minY }, end: { x: minX, y: maxY } },
      { id: `wall-ext-right`, start: { x: maxX, y: minY }, end: { x: maxX, y: maxY } }
    ];

    extWalls.forEach(w => {
      walls.push({
        ...w,
        thickness: 9, // Exterior load-bearing walls are thicker
        height: WALL_HEIGHT,
        isLoadBearing: true
      });
      
      // Place a window on every exterior wall
      windows.push({
        id: `window-ext-${nanoid()}`,
        wallId: w.id,
        position: 0.5,
        width: 48,
        height: 60,
        sillHeight: 24
      });
    });

    // Replace front window with an Entry Door
    windows.pop(); // remove last window on right wall
    doors.push({
      id: `door-ext-main`,
      wallId: `wall-ext-right`,
      position: 0.5,
      width: 40, // Large exterior door
      isExterior: true
    });
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

    const spawn = (catalogId: string, offsetX: number = 0, offsetZ: number = 0, rotY: number = 0) => {
      objects.push({
        id: `furnish-${room.id}-${catalogId}-${nanoid()}`,
        type: "furniture",
        name: StandardCatalog[catalogId]?.name || catalogId,
        position: { x: cx + offsetX, y: yFloor, z: cz + offsetZ },
        rotation: { x: 0, y: rotY, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        materialId: `color-${StandardCatalog[catalogId]?.color || "#fff"}` // We can parse this later in UI
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
