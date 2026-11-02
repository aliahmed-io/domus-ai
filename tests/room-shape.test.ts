import { it, expect } from "vitest";
import { roomSurfaceGeometry } from "@/lib/room-shape";
import type { Room } from "@/types/puter";
it("extrudes the real L-shaped room instead of filling its rectangular bounds", () => {
  const room: Room = {
    id: "l",
    label: "L room",
    type: "living",
    area: 5,
    bounds: { x: 0, y: 0, width: 3, height: 3 },
    polygon: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 0, y: 3 },
    ],
  };
  const geometry = roomSurfaceGeometry(room, 0.2),
    p = geometry.getAttribute("position");
  let volume = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i),
      ay = p.getY(i),
      az = p.getZ(i),
      bx = p.getX(i + 1),
      by = p.getY(i + 1),
      bz = p.getZ(i + 1),
      cx = p.getX(i + 2),
      cy = p.getY(i + 2),
      cz = p.getZ(i + 2);
    volume +=
      (ax * (by * cz - bz * cy) +
        ay * (bz * cx - bx * cz) +
        az * (bx * cy - by * cx)) /
      6;
  }
  expect(Math.abs(volume)).toBeCloseTo(5 * 0.3048 * 0.3048 * 0.2, 6);
  geometry.dispose();
});
