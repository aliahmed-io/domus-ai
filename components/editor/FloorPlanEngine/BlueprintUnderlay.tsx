"use client";
import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import { blueprintBounds } from "@/lib/blueprint-reference";
import type { BlueprintReference } from "@/types/puter";

export default function BlueprintUnderlay({
  reference,
}: {
  reference: BlueprintReference;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const loaded = new Image();
    let active = true;
    loaded.onload = () => {
      if (active) setImage(loaded);
    };
    loaded.src = reference.imageDataUrl;
    return () => {
      active = false;
      loaded.onload = null;
    };
  }, [reference.imageDataUrl]);
  if (!image) return null;
  const bounds = blueprintBounds(reference),
    scale = 0.3048 * 50;
  return (
    <KonvaImage
      name="blueprint-reference"
      image={image}
      x={bounds.x * scale}
      y={bounds.y * scale}
      width={bounds.width * scale}
      height={bounds.height * scale}
      opacity={reference.opacity}
      listening={false}
    />
  );
}
