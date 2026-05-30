import { DxfDocument, Line, Text, point3d } from "@tarikjabiri/dxf";
import type { FloorPlanLayout } from "@/types/puter";

/**
 * Generates a CAD-compatible DXF string representing the active floor plan layout.
 */
export function generateFloorPlanDXF(layout: FloorPlanLayout): string {
  const doc = new DxfDocument();
  
  // Set units: 1 = Inches, 2 = Feet
  doc.setUnits(2); 

  // 1. Export walls as main centerline structure layers
  layout.walls.forEach((wall) => {
    const centerline = new Line(
      point3d(wall.start.x, wall.start.y, 0),
      point3d(wall.end.x, wall.end.y, 0)
    );
    centerline.layerName = "Walls";
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
      leftLine.layerName = "Wall_Boundaries";
      doc.modelSpace.entities.push(leftLine);

      // Right boundary line
      const rightLine = new Line(
        point3d(wall.start.x - nx * halfThick, wall.start.y - ny * halfThick, 0),
        point3d(wall.end.x - nx * halfThick, wall.end.y - ny * halfThick, 0)
      );
      rightLine.layerName = "Wall_Boundaries";
      doc.modelSpace.entities.push(rightLine);
    }
  });

  // 2. Export rooms as labeled blocks
  layout.rooms.forEach((room) => {
    const rx = room.bounds.x + room.bounds.width / 2;
    const ry = room.bounds.y + room.bounds.height / 2;

    const labelText = new Text(
      point3d(rx, ry, 0),
      0.8, // 10 inch text height
      `${room.label} (${room.area.toFixed(0)} SQFT)`
    );
    labelText.layerName = "Rooms";
    doc.modelSpace.entities.push(labelText);
  });

  // 3. Export doors as positioned text descriptions and frames
  layout.doors.forEach((door) => {
    const wall = layout.walls.find((w) => w.id === door.wallId);
    if (!wall) return;

    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const px = wall.start.x + (dx / len) * (door.position * len);
      const py = wall.start.y + (dy / len) * (door.position * len);

      const label = new Text(
        point3d(px, py + 0.3, 0),
        0.5,
        `DOOR ${door.width}"`
      );
      label.layerName = "Doors";
      doc.modelSpace.entities.push(label);
    }
  });

  // 4. Export windows
  layout.windows.forEach((win) => {
    const wall = layout.walls.find((w) => w.id === win.wallId);
    if (!wall) return;

    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const px = wall.start.x + (dx / len) * (win.position * len);
      const py = wall.start.y + (dy / len) * (win.position * len);

      const label = new Text(
        point3d(px, py + 0.3, 0),
        0.5,
        `WIN ${win.width}"x${win.height}"`
      );
      label.layerName = "Windows";
      doc.modelSpace.entities.push(label);
    }
  });

  return doc.stringify();
}
