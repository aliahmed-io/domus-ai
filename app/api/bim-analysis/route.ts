import { NextResponse, type NextRequest } from "next/server";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  blueprintPixelSchema,
  normalizeBlueprintResult,
} from "@/lib/blueprint-ai";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData(),
      file = form.get("file");
    const scale = {
      width: Number(form.get("width")),
      height: Number(form.get("height")),
      pixelsPerFoot: Number(form.get("pixelsPerFoot")),
      wallHeight: Number(form.get("wallHeight")),
    };
    if (
      !(file instanceof File) ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024 ||
      !Object.values(scale).every((n) => Number.isFinite(n) && n > 0) ||
      scale.width > 1600 ||
      scale.height > 1600 ||
      scale.wallHeight > 30
    )
      return NextResponse.json(
        {
          ok: false,
          error: "Send a supported image and a valid measured calibration.",
        },
        { status: 400 },
      );
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI blueprint analysis is not configured. Use automatic tracing or trace the calibrated image manually.",
        },
        { status: 503 },
      );
    const bytes = await file.arrayBuffer(),
      dataUrl = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
    const { output } = await generateText({
      model: openai("gpt-4o"),
      output: Output.object({ schema: blueprintPixelSchema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract a draft of visible walls, rooms, and opening widths from this ${scale.width} by ${scale.height} pixel blueprint. Use IMAGE PIXEL coordinates, with x rightward and y downward, origin at the top left. Door/window positions are ratios along the referenced wall. Opening widths are pixels along the wall. Do not infer feet or assume a residential scale. Label unknown rooms unassigned. Omit uncertain details. Room rectangles must not overlap. Heights and load-bearing status cannot be inferred from a plan and must not be returned.`,
            },
            { type: "image", image: new URL(dataUrl) },
          ],
        },
      ],
    });
    const layout = normalizeBlueprintResult(output, scale);
    return NextResponse.json({
      ok: true,
      data: layout,
      message:
        "AI draft converted using your measured scale. Check recognition and edit default heights.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The AI draft could not be validated. No geometry was applied. Try a clearer image or use manual tracing.",
      },
      { status: 422 },
    );
  }
}
