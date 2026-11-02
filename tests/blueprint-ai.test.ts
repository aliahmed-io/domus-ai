import { it, expect } from "vitest";
import { normalizeBlueprintResult } from "@/lib/blueprint-ai";
const raw = {
  rooms: [
    {
      id: "r",
      label: "Room",
      type: "unassigned",
      bounds: { x: 100, y: 100, width: 200, height: 100 },
    },
  ],
  walls: [{ id: "w", start: { x: 100, y: 100 }, end: { x: 300, y: 100 } }],
  doors: [{ id: "d", wallId: "w", position: 0.5, width: 30 }],
  windows: [],
};
it("converts image coordinates and opening widths with the user measured scale", () => {
  const a = normalizeBlueprintResult(raw, {
      width: 400,
      height: 300,
      pixelsPerFoot: 10,
      wallHeight: 9,
    }),
    b = normalizeBlueprintResult(raw, {
      width: 400,
      height: 300,
      pixelsPerFoot: 20,
      wallHeight: 9,
    });
  expect(a.rooms[0]!.area).toBe(200);
  expect(b.rooms[0]!.area).toBe(50);
  expect(a.doors[0]!.width).toBe(36);
  expect(a.walls[0]!.start).toEqual({ x: -10, y: -5 });
  expect(a.efficiency).toBe(0);
});
it("rejects out of image points, missing parent walls, and openings outside their wall", () => {
  const scale = { width: 400, height: 300, pixelsPerFoot: 10, wallHeight: 9 };
  expect(() =>
    normalizeBlueprintResult(
      { ...raw, walls: [{ ...raw.walls[0], end: { x: 401, y: 100 } }] },
      scale,
    ),
  ).toThrow("outside");
  expect(() =>
    normalizeBlueprintResult(
      { ...raw, doors: [{ ...raw.doors[0], wallId: "missing" }] },
      scale,
    ),
  ).toThrow("missing");
  expect(() =>
    normalizeBlueprintResult(
      { ...raw, doors: [{ ...raw.doors[0], position: 0 }] },
      scale,
    ),
  ).toThrow("beyond");
});
