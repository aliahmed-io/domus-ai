import { describe, it, expect } from "vitest";
import { generateFloorPlanIFC } from "@/lib/export/floor-plan-ifc";
import type { FloorPlanLayout, BuildingStorey } from "@/types/puter";

describe("OpenBIM IFC4 Export Engine", () => {
  const baseLayout: FloorPlanLayout = {
    id: "test-proj-01",
    parameters: { bedrooms: 2, bathrooms: 1, totalArea: 800, floors: 1, style: "open-plan", features: [] },
    rooms: [
      { id: "r1", type: "living", label: "Living", bounds: { x: 0, y: 0, width: 20, height: 20 }, area: 400 },
    ],
    walls: [
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 20, y: 0 }, thickness: 6, height: 10, isLoadBearing: true },
      { id: "w2", start: { x: 20, y: 0 }, end: { x: 20, y: 20 }, thickness: 6, height: 10, isLoadBearing: true },
    ],
    doors: [
      { id: "d1", wallId: "w1", position: 0.5, width: 36, isExterior: true },
    ],
    windows: [
      { id: "win1", wallId: "w2", position: 0.5, width: 48, height: 60, sillHeight: 24 },
    ],
    dimensions: { width: 20, height: 20 },
    efficiency: 92,
    naturalLight: 88,
    generatedAt: new Date().toISOString(),
  };

  it("generates a valid ISO-10303-21 header and IFC4 schema declaration", () => {
    const ifc = generateFloorPlanIFC(baseLayout);
    expect(ifc).toContain("ISO-10303-21;");
    expect(ifc).toContain("FILE_SCHEMA(('IFC4'));");
    expect(ifc).toContain("END-ISO-10303-21;");
  });

  it("exports true 3D extruded solids for walls", () => {
    const ifc = generateFloorPlanIFC(baseLayout);
    expect(ifc).toContain("IFCEXTRUDEDAREASOLID");
    expect(ifc).toContain("IFCRECTANGLEPROFILEDEF");
    expect(ifc).toContain("IFCSHAPEREPRESENTATION");
    expect(ifc).toContain("IFCWALL(");
  });

  it("exports parametric doors and windows", () => {
    const ifc = generateFloorPlanIFC(baseLayout);
    expect(ifc).toContain("IFCDOOR(");
    expect(ifc).toContain("IFCWINDOW(");
  });

  it("supports multi-storey hierarchy and elevations", () => {
    const storeys: BuildingStorey[] = [
      {
        id: "l1",
        name: "Ground Floor",
        elevation: 0,
        height: 10,
        slabThickness: 0.8,
        isVisible: true,
        floorPlanLayout: baseLayout,
      },
      {
        id: "l2",
        name: "Level 2",
        elevation: 10,
        height: 10,
        slabThickness: 0.8,
        isVisible: true,
        floorPlanLayout: {
          ...baseLayout,
          id: "l2-layout",
          walls: [
            { id: "w3", start: { x: 0, y: 0 }, end: { x: 15, y: 0 }, thickness: 6, height: 10, isLoadBearing: false },
          ],
        },
      },
    ];

    const ifc = generateFloorPlanIFC(baseLayout, storeys);
    expect(ifc).toContain("Ground Floor");
    expect(ifc).toContain("Level 2");
    expect(ifc).toContain("IFCBUILDINGSTOREY");
  });
});
