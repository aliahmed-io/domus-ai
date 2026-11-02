import { z } from "zod";
import type { FloorPlanLayout } from "@/types/puter";
import { validateRoomGeometry } from "./layout-generation";
const finite = z.number().finite();
const pixelPoint = z.object({
  x: finite.nonnegative(),
  y: finite.nonnegative(),
});
export const blueprintPixelSchema = z.object({
  rooms: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum([
          "unassigned",
          "bedroom",
          "bathroom",
          "living",
          "kitchen",
          "dining",
          "hallway",
          "office",
          "garage",
          "storage",
          "outdoor",
          "utility",
        ]),
        label: z.string(),
        bounds: z.object({
          x: finite.nonnegative(),
          y: finite.nonnegative(),
          width: finite.positive(),
          height: finite.positive(),
        }),
      }),
    )
    .max(40),
  walls: z
    .array(
      z.object({ id: z.string().min(1), start: pixelPoint, end: pixelPoint }),
    )
    .min(1)
    .max(200),
  doors: z
    .array(
      z.object({
        id: z.string(),
        wallId: z.string(),
        position: finite.min(0).max(1),
        width: finite.positive(),
      }),
    )
    .max(100),
  windows: z
    .array(
      z.object({
        id: z.string(),
        wallId: z.string(),
        position: finite.min(0).max(1),
        width: finite.positive(),
      }),
    )
    .max(100),
});
export function normalizeBlueprintResult(
  raw: unknown,
  scale: {
    width: number;
    height: number;
    pixelsPerFoot: number;
    wallHeight: number;
  },
): FloorPlanLayout {
  const parsed = blueprintPixelSchema.parse(raw),
    { width, height, pixelsPerFoot, wallHeight } = scale;
  if (
    ![width, height, pixelsPerFoot, wallHeight].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    throw new Error("The measured scale is invalid.");
  const point = (p: { x: number; y: number }) => {
    if (p.x > width || p.y > height)
      throw new Error("Detected geometry lies outside the image.");
    return {
      x: (p.x - width / 2) / pixelsPerFoot,
      y: (p.y - height / 2) / pixelsPerFoot,
    };
  };
  const walls = parsed.walls.map((w) => ({
    ...w,
    start: point(w.start),
    end: point(w.end),
    thickness: 6,
    height: wallHeight,
    isLoadBearing: false,
  }));
  const ids = new Set(walls.map((w) => w.id));
  if (ids.size !== walls.length) throw new Error("Duplicate wall references.");
  for (const w of walls)
    if (Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y) < 0.1)
      throw new Error("A detected wall is too short.");
  const openings = (items: typeof parsed.doors) =>
    items.map((item) => {
      const wall = walls.find((w) => w.id === item.wallId);
      if (!wall) throw new Error("An opening refers to a missing wall.");
      const length = Math.hypot(
          wall.end.x - wall.start.x,
          wall.end.y - wall.start.y,
        ),
        span = item.width / pixelsPerFoot;
      if (
        span > length ||
        item.position * length - span / 2 < -0.01 ||
        item.position * length + span / 2 > length + 0.01
      )
        throw new Error("An opening extends beyond its wall.");
      return { ...item, width: span * 12 };
    });
  const rooms = parsed.rooms.map((r) => {
    const start = point(r.bounds);
    point({ x: r.bounds.x + r.bounds.width, y: r.bounds.y + r.bounds.height });
    return {
      ...r,
      bounds: {
        ...start,
        width: r.bounds.width / pixelsPerFoot,
        height: r.bounds.height / pixelsPerFoot,
      },
      area:
        (r.bounds.width * r.bounds.height) / (pixelsPerFoot * pixelsPerFoot),
    };
  });
  if (rooms.length) validateRoomGeometry(rooms, false);
  const xs = walls.flatMap((w) => [w.start.x, w.end.x]),
    ys = walls.flatMap((w) => [w.start.y, w.end.y]);
  return {
    id: crypto.randomUUID(),
    rooms,
    walls,
    doors: openings(parsed.doors).map((d) => ({
      ...d,
      height: 80,
      isExterior: false,
    })),
    windows: openings(parsed.windows).map((w) => ({
      ...w,
      height: 48,
      sillHeight: 30,
    })),
    dimensions: {
      width: Math.max(...xs) - Math.min(...xs) || 0.1,
      height: Math.max(...ys) - Math.min(...ys) || 0.1,
    },
    parameters: {
      bedrooms: rooms.filter((r) => r.type === "bedroom").length,
      bathrooms: rooms.filter((r) => r.type === "bathroom").length,
      totalArea: rooms.reduce((n, r) => n + r.area, 0),
      floors: 1,
      style: "traditional",
      features: [
        "AI draft from calibrated image",
        "Default wall and opening heights require review",
      ],
    },
    efficiency: 0,
    naturalLight: 0,
    generatedAt: new Date().toISOString(),
  };
}
