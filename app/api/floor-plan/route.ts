import { NextResponse, type NextRequest } from "next/server";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  createProceduralLayout,
  layoutFromRooms,
  layoutRequestSchema,
} from "@/lib/layout-generation";
export const runtime = "edge";
export async function POST(req: NextRequest) {
  let input;
  try {
    input = layoutRequestSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Send a valid layout request." },
      { status: 400 },
    );
  }
  if (!input.success)
    return NextResponse.json(
      {
        ok: false,
        error:
          "Choose 1–6 bedrooms, 1–4 bathrooms, a supported style, and an area between 200 and 10,000 sq ft.",
      },
      { status: 400 },
    );
  const request = input.data;
  try {
    if (process.env.OPENAI_API_KEY) {
      const { output } = await generateText({
        model: openai("gpt-4o"),
        output: Output.object({
          schema: z.object({
            rooms: z
              .array(
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
                    "storage",
                    "utility",
                    "garage",
                    "outdoor",
                  ]),
                  label: z.string(),
                  bounds: z.object({
                    x: z.number(),
                    y: z.number(),
                    width: z.number().positive(),
                    height: z.number().positive(),
                  }),
                  area: z.number().nonnegative(),
                }),
              )
              .min(1)
              .max(40),
          }),
        }),
        prompt: `Propose a concept floor plan in feet for ${JSON.stringify(request)}. Use non-overlapping positive rectangles, a connected hallway, and no invented performance or compliance scores. Rooms must share boundaries. Include the requested bedroom and bathroom counts.`,
      });
      if (
        !output ||
        output.rooms.filter((r) => r.type === "bedroom").length !==
          request.beds ||
        output.rooms.filter((r) => r.type === "bathroom").length !==
          request.baths
      )
        throw new Error(
          "The AI result did not match the requested room counts.",
        );
      const layout = layoutFromRooms(
        output.rooms,
        request,
        crypto.randomUUID(),
      );
      const actual = layout.parameters.totalArea;
      if (actual < request.area * 0.8 || actual > request.area * 1.2)
        throw new Error("The AI result did not match the requested area.");
      return NextResponse.json({
        ok: true,
        data: [layout],
        source: "ai",
        message:
          "AI concept checked for room overlaps. Review circulation and dimensions.",
      });
    }
    const layouts = [];
    for (let i = 0; i < 3; i++) {
      try {
        layouts.push(createProceduralLayout(request, i));
      } catch {}
    }
    if (!layouts.length)
      return NextResponse.json(
        {
          ok: false,
          error:
            "This room count does not fit the starting layouts. Increase the area or reduce the room count.",
        },
        { status: 422 },
      );
    return NextResponse.json({
      ok: true,
      data: layouts,
      source: "procedural",
      message: "Starting layout created locally. No AI service was used.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The proposed layout could not be validated. No layout was applied. Try again or change the room requirements.",
      },
      { status: 422 },
    );
  }
}
