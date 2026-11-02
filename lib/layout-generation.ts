import { z } from "zod";
import type { FloorPlanLayout, Room } from "@/types/puter";
import { solveLayoutGeometry } from "./geometry-solver";
export const layoutRequestSchema = z.object({
  beds: z.number().int().min(1).max(6).default(2),
  baths: z.number().int().min(1).max(4).default(2),
  area: z.number().finite().min(200).max(10000).default(1200),
  style: z
    .enum(["open-plan", "traditional", "l-shape", "studio"])
    .default("open-plan"),
  naturalLight: z.boolean().default(true),
  accessible: z.boolean().default(false),
  extras: z
    .array(
      z.enum([
        "Home Office",
        "Walk-in Wardrobe",
        "Mudroom",
        "Pantry",
        "Gym",
        "Garage",
        "Terrace",
        "Library",
      ]),
    )
    .max(8)
    .default([]),
});
export type LayoutRequest = z.infer<typeof layoutRequestSchema>;
export function validateRoomGeometry(rooms: Room[], requireConnected = true) {
  if (!rooms.length || rooms.length > 40)
    throw new Error("The layout must contain between 1 and 40 rooms.");
  const ids = new Set<string>();
  for (const room of rooms) {
    const b = room.bounds;
    if (
      ids.has(room.id) ||
      ![b.x, b.y, b.width, b.height].every(Number.isFinite) ||
      b.width <= 0 ||
      b.height <= 0 ||
      Math.abs(b.x) > 1000 ||
      Math.abs(b.y) > 1000 ||
      b.width > 1000 ||
      b.height > 1000
    )
      throw new Error("The layout contains invalid room geometry.");
    ids.add(room.id);
  }
  for (let i = 0; i < rooms.length; i++)
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i]!.bounds,
        b = rooms[j]!.bounds;
      if (
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.01 &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.01
      )
        throw new Error("The proposed rooms overlap. No layout was applied.");
    }
  const reached = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < rooms.length; i++)
      if (reached.has(i))
        for (let j = 0; j < rooms.length; j++)
          if (!reached.has(j)) {
            const a = rooms[i]!.bounds,
              b = rooms[j]!.bounds;
            const vertical =
              (Math.abs(a.x + a.width - b.x) < 0.01 ||
                Math.abs(b.x + b.width - a.x) < 0.01) &&
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 3;
            const horizontal =
              (Math.abs(a.y + a.height - b.y) < 0.01 ||
                Math.abs(b.y + b.height - a.y) < 0.01) &&
              Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 3;
            if (vertical || horizontal) {
              reached.add(j);
              changed = true;
            }
          }
  }
  if (requireConnected && reached.size !== rooms.length)
    throw new Error("The proposed rooms do not form a connected layout.");
  if (requireConnected)
    for (const room of rooms)
      if (room.type !== "hallway" && room.type !== "living") {
        const a = room.bounds;
        const access = rooms.some((other) => {
          if (other.type !== "hallway" && other.type !== "living") return false;
          const b = other.bounds;
          return (
            ((Math.abs(a.x + a.width - b.x) < 0.01 ||
              Math.abs(b.x + b.width - a.x) < 0.01) &&
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) >
                3) ||
            ((Math.abs(a.y + a.height - b.y) < 0.01 ||
              Math.abs(b.y + b.height - a.y) < 0.01) &&
              Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 3)
          );
        });
        if (!access)
          throw new Error(
            "A room has no doorway connection to the hall or living space.",
          );
      }
}
export function layoutFromRooms(
  rooms: Room[],
  request: LayoutRequest,
  id: string,
): FloorPlanLayout {
  validateRoomGeometry(rooms);
  const normalized = rooms.map((room) => ({
    ...room,
    area: room.bounds.width * room.bounds.height,
  }));
  const xs = normalized.flatMap((r) => [
      r.bounds.x,
      r.bounds.x + r.bounds.width,
    ]),
    ys = normalized.flatMap((r) => [r.bounds.y, r.bounds.y + r.bounds.height]);
  return {
    id,
    rooms: normalized,
    ...solveLayoutGeometry(normalized, request),
    dimensions: {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    },
    parameters: {
      bedrooms: normalized.filter((r) => r.type === "bedroom").length,
      bathrooms: normalized.filter((r) => r.type === "bathroom").length,
      totalArea: normalized.reduce((n, r) => n + r.area, 0),
      floors: 1,
      style: request.style,
      features: ["Concept layout", ...request.extras],
    },
    efficiency: 0,
    naturalLight: 0,
    generatedAt: new Date().toISOString(),
  };
}
export function createProceduralLayout(
  request: LayoutRequest,
  variant = 0,
): FloorPlanLayout {
  const { beds, baths, area, style } = request;
  const ratio = [1.05, 1.15, 1.25][variant % 3]!;
  const width = Math.sqrt(area * ratio),
    height = area / width;
  const hall = request.accessible ? 5 : 4,
    wing = (width - hall) / 2;
  const publicHeight = style === "l-shape" ? height * 0.8 : height;
  const bathRows = baths,
    bathHeight = 6;
  const extras = [...new Set(request.extras)],
    extraHeight = extras.length * 6;
  const communal = publicHeight - bathRows * bathHeight - extraHeight;
  if (wing < 7 || height / beds < 7 || communal < 12)
    throw new Error(
      "This room count does not fit this starting layout. Increase the area or reduce bedrooms, bathrooms, or extra rooms.",
    );
  const rooms: Room[] = [];
  const add = (
    type: Room["type"],
    label: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) =>
    rooms.push({
      id: `room-${rooms.length}`,
      type,
      label,
      bounds: { x, y, width: w, height: h },
      area: w * h,
    });
  add("living", "Living room", 0, 0, wing, communal * 0.6);
  add("kitchen", "Kitchen", 0, communal * 0.6, wing, communal * 0.4);
  extras.forEach((name, i) =>
    add(
      name === "Home Office" || name === "Library"
        ? "office"
        : name === "Garage"
          ? "garage"
          : name === "Terrace"
            ? "outdoor"
            : name === "Gym"
              ? "utility"
              : "storage",
      name,
      0,
      communal + i * 6,
      wing,
      6,
    ),
  );
  for (let i = 0; i < baths; i++) {
    add(
      "bathroom",
      `Bathroom ${i + 1}`,
      0,
      communal + extraHeight + i * bathHeight,
      wing,
      bathHeight,
    );
  }
  add("hallway", "Hallway", wing, 0, hall, height);
  for (let i = 0; i < beds; i++)
    add(
      "bedroom",
      `Bedroom ${i + 1}`,
      wing + hall,
      (i * height) / beds,
      wing,
      height / beds,
    );
  for (const room of rooms) {
    if (variant % 3 === 1)
      room.bounds.x = width - room.bounds.x - room.bounds.width;
    room.bounds.x -= width / 2;
    room.bounds.y -= height / 2;
  }
  return layoutFromRooms(
    rooms,
    request,
    `layout-${variant}-${crypto.randomUUID()}`,
  );
}
