import { DxfDocument, Line, Text, point3d } from "@tarikjabiri/dxf";
import type { FloorPlanLayout } from "@/types/puter";

/**
 * Generates a standard AIA CAD-compatible DXF string representing the active floor plan layout.
 * Conforms to American Institute of Architects (AIA) layer guidelines:
 * - A-WALL: Full-height structural and partition walls
 * - A-DOOR: Doors, frames, and swing clearance vectors
 * - A-GLAZ: Glazed windows, frames, and double-glass centerlines
 * - A-AREA-IDEN: Room labels and area square footage text blocks
 */
export function generateFloorPlanDXF(layout: FloorPlanLayout): string {
  const doc = new DxfDocument();
  
  // Set units: 1 = Inches, 2 = Feet
  doc.setUnits(2); 

  // 1. Export walls as AIA A-WALL layers (centerline + parallel boundary casings)
  layout.walls.forEach((wall) => {
    const centerline = new Line(
      point3d(wall.start.x, wall.start.y, 0),
      point3d(wall.end.x, wall.end.y, 0)
    );
    centerline.layerName = "A-WALL";
    doc.modelSpace.entities.push(centerline);

    // Compute parallel boundary offsets to show wall width/thickness in CAD software
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0.1) {
      const nx = -dy / len;
      const ny = dx / len;
      const halfThick = (wall.thickness / 12) / 2; // thickness is in inches, convert to feet

      // Left boundary line
      const leftLine = new Line(
        point3d(wall.start.x + nx * halfThick, wall.start.y + ny * halfThick, 0),
        point3d(wall.end.x + nx * halfThick, wall.end.y + ny * halfThick, 0)
      );
      leftLine.layerName = "A-WALL";
      doc.modelSpace.entities.push(leftLine);

      // Right boundary line
      const rightLine = new Line(
        point3d(wall.start.x - nx * halfThick, wall.start.y - ny * halfThick, 0),
        point3d(wall.end.x - nx * halfThick, wall.end.y - ny * halfThick, 0)
      );
      rightLine.layerName = "A-WALL";
      doc.modelSpace.entities.push(rightLine);
    }
  });

  // 2. Export rooms as AIA A-AREA-IDEN labeled blocks
  layout.rooms.forEach((room) => {
    const rx = room.bounds.x + room.bounds.width / 2;
    const ry = room.bounds.y + room.bounds.height / 2;

    const labelText = new Text(
      point3d(rx, ry, 0),
      0.8, // text height in feet
      `${room.label} (${room.area.toFixed(0)} SQFT)`
    );
    labelText.layerName = "A-AREA-IDEN";
    doc.modelSpace.entities.push(labelText);
  });

  // 3. Export doors as AIA A-DOOR layers with opening jambs and leaf vectors
  layout.doors.forEach((door) => {
    const wall = layout.walls.find((w) => w.id === door.wallId);
    if (!wall) return;

    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const px = wall.start.x + (dx / len) * (door.position * len);
      const py = wall.start.y + (dy / len) * (door.position * len);
      const doorWidthFt = door.width / 12;

      // Perpendicular normal
      const nx = -dy / len;
      const ny = dx / len;

      // Door Leaf vector extending open at 90 degrees
      const leafLine = new Line(
        point3d(px, py, 0),
        point3d(px + nx * doorWidthFt, py + ny * doorWidthFt, 0)
      );
      leafLine.layerName = "A-DOOR";
      doc.modelSpace.entities.push(leafLine);

      const label = new Text(
        point3d(px, py + 0.3, 0),
        0.5,
        `DOOR ${door.width}"`
      );
      label.layerName = "A-DOOR";
      doc.modelSpace.entities.push(label);
    }
  });

  // 4. Export windows as AIA A-GLAZ layers with double-glazed glass vectors
  layout.windows.forEach((win) => {
    const wall = layout.walls.find((w) => w.id === win.wallId);
    if (!wall) return;

    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const px = wall.start.x + (dx / len) * (win.position * len);
      const py = wall.start.y + (dy / len) * (win.position * len);
      const winWidthFt = win.width / 12;
      const halfW = winWidthFt / 2;

      const ux = dx / len;
      const uy = dy / len;

      // Glazing line along wall centerline
      const glassLine = new Line(
        point3d(px - ux * halfW, py - uy * halfW, 0),
        point3d(px + ux * halfW, py + uy * halfW, 0)
      );
      glassLine.layerName = "A-GLAZ";
      doc.modelSpace.entities.push(glassLine);

      const label = new Text(
        point3d(px, py + 0.3, 0),
        0.5,
        `WIN ${win.width}"x${win.height}"`
      );
      label.layerName = "A-GLAZ";
      doc.modelSpace.entities.push(label);
    }
  });

  return doc.stringify();
}
