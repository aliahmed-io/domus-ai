import type { Material } from "@/types/puter";

export const PBR_PRESETS: Record<string, Material> = {
  "Alabaster Drywall": {
    id: "alabaster_drywall",
    name: "Alabaster Drywall",
    prompt: "seamless plaster texture, alabaster white, fine grain",
    texture: {
      map: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=60", // realistic texture placeholder
    },
    roughness: 0.9,
    metalness: 0.0,
    generatedAt: new Date().toISOString(),
  },
  "Walnut Trim": {
    id: "walnut_trim",
    name: "Walnut Trim",
    prompt: "seamless dark walnut wood texture, rich grain",
    texture: {
      map: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=500&q=60",
    },
    roughness: 0.4,
    metalness: 0.1,
    generatedAt: new Date().toISOString(),
  },
  "Forest Siding": {
    id: "forest_siding",
    name: "Forest Siding",
    prompt: "seamless vertical cedar siding, painted forest green",
    texture: {
      map: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=60",
    },
    roughness: 0.8,
    metalness: 0.0,
    generatedAt: new Date().toISOString(),
  },
  "Oak Herringbone": {
    id: "oak_herringbone",
    name: "Oak Herringbone",
    prompt: "seamless oak herringbone wood flooring, natural finish",
    texture: {
      map: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=500&q=60",
    },
    roughness: 0.3,
    metalness: 0.15,
    generatedAt: new Date().toISOString(),
  },
  "Obsidian Slate": {
    id: "obsidian_slate",
    name: "Obsidian Slate",
    prompt: "seamless dark charcoal stone slate tiles",
    texture: {
      map: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=60",
    },
    roughness: 0.6,
    metalness: 0.2,
    generatedAt: new Date().toISOString(),
  },
};
