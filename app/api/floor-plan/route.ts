import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { FloorPlanLayout, Room, Wall, Door, Window2D, Vec2D, ApiResult } from "@/types/puter";

export const runtime = "edge";

function generateLayoutVariant(
  index: number,
  beds: number,
  baths: number,
  area: number,
  style: "open-plan" | "traditional" | "l-shape" | "studio"
): FloorPlanLayout {
  // Compute approximate dimensions in feet
  const ratio = style === "l-shape" ? 1.5 : style === "studio" ? 1.0 : 1.3;
  const height = Math.round(Math.sqrt(area / ratio));
  const width = Math.round(area / height);

  const rooms: Room[] = [];
  const walls: Wall[] = [];
  const doors: Door[] = [];
  const windows: Window2D[] = [];

  // 1. GENERATE ROOMS
  // Add main living area
  rooms.push({
    id: `room-living-${index}`,
    type: "living",
    label: "Living Room",
    bounds: { x: 0, y: 0, width: Math.round(width * 0.4), height: height },
    area: Math.round(width * 0.4 * height),
  });

  // Add kitchen
  rooms.push({
    id: `room-kitchen-${index}`,
    type: "kitchen",
    label: "Kitchen",
    bounds: { x: Math.round(width * 0.4), y: 0, width: Math.round(width * 0.2), height: Math.round(height * 0.5) },
    area: Math.round(width * 0.2 * height * 0.5),
  });

  // Add Bedrooms
  for (let i = 0; i < beds; i++) {
    const rW = Math.round(width * 0.2);
    const rH = Math.round(height * 0.5);
    const rX = Math.round(width * 0.6) + (i % 2 === 0 ? 0 : -rW);
    const rY = i % 2 === 0 ? 0 : rH;

    rooms.push({
      id: `room-bed-${i}-${index}`,
      type: "bedroom",
      label: `Bedroom ${i + 1}`,
      bounds: { x: rX, y: rY, width: rW, height: rH },
      area: rW * rH,
    });
  }

  // Add Bathrooms
  for (let i = 0; i < baths; i++) {
    const rW = Math.round(width * 0.1);
    const rH = Math.round(height * 0.3);
    const rX = Math.round(width * 0.4) + i * rW;
    const rY = Math.round(height * 0.5);

    rooms.push({
      id: `room-bath-${i}-${index}`,
      type: "bathroom",
      label: `Bathroom ${i + 1}`,
      bounds: { x: rX, y: rY, width: rW, height: rH },
      area: rW * rH,
    });
  }

  // 2. GENERATE WALLS (From rooms boundaries)
  // Simple boundary walls outer shell
  const boundaryWalls = [
    { start: { x: 0, y: 0 }, end: { x: width, y: 0 } },
    { start: { x: width, y: 0 }, end: { x: width, y: height } },
    { start: { x: width, y: height }, end: { x: 0, y: height } },
    { start: { x: 0, y: height }, end: { x: 0, y: 0 } },
  ];

  boundaryWalls.forEach((w, wIdx) => {
    walls.push({
      id: `wall-outer-${wIdx}-${index}`,
      start: w.start,
      end: w.end,
      thickness: 9, // inches
      height: 9, // feet
      isLoadBearing: true,
    });
  });

  // Generates interior divider walls
  rooms.forEach((r, rIdx) => {
    if (rIdx === 0) return; // skip living room outer checks
    walls.push({
      id: `wall-interior-${r.id}`,
      start: { x: r.bounds.x, y: r.bounds.y },
      end: { x: r.bounds.x, y: r.bounds.y + r.bounds.height },
      thickness: 5,
      height: 9,
      isLoadBearing: false,
    });
  });

  // 3. GENERATE DOORS
  walls.forEach((wall, wallIdx) => {
    if (wallIdx > 3) {
      doors.push({
        id: `door-${wall.id}`,
        wallId: wall.id,
        position: 0.5,
        width: 32, // standard interior doorway width
        isExterior: false,
      });
    }
  });

  // Add front entry door
  doors.push({
    id: `door-entry-${index}`,
    wallId: walls[0]?.id || `wall-outer-0-${index}`,
    position: 0.2,
    width: 36, // main door
    isExterior: true,
  });

  // 4. GENERATE WINDOWS
  for (let i = 0; i < 4; i++) {
    const parentWall = walls[i % 4];
    if (parentWall) {
      windows.push({
        id: `window-${i}-${index}`,
        wallId: parentWall.id,
        position: 0.4 + i * 0.1,
        width: 48,
        height: 60,
        sillHeight: 30,
      });
    }
  }

  // Scoring
  const efficiency = 80 + index * 5 - Math.round(beds * 2);
  const naturalLight = 75 + (4 - index) * 6;

  return {
    id: `layout-${index}-${style}-${area}`,
    parameters: {
      bedrooms: beds,
      bathrooms: baths,
      totalArea: area,
      floors: 1,
      style: style,
      features: ["Storage Priority", "Natural Light"],
    },
    rooms,
    walls,
    doors,
    windows,
    dimensions: { width, height },
    efficiency,
    naturalLight,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { beds = 2, baths = 2, area = 1200, style = "open-plan" } = body;

    // Validate
    if (beds <= 0 || baths <= 0 || area < 200) {
      const errorResponse: ApiResult<never> = {
        ok: false,
        error: "Invalid room specifications or total area parameters.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if OPENAI_API_KEY is available
    if (process.env.OPENAI_API_KEY) {
      // Use AI Layout Generator
      const FloorPlanSchema = z.object({
        rooms: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["bedroom", "bathroom", "kitchen", "living", "dining", "hallway"]),
            label: z.string(),
            bounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }),
            area: z.number(),
          })
        ),
        efficiency: z.number().min(0).max(100),
        naturalLight: z.number().min(0).max(100),
      });

      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: FloorPlanSchema,
        prompt: `Generate an optimal ${beds}BR/${baths}BA floor plan for ${area} sq ft in ${style} style. Return room coordinates and sizes. Ensure logic and valid spatial distribution.`,
      });

      // Construct a layout variant based on AI output
      // For simplicity, we just use the AI rooms and auto-generate walls/doors
      // Or we can just fallback to our logic with the AI's efficiency scores for this demo:
      const aiLayout = generateLayoutVariant(1, beds, baths, area, style);
      aiLayout.efficiency = object.efficiency;
      aiLayout.naturalLight = object.naturalLight;
      // Ideally we would map object.rooms to our layout completely, but keeping this robust for demo.
      // aiLayout.rooms = object.rooms as unknown as Room[]; // uncomment when fully ready

      return NextResponse.json({
        ok: true,
        data: [aiLayout, generateLayoutVariant(2, beds, baths, area, style), generateLayoutVariant(3, beds, baths, area, style)],
      });
    }

    // Generate three variant layouts (Fallback)
    const layouts = [
      generateLayoutVariant(1, beds, baths, area, style),
      generateLayoutVariant(2, beds, baths, area, style),
      generateLayoutVariant(3, beds, baths, area, style),
    ];

    const successResponse: ApiResult<FloorPlanLayout[]> = {
      ok: true,
      data: layouts,
    };

    return NextResponse.json(successResponse);
  } catch (err: unknown) {
    const errorResponse: ApiResult<never> = {
      ok: false,
      error: err instanceof Error ? err.message : "Internal edge compilation error.",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
