import { expect, it } from "vitest";
import { calibrateBlueprint, blueprintBounds } from "@/lib/blueprint-reference";

it("uses a known segment rather than image borders to set scale", () => {
  expect(
    calibrateBlueprint({ x: 80, y: 70 }, { x: 560, y: 70 }, 24)?.pixelsPerFoot,
  ).toBe(20);
  expect(
    calibrateBlueprint({ x: 0, y: 0 }, { x: 60, y: 80 }, 5)?.pixelsPerFoot,
  ).toBe(20);
  expect(calibrateBlueprint({ x: 0, y: 0 }, { x: 0, y: 0 }, 5)).toBeNull();
  expect(calibrateBlueprint({ x: 0, y: 0 }, { x: 20, y: 0 }, 0)).toBeNull();
  expect(
    blueprintBounds({
      imageDataUrl: "data:image/png;base64,",
      widthPixels: 640,
      heightPixels: 480,
      pixelsPerFoot: 20,
      opacity: 0.4,
    }),
  ).toEqual({ x: -16, y: -12, width: 32, height: 24 });
});
