import { Shape, ExtrudeGeometry } from "three";
import type { Room } from "@/types/puter";
export function roomShape(room: Room) {
  const b = room.bounds,
    points = room.polygon?.length
      ? room.polygon
      : [
          { x: b.x, y: b.y },
          { x: b.x + b.width, y: b.y },
          { x: b.x + b.width, y: b.y + b.height },
          { x: b.x, y: b.y + b.height },
        ];
  const shape = new Shape();
  points.forEach((p, i) => {
    if (i === 0) shape.moveTo(p.x * 0.3048, p.y * 0.3048);
    else shape.lineTo(p.x * 0.3048, p.y * 0.3048);
  });
  shape.closePath();
  return shape;
}
export function roomSurfaceGeometry(room: Room, thickness: number) {
  const geometry = new ExtrudeGeometry(roomShape(room), {
    depth: thickness,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}
