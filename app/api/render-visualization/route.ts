import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { style, roomDescription } = await req.json();
    const hfKey = process.env.HF_API_KEY;

    if (!hfKey) {
      return NextResponse.json(
        { ok: false, error: "HF_API_KEY not configured for high-fidelity rendering." },
        { status: 503 }
      );
    }

    const prompt = `Photorealistic architectural interior, ${style} design, ${roomDescription}, professional lighting, 8K quality, award-winning architectural photography`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { num_inference_steps: 28, guidance_scale: 3.5 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `HuggingFace API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    return new NextResponse(response.body, {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (error) {
    console.error("Render API Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error during rendering." },
      { status: 500 }
    );
  }
}
