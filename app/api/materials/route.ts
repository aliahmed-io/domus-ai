import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ApiResult, Material, PbrTexture } from "@/types/puter";

export const runtime = "edge";

// Polyhaven texture helper mapping for common keywords
const KEYWORD_FALLBACKS: Record<string, { map: string; normalMap?: string; roughnessMap?: string; roughness: number; metalness: number }> = {
  wood: {
    map: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-wood/wood_table_wear_01_diff_1k.jpg",
    normalMap: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-wood/wood_table_wear_01_nor_gl_1k.jpg",
    roughnessMap: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-wood/wood_table_wear_01_rough_1k.jpg",
    roughness: 0.4,
    metalness: 0.1,
  },
  brick: {
    map: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg",
    normalMap: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_bump.jpg",
    roughness: 0.9,
    metalness: 0.0,
  },
  plaster: {
    map: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=60",
    roughness: 0.95,
    metalness: 0.0,
  },
  slate: {
    map: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=60",
    roughness: 0.6,
    metalness: 0.2,
  },
  tile: {
    map: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=500&q=60",
    roughness: 0.3,
    metalness: 0.15,
  },
};

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

    const lowercasePrompt = prompt.toLowerCase();
    let selectedTexture = KEYWORD_FALLBACKS.plaster || {
      map: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=60",
      roughness: 0.95,
      metalness: 0.0,
    };

    // Match keywords to select high-quality texture maps
    for (const [keyword, tex] of Object.entries(KEYWORD_FALLBACKS)) {
      if (lowercasePrompt.includes(keyword) && tex) {
        selectedTexture = tex;
        break;
      }
    }

    // Try to fetch from Polyhaven API for real-time assets if keyword matches
    try {
      const res = await fetch("https://api.polyhaven.com/assets?type=textures");
      if (res.ok) {
        const assets = await res.json();
        // Look for assets whose name or tags contain prompt keywords
        const matchedAssetKey = Object.keys(assets).find((key) => {
          const asset = assets[key];
          const name = (asset.name || "").toLowerCase();
          const tags = (asset.tags || []).map((t: string) => t.toLowerCase());
          return name.includes(lowercasePrompt) || tags.some((t: string) => t.includes(lowercasePrompt));
        });

        if (matchedAssetKey) {
          // Construct official Polyhaven PBR urls
          // Format: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{key}/{key}_{type}_1k.jpg
          const key = matchedAssetKey;
          selectedTexture = {
            map: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${key}/${key}_diff_1k.jpg`,
            normalMap: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${key}/${key}_nor_gl_1k.jpg`,
            roughnessMap: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${key}/${key}_rough_1k.jpg`,
            roughness: lowercasePrompt.includes("glossy") || lowercasePrompt.includes("polished") ? 0.2 : 0.7,
            metalness: lowercasePrompt.includes("metal") || lowercasePrompt.includes("brass") || lowercasePrompt.includes("steel") ? 0.9 : 0.0,
          };
        }
      }
    } catch (e) {
      console.warn("Polyhaven API fetch error, using robust preset fallbacks:", e);
    }

    const texture: PbrTexture = {};
    if (selectedTexture.map) texture.map = selectedTexture.map;
    if (selectedTexture.normalMap) texture.normalMap = selectedTexture.normalMap;
    if (selectedTexture.roughnessMap) texture.roughnessMap = selectedTexture.roughnessMap;

    // Form complete Material response structure
    const generatedMaterial: Material = {
      id: `gen-mat-${Date.now()}`,
      name: prompt,
      prompt: prompt,
      texture,
      roughness: selectedTexture.roughness,
      metalness: selectedTexture.metalness,
      generatedAt: new Date().toISOString(),
    };

    const successResponse: ApiResult<Material> = {
      ok: true,
      data: generatedMaterial,
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
