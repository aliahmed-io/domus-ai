import type { BlueprintReference, Vec2D, FloorPlanLayout } from "@/types/puter";

export function calibrateBlueprint(
  start: Vec2D,
  end: Vec2D,
  lengthFeet: number,
) {
  const distancePixels = Math.hypot(end.x - start.x, end.y - start.y);
  if (
    ![start.x, start.y, end.x, end.y, lengthFeet].every(Number.isFinite) ||
    lengthFeet <= 0 ||
    distancePixels < 2
  )
    return null;
  return { distancePixels, pixelsPerFoot: distancePixels / lengthFeet };
}
export function blueprintBounds(reference: BlueprintReference) {
  const width = reference.widthPixels / reference.pixelsPerFoot;
  const height = reference.heightPixels / reference.pixelsPerFoot;
  return { x: -width / 2, y: -height / 2, width, height };
}

/** Embed a bounded raster so tracing never depends on a revoked blob URL. */
export async function embedBlueprint(
  src: string,
  pixelsPerFoot: number,
): Promise<BlueprintReference> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not read this blueprint."));
    image.src = src;
  });
  const ratio = Math.min(
    1,
    1600 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * ratio);
  canvas.height = Math.round(image.naturalHeight * ratio);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image conversion is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageDataUrl = canvas.toDataURL("image/png");
  if (imageDataUrl.length > 2_000_000)
    throw new Error(
      "Use a smaller blueprint image so the project can be saved locally.",
    );
  return {
    imageDataUrl,
    widthPixels: canvas.width,
    heightPixels: canvas.height,
    pixelsPerFoot: pixelsPerFoot * ratio,
    opacity: 0.4,
  };
}

export function referenceLayout(
  blueprint: BlueprintReference,
): FloorPlanLayout {
  return {
    id: crypto.randomUUID(),
    walls: [],
    doors: [],
    windows: [],
    rooms: [],
    blueprint,
    dimensions: {
      width: blueprint.widthPixels / blueprint.pixelsPerFoot,
      height: blueprint.heightPixels / blueprint.pixelsPerFoot,
    },
    parameters: {
      bedrooms: 0,
      bathrooms: 0,
      floors: 1,
      totalArea: 0,
      style: "open-plan",
      features: ["Calibrated manual trace"],
    },
    efficiency: 0,
    naturalLight: 0,
    generatedAt: new Date().toISOString(),
  };
}
