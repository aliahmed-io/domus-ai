import type { Wall, FloorPlanLayout } from "@/types/puter";
import { detectAllRooms } from "@/lib/room-detection";
import { snapCloseWallEndpoints } from "@/lib/snap";

export interface VectorizerOptions {
  /** Known real-world length in feet between two calibration points */
  calibrationFeet?: number;
  /** Pixel distance between two calibration points */
  calibrationPixels?: number;
  /** Default wall thickness in inches (standard interior 5", exterior 8") */
  wallThicknessInches?: number;
  /** Default wall height in feet */
  wallHeightFeet?: number;
}

export interface VectorizerResult {
  layout: FloorPlanLayout;
  confidence: number; // 0 to 100
  needsAiEnhancement: boolean;
  wallCount: number;
  roomCount: number;
  totalAreaSqFt: number;
}

/**
 * Deterministic Algorithmic Blueprint Vectorizer
 * Analyzes blueprint raster images using client-side canvas pixel analysis,
 * extracting mathematical 2D wall vectors, room boundaries, and scale metrics.
 */
export async function vectorizeBlueprintImage(
  imageSource: HTMLImageElement | ImageData | HTMLCanvasElement,
  options: VectorizerOptions = {},
): Promise<VectorizerResult> {
  const wallThickness = options.wallThicknessInches || 6;
  const wallHeight = options.wallHeightFeet || 9;

  let width = 0;
  let height = 0;
  let imgData:
    | ImageData
    | { width: number; height: number; data: Uint8ClampedArray };

  const isRawImageData =
    (typeof ImageData !== "undefined" && imageSource instanceof ImageData) ||
    (imageSource &&
      typeof (imageSource as ImageData).width === "number" &&
      typeof (imageSource as ImageData).height === "number" &&
      (imageSource as ImageData).data &&
      "length" in (imageSource as ImageData).data);

  if (isRawImageData) {
    const raw = imageSource as ImageData;
    imgData = raw;
    width = raw.width;
    height = raw.height;
  } else {
    const canvas = document.createElement("canvas");
    const source = imageSource as CanvasImageSource;
    width = (imageSource as HTMLImageElement | HTMLCanvasElement).width || 800;
    height =
      (imageSource as HTMLImageElement | HTMLCanvasElement).height || 600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable for vectorizer.");
    }
    ctx.drawImage(source, 0, 0, width, height);
    imgData = ctx.getImageData(0, 0, width, height);
  }

  // 1. Calculate Otsu Binarization Threshold
  const grayPixels = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 255;
    const g = data[i + 1] ?? 255;
    const b = data[i + 2] ?? 255;
    // Standard photometric luminance
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const pixelIdx = i / 4;
    grayPixels[pixelIdx] = luma;
    histogram[luma] = (histogram[luma] ?? 0) + 1;
  }

  // Otsu's method for optimal separation of ink from paper
  const totalPixels = width * height;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * (histogram[t] ?? 0);
  }

  let sumB = 0;
  let wB = 0;
  let varMax = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t] ?? 0;
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * (histogram[t] ?? 0);
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  // 2. Detect blueprint polarity (white paper with dark ink vs dark blueprint with white lines)
  let borderSum = 0;
  let borderSamples = 0;
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
    borderSum +=
      (grayPixels[x] ?? 255) + (grayPixels[(height - 1) * width + x] ?? 255);
    borderSamples += 2;
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    borderSum +=
      (grayPixels[y * width] ?? 255) +
      (grayPixels[y * width + (width - 1)] ?? 255);
    borderSamples += 2;
  }
  const avgBorderLuma = borderSamples > 0 ? borderSum / borderSamples : 255;
  const isInverted = avgBorderLuma < 110; // Dark blueprint background

  // Walls appear as continuous lines distinct from the canvas background
  const isWallPixel = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const luma = grayPixels[y * width + x] ?? 255;
    return isInverted ? luma > threshold : luma <= threshold;
  };

  // Sample grid intervals (every 8-12px for high performance and noise tolerance)
  const step = Math.max(8, Math.floor(Math.min(width, height) / 80));
  const rawHorizontalSegments: { y: number; startX: number; endX: number }[] =
    [];
  const rawVerticalSegments: { x: number; startY: number; endY: number }[] = [];

  // Scan horizontal lines
  for (let y = step; y < height - step; y += step) {
    let inWall = false;
    let startX = 0;
    for (let x = 0; x < width; x++) {
      const dark = isWallPixel(x, y);
      if (dark && !inWall) {
        inWall = true;
        startX = x;
      } else if (!dark && inWall) {
        inWall = false;
        if (x - startX > step * 3) {
          rawHorizontalSegments.push({ y, startX, endX: x });
        }
      }
    }
    if (inWall && width - startX > step * 3) {
      rawHorizontalSegments.push({ y, startX, endX: width });
    }
  }

  // Scan vertical lines
  for (let x = step; x < width - step; x += step) {
    let inWall = false;
    let startY = 0;
    for (let y = 0; y < height; y++) {
      const dark = isWallPixel(x, y);
      if (dark && !inWall) {
        inWall = true;
        startY = y;
      } else if (!dark && inWall) {
        inWall = false;
        if (y - startY > step * 3) {
          rawVerticalSegments.push({ x, startY, endY: y });
        }
      }
    }
    if (inWall && height - startY > step * 3) {
      rawVerticalSegments.push({ x, startY, endY: height });
    }
  }

  // Scale must come from a measured reference, never an assumed building size.
  const { calibrationPixels, calibrationFeet } = options;
  if (!Number.isFinite(calibrationPixels) || !Number.isFinite(calibrationFeet) ||
      !calibrationPixels || !calibrationFeet || calibrationPixels <= 0 || calibrationFeet <= 0) {
    throw new Error("Set two calibration points and their known length before tracing.");
  }
  const pixelsPerFoot = calibrationPixels / calibrationFeet;

  // 4. Cluster parallel segments into unified walls
  const clusteredWalls: Wall[] = [];
  const minLengthFeet = 3.5;

  // Cluster horizontal wall centerlines
  const hBins: { y: number; count: number; startX: number; endX: number }[] =
    [];
  for (const seg of rawHorizontalSegments) {
    const existing = hBins.find((b) => Math.abs(b.y - seg.y) < step * 2);
    if (existing) {
      existing.y = (existing.y * existing.count + seg.y) / (existing.count + 1);
      existing.startX = Math.min(existing.startX, seg.startX);
      existing.endX = Math.max(existing.endX, seg.endX);
      existing.count += 1;
    } else {
      hBins.push({ y: seg.y, count: 1, startX: seg.startX, endX: seg.endX });
    }
  }

  // Cluster vertical wall centerlines
  const vBins: { x: number; count: number; startY: number; endY: number }[] =
    [];
  for (const seg of rawVerticalSegments) {
    const existing = vBins.find((b) => Math.abs(b.x - seg.x) < step * 2);
    if (existing) {
      existing.x = (existing.x * existing.count + seg.x) / (existing.count + 1);
      existing.startY = Math.min(existing.startY, seg.startY);
      existing.endY = Math.max(existing.endY, seg.endY);
      existing.count += 1;
    } else {
      vBins.push({ x: seg.x, count: 1, startY: seg.startY, endY: seg.endY });
    }
  }

  // Convert bins into normalized CAD coordinates (origin centered at 0, 0)
  const centerX = width / 2;
  const centerY = height / 2;

  let wallIdCounter = 1;
  for (const h of hBins) {
    const lenFeet = (h.endX - h.startX) / pixelsPerFoot;
    if (lenFeet >= minLengthFeet) {
      clusteredWalls.push({
        id: `wall-h-${wallIdCounter++}`,
        start: {
          x: Math.round(((h.startX - centerX) / pixelsPerFoot) * 10) / 10,
          y: Math.round(((h.y - centerY) / pixelsPerFoot) * 10) / 10,
        },
        end: {
          x: Math.round(((h.endX - centerX) / pixelsPerFoot) * 10) / 10,
          y: Math.round(((h.y - centerY) / pixelsPerFoot) * 10) / 10,
        },
        thickness: wallThickness,
        height: wallHeight,
        isLoadBearing: true,
      });
    }
  }

  for (const v of vBins) {
    const lenFeet = (v.endY - v.startY) / pixelsPerFoot;
    if (lenFeet >= minLengthFeet) {
      clusteredWalls.push({
        id: `wall-v-${wallIdCounter++}`,
        start: {
          x: Math.round(((v.x - centerX) / pixelsPerFoot) * 10) / 10,
          y: Math.round(((v.startY - centerY) / pixelsPerFoot) * 10) / 10,
        },
        end: {
          x: Math.round(((v.x - centerX) / pixelsPerFoot) * 10) / 10,
          y: Math.round(((v.endY - centerY) / pixelsPerFoot) * 10) / 10,
        },
        thickness: wallThickness,
        height: wallHeight,
        isLoadBearing: true,
      });
    }
  }

  // Do not invent a room when the uploaded image contains no usable wall network.
  if (clusteredWalls.length < 4)
    throw new Error(
      "No clear wall network found. Try the sample blueprint or a clean line drawing.",
    );
  const finalWalls: Wall[] = snapCloseWallEndpoints(clusteredWalls, 1.5);

  // 6. Compute Planar Graph Closed Rooms
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const w of finalWalls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  const spanW = Math.max(0.1, maxX - minX);
  const spanH = Math.max(0.1, maxY - minY);
  const rooms = detectAllRooms(finalWalls);
  const calculatedTotalArea = rooms.reduce((sum, room) => sum + room.area, 0);

  // Pixel runs do not identify opening symbols or room functions.
  // Leave these for the user instead of inventing architectural details.
  // Calculate Confidence Score: based on wall orthogonality, closure, and segment counts
  const confidence = Math.min(
    98,
    Math.max(55, Math.round(50 + finalWalls.length * 3 + rooms.length * 5)),
  );
  const needsAiEnhancement = confidence < 75;

  const layout: FloorPlanLayout = {
    id: `layout-vec-${Date.now()}`,
    rooms,
    walls: finalWalls,
    doors: [],
    windows: [],
    dimensions: { width: spanW, height: spanH },
    parameters: {
      bedrooms: rooms.filter((r) => r.type === "bedroom").length,
      bathrooms: rooms.filter((r) => r.type === "bathroom").length,
      totalArea: calculatedTotalArea,
      floors: 1,
      style: "open-plan",
      features: ["Vectorized Blueprint Twin"],
    },
    efficiency: 0,
    naturalLight: 0,
    generatedAt: new Date().toISOString(),
  };

  return {
    layout,
    confidence,
    needsAiEnhancement,
    wallCount: finalWalls.length,
    roomCount: rooms.length,
    totalAreaSqFt: calculatedTotalArea,
  };
}
