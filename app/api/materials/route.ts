import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ApiResult } from "@/types/puter";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt = "" } = body;

    if (!prompt.trim()) {
      const errorResponse: ApiResult<never> = {
        ok: false,
        error: "Prompt cannot be empty.",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Mock generative texture delivery URLs
    const mockTextures = {
      map: "https://assets.puter.site/textures/wood_albedo.jpg",
      normalMap: "https://assets.puter.site/textures/wood_normal.jpg",
      roughnessMap: "https://assets.puter.site/textures/wood_roughness.jpg",
    };

    const successResponse: ApiResult<{ textureUrls: typeof mockTextures }> = {
      ok: true,
      data: { textureUrls: mockTextures },
    };

    return NextResponse.json(successResponse);
  } catch (err: unknown) {
    const errorResponse: ApiResult<never> = {
      ok: false,
      error: err instanceof Error ? err.message : "Internal edge error.",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
