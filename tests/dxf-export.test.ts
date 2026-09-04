import { describe, it, expect } from "vitest";
import { generateFloorPlanDXF } from "@/lib/export/floor-plan-dxf";
import type { FloorPlanLayout } from "@/types/puter";

describe("AIA Layered DXF CAD Export Engine", () => {
  const sampleLayout: FloorPlanLayout = {
    id: "layout-commercial-test",
    walls: [
      {
        id: "wall-1",
        start: { x: 0, y: 0 },
        end: { x: 20, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: true,
      },
      {
        id: "wall-2",
        start: { x: 20, y: 0 },
        end: { x: 20, y: 15 },
        thickness: 6,
        height: 10,
        isLoadBearing: false,
      },
    ],
    rooms: [
      {
        id: "room-1",
        type: "living",
        label: "Great Room",
        bounds: { x: 0, y: 0, width: 20, height: 15 },
        area: 300,
      },
    ],
    doors: [
      {
        id: "door-1",
        wallId: "wall-1",
        position: 0.5,
        width: 36,
        isExterior: false,
        doorType: "single",
        swingSide: "left",
        swingDirection: "inward",
      },
    ],
    windows: [
      {
        id: "win-1",
        wallId: "wall-2",
        position: 0.5,
        width: 48,
        height: 48,
        sillHeight: 36,
      },
    ],
    parameters: {
      bedrooms: 1,
      bathrooms: 1,
      totalArea: 300,
      floors: 1,
      style: "open-plan",
      features: [],
    },
    dimensions: { width: 20, height: 15 },
    efficiency: 92,
    naturalLight: 85,
    generatedAt: new Date().toISOString(),
  };

  it("generates valid DXF string output containing standard AIA CAD layers", () => {
    const dxfString = generateFloorPlanDXF(sampleLayout);

    expect(dxfString).toBeDefined();
    expect(typeof dxfString).toBe("string");
    expect(dxfString.length).toBeGreaterThan(100);

    // Verify AIA Standard Layers exist in entity definitions
    expect(dxfString).toContain("A-WALL");
    expect(dxfString).toContain("A-DOOR");
    expect(dxfString).toContain("A-GLAZ");
    expect(dxfString).toContain("A-AREA-IDEN");

    // Verify room area callout is written into DXF text
    expect(dxfString).toContain("Great Room (300 SQFT)");
    expect(dxfString).toContain("DOOR 36\"");
    expect(dxfString).toContain("WIN 48\"x48\"");
  });
});
