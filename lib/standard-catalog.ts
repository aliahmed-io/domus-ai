export interface CatalogItem {
  id: string;
  name: string;
  type: "furniture" | "light";
  category: "seating" | "table" | "bed" | "storage" | "decor";
  dimensions: { width: number; depth: number; height: number }; // in meters
  gltfUrl: string; // bundled, self-contained GLB
  color: string;
}

export const StandardCatalog: Record<string, CatalogItem> = {
  "bed-queen": {
    id: "bed-queen",
    gltfUrl: "/models/kenney_furniture-kit/models/bedDouble.glb",
    name: "Queen Bed (Standard)",
    type: "furniture",
    category: "bed",
    dimensions: { width: 1.52, depth: 2.03, height: 1.1 }, // Queen size in meters
    color: "#e2e8f0", // Slate 200
  },
  "sofa-3seater": {
    id: "sofa-3seater",
    gltfUrl: "/models/kenney_furniture-kit/models/loungeSofa.glb",
    name: "3-Seater Modern Sofa",
    type: "furniture",
    category: "seating",
    dimensions: { width: 2.2, depth: 0.9, height: 0.8 },
    color: "#64748b", // Slate 500
  },
  "dining-table-6": {
    id: "dining-table-6",
    gltfUrl: "/models/kenney_furniture-kit/models/table.glb",
    name: "Dining Table (6 seats)",
    type: "furniture",
    category: "table",
    dimensions: { width: 1.8, depth: 0.9, height: 0.76 },
    color: "#78350f", // Amber 900 (wood)
  },
  "wardrobe-2door": {
    id: "wardrobe-2door",
    gltfUrl: "/models/kenney_furniture-kit/models/cabinetBed.glb",
    name: "2-Door Wardrobe",
    type: "furniture",
    category: "storage",
    dimensions: { width: 1.2, depth: 0.6, height: 2.1 },
    color: "#f8fafc",
  },
  "kitchen-island": {
    id: "kitchen-island",
    gltfUrl: "/models/kenney_furniture-kit/models/kitchenBar.glb",
    name: "Kitchen Island",
    type: "furniture",
    category: "table",
    dimensions: { width: 2.0, depth: 0.9, height: 0.9 },
    color: "#334155",
  },
  bathtub: {
    id: "bathtub",
    gltfUrl: "/models/kenney_furniture-kit/models/bathtub.glb",
    name: "Standard Bathtub",
    type: "furniture",
    category: "decor",
    dimensions: { width: 1.5, depth: 0.75, height: 0.5 },
    color: "#ffffff",
  },
};
