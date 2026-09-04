import { describe, it, expect } from "vitest";
import { solveLayoutGeometry, furnishRooms } from "@/lib/geometry-solver";
import type { Room } from "@/types/puter";

describe("Geometric Layout Solver & Auto-Furnishing", () => {
  const sampleRooms: Room[] = [
    {
      id: "r-living",
      type: "living",
      label: "Living Room",
      bounds: { x: 0, y: 0, width: 20, height: 15 },
      area: 300,
    },
    {
      id: "r-bed",
      type: "bedroom",
      label: "Master Bedroom",
      bounds: { x: 20, y: 0, width: 15, height: 15 },
      area: 225,
    },
  ];

  it("identifies shared interior walls and creates interior doors", () => {
    const { walls, doors, windows } = solveLayoutGeometry(sampleRooms);

    // Should generate exterior bounding walls + shared interior partition wall
    expect(walls.length).toBeGreaterThanOrEqual(4);

    // Shared vertical boundary between Living and Bed at x = 20
    const sharedWall = walls.find(
      (w) => (w.start.x === 20 && w.end.x === 20) || (w.start.y === 0 && w.end.y === 15)
    );
    expect(sharedWall).toBeDefined();

    // Interior door placed along shared boundary
    expect(doors.length).toBeGreaterThan(0);

    // Exterior windows placed on perimeter
    expect(windows.length).toBeGreaterThan(0);
  });

  it("populates rooms with semantic 3D furniture based on room type", () => {
    const furniture = furnishRooms(sampleRooms);
    expect(furniture.length).toBeGreaterThan(0);

    // Living room gets sofa
    const sofa = furniture.find((f) => f.id.includes("r-living"));
    expect(sofa).toBeDefined();

    // Bedroom gets bed
    const bed = furniture.find((f) => f.id.includes("r-bed"));
    expect(bed).toBeDefined();
  });
});
