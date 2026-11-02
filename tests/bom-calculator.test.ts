import { describe, it, expect } from "vitest";
import { computeLiveBomAndCompliance } from "@/lib/bom-calculator";
import type { FloorPlanLayout, Staircase, BuildingStorey, SceneObject } from "@/types/puter";

describe("Live Deterministic BOM & Compliance Engine", () => {
  const sampleLayout: FloorPlanLayout = {
    id: "test-layout",
    parameters: {
      bedrooms: 1,
      bathrooms: 1,
      totalArea: 600,
      floors: 1,
      style: "open-plan",
      features: [],
    },
    rooms: [
      {
        id: "r1",
        type: "bedroom",
        label: "Bedroom 1",
        bounds: { x: 0, y: 0, width: 14, height: 12 },
        area: 168,
        floorMaterial: "hardwood",
      },
      {
        id: "r2",
        type: "living",
        label: "Living Room",
        bounds: { x: 14, y: 0, width: 16, height: 14 },
        area: 224,
        floorMaterial: "tile",
      },
    ],
    walls: [
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 30, y: 0 }, thickness: 5, height: 9, isLoadBearing: true },
      { id: "w2", start: { x: 30, y: 0 }, end: { x: 30, y: 14 }, thickness: 5, height: 9, isLoadBearing: true },
      { id: "w3", start: { x: 30, y: 14 }, end: { x: 0, y: 14 }, thickness: 5, height: 9, isLoadBearing: true },
      { id: "w4", start: { x: 0, y: 14 }, end: { x: 0, y: 0 }, thickness: 5, height: 9, isLoadBearing: true },
      { id: "w-part", start: { x: 14, y: 0 }, end: { x: 14, y: 14 }, thickness: 4, height: 9, isLoadBearing: false },
    ],
    doors: [
      { id: "d1", wallId: "w1", position: 0.5, width: 36, height: 84, isExterior: true, doorType: "single" },
      { id: "d2", wallId: "w-part", position: 0.5, width: 32, height: 80, isExterior: false, doorType: "single" },
    ],
    windows: [
      { id: "win1", wallId: "w1", position: 0.2, width: 48, height: 60, sillHeight: 28, windowType: "double-hung" },
      { id: "win2", wallId: "w3", position: 0.7, width: 48, height: 60, sillHeight: 28, windowType: "double-hung" },
    ],
    dimensions: { width: 30, height: 14 },
    efficiency: 90,
    naturalLight: 85,
    generatedAt: new Date().toISOString(),
  };

  const sampleStairs: Staircase[] = [
    {
      id: "stair-1",
      startStoreyId: "storey-1",
      endStoreyId: "storey-2",
      position: { x: 5, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      width: 36,
      riserCount: 16,
      riserHeight: 7,
      type: "straight",
    },
  ];

  const sampleStoreys: BuildingStorey[] = [
    {
      id: "storey-1",
      name: "Level 1 - Ground",
      elevation: 0,
      height: 10,
      slabThickness: 0.8,
      floorPlanLayout: sampleLayout,
      isVisible: true,
    },
  ];

  const sampleObjects: SceneObject[] = [
    {
      id: "sofa-1",
      type: "furniture",
      name: "Lounge Sofa",
      position: { x: 20, y: 0, z: 7 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      gltfPath: "/models/kenney_furniture-kit/models/loungeSofa.glb",
    },
  ];

  it("calculates deterministic BOM line items and total estimated cost", () => {
    const { bomReport } = computeLiveBomAndCompliance(
      sampleLayout,
      sampleStoreys,
      sampleObjects,
      sampleStairs
    );

    expect(bomReport).toBeDefined();
    if (!bomReport) throw new Error("Expected bomReport to be defined");
    expect(bomReport.items.length).toBeGreaterThan(5);

    // Should include structural framing, drywall, doors, windows, concrete slab, flooring, and furniture
    const categories = bomReport.items.map((i) => i.category);
    expect(categories).toContain("Foundation & Slabs");
    expect(categories).toContain("Structure");
    expect(categories).toContain("Finishes");
    expect(categories).toContain("Openings");
    expect(categories).toContain("Flooring");
    expect(categories).toContain("Vertical Circulation");
    expect(categories).toContain("FF&E Furnishings");

    // Total cost should be non-zero and matching item sums
    const calculatedSum = bomReport.items.reduce((acc, i) => acc + (i.estimatedCost || 0), 0);
    expect(bomReport.totalEstimatedCost).toBe(calculatedSum);
    expect(bomReport.totalEstimatedCost).toBeGreaterThan(1000);
  });

  it("passes IBC compliance checks for standard compliant layouts", () => {
    const { violations } = computeLiveBomAndCompliance(
      sampleLayout,
      sampleStoreys,
      sampleObjects,
      sampleStairs
    );

    // Egress door is 36" (>= 32"), stair width is 36" (>= 36"), riser is 7" (<= 7.75"), bedroom has windows
    const criticalViolations = violations.filter((v) => v.severity === "error");
    expect(criticalViolations.length).toBe(0);
  });

  it("flags IBC violation when staircase riser height exceeds 7.75 inches", () => {
    const nonCompliantStairs: Staircase[] = [
      {
        id: "stair-steep",
        startStoreyId: "storey-1",
        endStoreyId: "storey-2",
        position: { x: 5, y: 0, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        width: 36,
        riserCount: 14,
        riserHeight: 8.5, // Exceeds 7.75" limit
        type: "straight",
      },
    ];

    const { violations } = computeLiveBomAndCompliance(
      sampleLayout,
      sampleStoreys,
      sampleObjects,
      nonCompliantStairs
    );

    const riserViolation = violations.find((v) => v.code === "IRC-R311.7.5.1");
    expect(riserViolation).toBeDefined();
    expect(riserViolation?.severity).toBe("error");
  });
});
