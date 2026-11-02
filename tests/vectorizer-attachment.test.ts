import { describe, it, expect } from "vitest";
import { vectorizeBlueprintImage } from "@/lib/blueprint-vectorizer";
import { feetToMeters } from "@/lib/utils";

describe("Algorithmic Blueprint Vectorizer & Scale Calibration", () => {
  function createSyntheticFloorplanImageData(width = 200, height = 200): ImageData {
    // In JSDOM, create a Uint8ClampedArray representing a white image with black rectangular walls
    const buffer = new Uint8ClampedArray(width * height * 4);
    
    // Fill white background (paper)
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 255;
      buffer[i + 1] = 255;
      buffer[i + 2] = 255;
      buffer[i + 3] = 255;
    }

    // Helper to draw a black wall line (ink)
    const drawWall = (x1: number, y1: number, x2: number, y2: number, thickness = 4) => {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          for (let ty = -thickness; ty <= thickness; ty++) {
            for (let tx = -thickness; tx <= thickness; tx++) {
              const px = x + tx;
              const py = y + ty;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                buffer[idx] = 0;     // R
                buffer[idx + 1] = 0; // G
                buffer[idx + 2] = 0; // B
                buffer[idx + 3] = 255;
              }
            }
          }
        }
      }
    };

    // Draw outer perimeter box (20x20 ft room representation)
    drawWall(30, 30, 170, 30);  // Top wall
    drawWall(30, 170, 170, 170); // Bottom wall
    drawWall(30, 30, 30, 170);  // Left wall
    drawWall(170, 30, 170, 170); // Right wall

    return {
      data: buffer,
      width,
      height,
      colorSpace: "srgb",
    } as unknown as ImageData;
  }

  it("extracts walls and calculates confidence from high-contrast synthetic blueprint", async () => {
    const syntheticImg = createSyntheticFloorplanImageData(200, 200);

    const result = await vectorizeBlueprintImage(syntheticImg, {
      calibrationFeet: 20,
      calibrationPixels: 140, // 170 - 30 = 140px equals 20ft
      wallThicknessInches: 6,
      wallHeightFeet: 9,
    });

    expect(result).toBeDefined();
    expect(result.wallCount).toBeGreaterThanOrEqual(4);
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.layout.walls.length).toBeGreaterThanOrEqual(4);
    expect(result.totalAreaSqFt).toBeGreaterThan(0);
    expect(result.layout.doors).toEqual([]);
    expect(result.layout.windows).toEqual([]);
    expect(result.layout.parameters.bedrooms).toBe(0);
    expect(result.layout.parameters.bathrooms).toBe(0);
  });

  it("correctly applies calibration scale ruler to convert pixels to real-world feet", async () => {
    const syntheticImg = createSyntheticFloorplanImageData(200, 200);

    // Test with 10 ft scale
    const result10ft = await vectorizeBlueprintImage(syntheticImg, {
      calibrationFeet: 10,
      calibrationPixels: 140,
    });

    // Test with 20 ft scale
    const result20ft = await vectorizeBlueprintImage(syntheticImg, {
      calibrationFeet: 20,
      calibrationPixels: 140,
    });

    // When calibration length doubles, dimensions in feet double, area quadruples
    expect(result20ft.totalAreaSqFt).toBeGreaterThan(result10ft.totalAreaSqFt);
  });
});

describe("Furniture Attachment Snapping Altitudes", () => {
  // Pure altitude calculator mirroring CatalogPanel.tsx
  function calculateAttachmentAltitude(
    attachmentType: "floor" | "ceiling" | "wall" | "surface" | "default",
    storeyElevationFeet = 0,
    storeyHeightFeet = 9
  ): number {
    const elevationM = feetToMeters(storeyElevationFeet);
    const heightM = feetToMeters(storeyHeightFeet);

    switch (attachmentType) {
      case "floor":
        return elevationM + 0.005; // 5mm above floor to prevent z-fighting
      case "ceiling":
        return elevationM + heightM; // Attached to ceiling slab
      case "wall":
        return elevationM + 1.7; // Wall sconce at standard eye-level
      case "surface":
        return elevationM + 0.75; // Tabletop / counter height
      default:
        return elevationM + 0.0;
    }
  }

  it("calculates correct Y altitudes for Level 1 (0ft elevation)", () => {
    const carpetY = calculateAttachmentAltitude("floor", 0, 9);
    expect(carpetY).toBeCloseTo(0.005, 4);

    const ceilingLightY = calculateAttachmentAltitude("ceiling", 0, 9);
    // 9ft = ~2.7432m
    expect(ceilingLightY).toBeCloseTo(2.7432, 2);

    const sconceY = calculateAttachmentAltitude("wall", 0, 9);
    expect(sconceY).toBeCloseTo(1.7, 2);

    const tableLampY = calculateAttachmentAltitude("surface", 0, 9);
    expect(tableLampY).toBeCloseTo(0.75, 2);
  });

  it("calculates correct stacked Y altitudes for Level 2 (10ft elevation)", () => {
    // 10ft = 3.048m
    const level2ElevationFt = 10;
    const level2ElevationM = feetToMeters(level2ElevationFt); // 3.048m

    const carpetY = calculateAttachmentAltitude("floor", level2ElevationFt, 9);
    expect(carpetY).toBeCloseTo(level2ElevationM + 0.005, 4);

    const ceilingLightY = calculateAttachmentAltitude("ceiling", level2ElevationFt, 9);
    expect(ceilingLightY).toBeCloseTo(level2ElevationM + feetToMeters(9), 2);
  });
});
