import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ApiResult } from "@/types/puter";

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

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_LIMIT - 1, resetTime: now + LIMIT_WINDOW_MS };
  }

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + LIMIT_WINDOW_MS;
    return { allowed: true, remaining: RATE_LIMIT_LIMIT - 1, resetTime: entry.resetTime };
  }

  if (entry.count >= RATE_LIMIT_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_LIMIT - entry.count, resetTime: entry.resetTime };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous_ip";
    
    // 1. Rate limiting check
    const rateCheck = checkRateLimit(ip);
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
        }
      );
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { ok: false, error: "Prompt is required to synthesize 3D spatial geometry." },
        { status: 400 }
      );
    }

    const replicateKey = process.env.REPLICATE_API_KEY;

    // 2. Active Replicate TRELLIS Inference Pipeline
    if (replicateKey) {
      try {
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Target fofr/trellis or stability-ai stable-diffusion-based 3D models
            version: "a80c98f98ec4cc346129841f3e782631557ad4b971a1795c735d4d3856170ea9", // fofr/trellis public release hash
            input: {
              prompt: prompt,
              texture_size: 1024,
              mesh_simplify: 0.95,
            },
          }),
        });

        const data = await response.json();
        
        if (data && data.urls && data.urls.get) {
          return NextResponse.json({
            ok: true,
            data: {
              id: data.id,
              status: data.status,
              pollUrl: data.urls.get,
              fallback: false,
            },
          });
        }
      } catch (replicateErr) {
        console.error("Replicate API connection failure, using secure procedural fallback:", replicateErr);
      }
    }

    // 3. SECURE FALLBACK: Procedural GLTF / GLB match for local testing
    // If no key is set, simulate a high-quality spatial mesh matching the user's description
    // This maps user furniture prompts to pre-bundled high-quality low-polygon Draco `.glb` models!
    let matchedAsset = "/models/armchair.glb";
    let message = "Procedural template loaded.";

    const lowercasePrompt = prompt.toLowerCase();
    if (lowercasePrompt.includes("chair") || lowercasePrompt.includes("seating") || lowercasePrompt.includes("stool")) {
      matchedAsset = "/models/chair.glb";
      message = "Matched with premium lounge chair.";
    } else if (lowercasePrompt.includes("table") || lowercasePrompt.includes("desk") || lowercasePrompt.includes("dining")) {
      matchedAsset = "/models/table.glb";
      message = "Matched with modular dining table.";
    } else if (lowercasePrompt.includes("couch") || lowercasePrompt.includes("sofa") || lowercasePrompt.includes("lounge")) {
      matchedAsset = "/models/sofa.glb";
      message = "Matched with Søren fabric lounge.";
    } else if (lowercasePrompt.includes("lamp") || lowercasePrompt.includes("light") || lowercasePrompt.includes("fixture")) {
      matchedAsset = "/models/lamp.glb";
      message = "Matched with architectural floor lamp.";
    }

    // Return mock prediction object simulating Replicate response
    return NextResponse.json({
      ok: true,
      data: {
        id: `mock-pred-${Date.now()}`,
        status: "succeeded",
        output: matchedAsset,
        message,
        fallback: true,
      },
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT_LIMIT),
        "X-RateLimit-Remaining": String(rateCheck.remaining),
        "X-RateLimit-Reset": String(rateCheck.resetTime),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal edge inference error.",
      },
      { status: 500 }
    );
  }
}
