import { it, expect } from "vitest";
import {
  createProceduralLayout,
  layoutRequestSchema,
  validateRoomGeometry,
} from "@/lib/layout-generation";
it("generates distinct non-overlapping layouts and preserves requested area and rooms", () => {
  const request = layoutRequestSchema.parse({
    beds: 3,
    baths: 2,
    area: 1200,
    extras: ["Home Office"],
  });
  const layouts = [0, 1, 2].map((i) => createProceduralLayout(request, i));
  for (const layout of layouts) {
    expect(() => validateRoomGeometry(layout.rooms)).not.toThrow();
    expect(layout.rooms.filter((r) => r.type === "bedroom")).toHaveLength(3);
    expect(layout.rooms.filter((r) => r.type === "bathroom")).toHaveLength(2);
    expect(layout.parameters.totalArea).toBeCloseTo(1200);
    expect(layout.rooms.find((r) => r.label === "Home Office")).toBeTruthy();
    expect(layout.walls.length).toBeGreaterThan(4);
  }
  expect(
    new Set(layouts.map((l) => JSON.stringify(l.rooms.map((r) => r.bounds))))
      .size,
  ).toBe(3);
});
it("rejects unfit room counts rather than overlapping rooms", () => {
  expect(() =>
    createProceduralLayout(
      layoutRequestSchema.parse({ beds: 6, baths: 4, area: 200 }),
    ),
  ).toThrow("does not fit");
});
it("rejects overlapping model output", () => {
  const layout = createProceduralLayout(layoutRequestSchema.parse({}));
  const rooms = layout.rooms;
  rooms[1]!.bounds = { ...rooms[0]!.bounds };
  expect(() => validateRoomGeometry(rooms)).toThrow("overlap");
});
it("uses measured settings to change openings and circulation width", () => {
  const base = layoutRequestSchema.parse({ beds: 2, baths: 1, area: 1800 });
  const a = createProceduralLayout(base),
    b = createProceduralLayout({
      ...base,
      accessible: true,
      naturalLight: false,
    });
  expect(a.windows.length).toBeGreaterThan(0);
  expect(b.windows).toEqual([]);
  expect(b.doors.every((d) => d.width === 36)).toBe(true);
  expect(b.rooms.find((r) => r.type === "hallway")!.bounds.width).toBe(5);
});
it("constructs an L footprint without enclosing the missing corner", () => {
  const layout = createProceduralLayout(
    layoutRequestSchema.parse({ style: "l-shape", area: 1800 }),
  );
  const minX = Math.min(...layout.rooms.map((r) => r.bounds.x)),
    maxY = Math.max(...layout.rooms.map((r) => r.bounds.y + r.bounds.height));
  expect(
    layout.walls.some(
      (w) =>
        w.start.x === minX &&
        w.end.x === minX &&
        Math.max(w.start.y, w.end.y) >= maxY - 0.01,
    ),
  ).toBe(false);
});
