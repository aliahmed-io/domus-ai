import { createGenerationTicket } from "@/lib/server/generation-ticket";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export const runtime = "edge";

// ─── Rate Limiter Memory (Edge Sandbox) ───────────────────────────────────────
// Uses a rolling window stored in cookie signatures or edge runtime caches
const RATE_LIMIT_LIMIT = 5; // 5 gens per hour
const LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return {
      allowed: true,
      remaining: RATE_LIMIT_LIMIT - 1,
      resetTime: now + LIMIT_WINDOW_MS,
    };
  }

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + LIMIT_WINDOW_MS;
    return {
      allowed: true,
      remaining: RATE_LIMIT_LIMIT - 1,
      resetTime: entry.resetTime,
    };
  }

  if (entry.count >= RATE_LIMIT_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: RATE_LIMIT_LIMIT - entry.count,
    resetTime: entry.resetTime,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous_ip";

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Send a valid JSON object." },
        { status: 400 },
      );
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return NextResponse.json(
        { ok: false, error: "Send a JSON object." },
        { status: 400 },
      );
    const { prompt, image, catalogOnly = false } = body;
    if (typeof catalogOnly !== "boolean")
      return NextResponse.json(
        { ok: false, error: "Choose a valid model source." },
        { status: 400 },
      );
    if (
      (prompt !== undefined &&
        (typeof prompt !== "string" || prompt.length > 2000)) ||
      (image !== undefined &&
        (typeof image !== "string" ||
          image.length > 14000000 ||
          !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(image)))
    )
      return NextResponse.json(
        {
          ok: false,
          error:
            "Use a prompt up to 2000 characters or a PNG, JPEG, or WebP image up to 10 MB.",
        },
        { status: 400 },
      );
    if (!(typeof prompt === "string" && prompt.trim()) && !image)
      return NextResponse.json(
        { ok: false, error: "Add a prompt or an image." },
        { status: 400 },
      );

    const configuredVersion = process.env.REPLICATE_TRELLIS_VERSION;
    if (
      process.env.REPLICATE_API_KEY &&
      process.env.ENABLE_PAID_GENERATION === "true" &&
      !catalogOnly &&
      !/^[a-f0-9]{64}$/i.test(configuredVersion || "")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Configure REPLICATE_TRELLIS_VERSION from the documented firtoz/trellis images-input model before enabling live generation. No provider request was sent.",
        },
        { status: 503 },
      );
    }

    // 1. Rate limiting check
    const liveEnabled =
      Boolean(process.env.REPLICATE_API_KEY) &&
      process.env.ENABLE_PAID_GENERATION === "true" &&
      !catalogOnly;
    const rateCheck = liveEnabled
      ? checkRateLimit(ip)
      : {
          allowed: true,
          remaining: RATE_LIMIT_LIMIT,
          resetTime: Date.now() + LIMIT_WINDOW_MS,
        };
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Rate limit exceeded. Max 5 spatial generations per hour.",
          code: "429_LIMIT",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_LIMIT),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateCheck.resetTime),
          },
        },
      );
    }

    const replicateKey = process.env.REPLICATE_API_KEY;

    // 2. Active Replicate TRELLIS Inference Pipeline (Image-to-3D or Text-to-3D)
    if (
      replicateKey &&
      process.env.ENABLE_PAID_GENERATION === "true" &&
      !catalogOnly
    ) {
      if (!image)
        return NextResponse.json(
          {
            ok: false,
            error:
              "Live model generation needs a reference image. Use the image tab, or use catalog samples without a provider key.",
          },
          { status: 422 },
        );
      try {
        const trellisInput: Record<string, unknown> = {
          texture_size: 1024,
          mesh_simplify: 0.95, // 95% decimation for lightweight ~1-2MB web GLB
          generate_color: true,
          generate_model: true,
        };

        trellisInput.images = [image];

        const response = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            signal: AbortSignal.timeout(20000),
            method: "POST",
            headers: {
              Authorization: `Bearer ${replicateKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // Pin a configured version that uses the documented firtoz/trellis images schema.
              version: configuredVersion,
              input: trellisInput,
            }),
          },
        );

        if (!response.ok)
          return NextResponse.json(
            {
              ok: false,
              error:
                "The generation provider rejected the request. Check its configuration and input requirements.",
            },
            { status: 502 },
          );
        const data = await response.json();

        if (data && data.urls && data.urls.get) {
          return NextResponse.json({
            ok: true,
            data: {
              id: data.id,
              status: data.status,
              pollUrl: `/api/generate-3d/${encodeURIComponent(data.id)}?ticket=${encodeURIComponent(await createGenerationTicket(data.id, replicateKey))}`,
              fallback: false,
            },
          });
        }
        return NextResponse.json(
          {
            ok: false,
            error: "The generation provider returned an invalid job.",
          },
          { status: 502 },
        );
      } catch (replicateErr) {
        console.error("Replicate connection failure:", replicateErr);
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not connect to the generation provider. No model was added.",
          },
          { status: 502 },
        );
      }
    }

    // 3. SECURE FALLBACK: Procedural GLTF / GLB match for local testing
    let matchedAsset = "/models/kenney_furniture-kit/models/loungeChair.glb";
    let message = "Catalog sample loaded.";

    const query = (prompt || "").toLowerCase();
    if (
      query.includes("chair") ||
      query.includes("seating") ||
      query.includes("stool")
    ) {
      matchedAsset = "/models/kenney_furniture-kit/models/loungeChair.glb";
      message = "Catalog chair selected.";
    } else if (
      query.includes("table") ||
      query.includes("desk") ||
      query.includes("dining")
    ) {
      matchedAsset = "/models/kenney_furniture-kit/models/table.glb";
      message = "Matched with modular dining table.";
    } else if (
      query.includes("couch") ||
      query.includes("sofa") ||
      query.includes("lounge")
    ) {
      matchedAsset = "/models/kenney_furniture-kit/models/loungeSofa.glb";
      message = "Matched with Søren fabric lounge.";
    } else if (
      query.includes("lamp") ||
      query.includes("light") ||
      query.includes("fixture")
    ) {
      matchedAsset = "/models/kenney_furniture-kit/models/lampRoundFloor.glb";
      message = "Matched with architectural floor lamp.";
    } else if (
      query.includes("bookcase") ||
      query.includes("shelf") ||
      query.includes("cabinet") ||
      query.includes("sideboard")
    ) {
      matchedAsset = "/models/kenney_furniture-kit/models/bookcaseClosed.glb";
      message = "Matched with architectural storage cabinet.";
    } else if (query.includes("plant") || query.includes("tree")) {
      matchedAsset = "/models/kenney_furniture-kit/models/pottedPlant.glb";
      message = "Matched with architectural floor plant.";
    } else if (image) {
      matchedAsset = "/models/kenney_furniture-kit/models/loungeChairRelax.glb";
      message =
        "Catalog chair selected as a sample. No model was generated from your photo.";
    }

    // Catalog output is explicit, and quota metadata belongs in HTTP headers.
    return NextResponse.json(
      {
        ok: true,
        data: {
          id: `sample-${Date.now()}`,
          status: "succeeded",
          output: matchedAsset,
          message,
          fallback: true,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_LIMIT),
          "X-RateLimit-Remaining": String(rateCheck.remaining),
          "X-RateLimit-Reset": String(rateCheck.resetTime),
        },
      },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Internal edge inference error.",
      },
      { status: 500 },
    );
  }
}
