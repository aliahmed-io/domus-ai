import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ApiResult, FloorPlanLayout, RoomType } from "@/types/puter";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      const errorResponse: ApiResult<never> = {
        ok: false,
        error: "Blueprint file upload cannot be empty.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    // Convert to base64
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64Data}`;

    // Prompt OpenAI GPT-4o with Vision
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        rooms: z.array(
          z.object({
            id: z.string(),
            type: z.enum([
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
              x: z.number().describe("X coordinate in feet"),
              y: z.number().describe("Y coordinate in feet"),
              width: z.number().describe("Width in feet"),
              height: z.number().describe("Height in feet"),
            }),
            area: z.number().describe("Area in sq ft"),
          })
        ),
        walls: z.array(
          z.object({
            id: z.string(),
            start: z.object({ x: z.number(), y: z.number() }),
            end: z.object({ x: z.number(), y: z.number() }),
            thickness: z.number().describe("Thickness in inches"),
            height: z.number().describe("Height in feet"),
            isLoadBearing: z.boolean(),
          })
        ),
        doors: z.array(
          z.object({
            id: z.string(),
            wallId: z.string(),
            position: z.number().describe("0.0 to 1.0 ratio along the wall"),
            width: z.number().describe("Width in inches"),
            isExterior: z.boolean(),
          })
        ),
        windows: z.array(
          z.object({
            id: z.string(),
            wallId: z.string(),
            position: z.number().describe("0.0 to 1.0 ratio along the wall"),
            width: z.number().describe("Width in inches"),
            height: z.number().describe("Height in inches"),
            sillHeight: z.number().describe("Sill height from floor in inches"),
          })
        ),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert architectural parser. Analyze this blueprint image and extract the rooms, structural walls, doors, and windows into precise mathematical data. Assume the scale is standard residential (e.g. 10x12 ft bedroom). Output exact numerical coordinates where possible. Connect doors and windows to their parent wall IDs.",
            },
            {
              type: "image",
              image: new URL(dataUrl),
            },
          ],
        },
      ],
    });

    const successResponse: ApiResult<Partial<FloorPlanLayout>> = {
      ok: true,
      data: {
        id: `bim-${Date.now()}`,
        rooms: object.rooms as unknown as FloorPlanLayout["rooms"],
        walls: object.walls as unknown as FloorPlanLayout["walls"],
        doors: object.doors as unknown as FloorPlanLayout["doors"],
        windows: object.windows as unknown as FloorPlanLayout["windows"],
        parameters: {
          bedrooms: object.rooms.filter(r => r.type === "bedroom").length,
          bathrooms: object.rooms.filter(r => r.type === "bathroom").length,
          totalArea: object.rooms.reduce((acc, r) => acc + r.area, 0),
          floors: 1,
          style: "traditional",
          features: []
        },
        dimensions: { width: 40, height: 40 }, // Fallback bounds
        efficiency: 95,
        naturalLight: 80,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(successResponse);
  } catch (err: unknown) {
    console.error("GPT-4o Vision API Error:", err);
    const errorResponse: ApiResult<never> = {
      ok: false,
      error: err instanceof Error ? err.message : "Internal edge error.",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
