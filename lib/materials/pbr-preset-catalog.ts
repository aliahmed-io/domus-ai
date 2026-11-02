import type { Material } from "@/types/puter";
// Built-in surface finishes work offline and match the preview exactly.
export const PBR_PRESETS: Record<string, Material> = Object.fromEntries(
  [
    {
      id: "alabaster_drywall",
      name: "Alabaster Drywall",
      color: "#e3ded7",
      roughness: 0.9,
      metalness: 0,
    },
    {
      id: "walnut_trim",
      name: "Walnut Trim",
      color: "#8a7e72",
      roughness: 0.4,
      metalness: 0.1,
    },
    {
      id: "forest_siding",
      name: "Forest Siding",
      color: "#4f5d54",
      roughness: 0.8,
      metalness: 0,
    },
    {
      id: "oak_herringbone",
      name: "Oak Herringbone",
      color: "#d9ab55",
      roughness: 0.3,
      metalness: 0.15,
    },
    {
      id: "obsidian_slate",
      name: "Obsidian Slate",
      color: "#222222",
      roughness: 0.6,
      metalness: 0.2,
    },
  ].map((preset) => [
    preset.name,
    {
      ...preset,
      texture: {},
      prompt: preset.name,
      generatedAt: "2026-11-02T00:00:00.000Z",
    },
  ]),
);
