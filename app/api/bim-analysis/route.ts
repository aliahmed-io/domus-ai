import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ApiResult, FloorPlanLayout } from "@/types/puter";

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

    // Mock analysis data
    const mockBim = {
      rooms: [
        { id: "room-1", type: "bedroom" as const, label: "Suite", bounds: { x: 0, y: 0, width: 12, height: 12 }, area: 144 },
      ],
      walls: [
        { id: "wall-1", start: { x: 0, y: 0 }, end: { x: 12, y: 0 }, thickness: 9, height: 9, isLoadBearing: true },
      ],
      doors: [],
      windows: [],
      confidence: 94.7,
    };

    const successResponse: ApiResult<typeof mockBim> = {
      ok: true,
      data: mockBim,
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
