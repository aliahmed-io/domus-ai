"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Upload,
  Layers,
  CheckCircle,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import BlueprintCalibration from "@/components/editor/BlueprintCalibration";
import {
  calibrateBlueprint,
  embedBlueprint,
  referenceLayout,
} from "@/lib/blueprint-reference";
import EditorCanvas from "@/components/editor/EditorCanvas";
import { useEditorStore } from "@/store/useEditorStore";
import {
  vectorizeBlueprintImage,
  type VectorizerResult,
} from "@/lib/blueprint-vectorizer";
import { feetToMeters } from "@/lib/utils";
import { useIsClient } from "@/lib/useIsClient";
import { toast } from "sonner";
import type { FloorPlanLayout, ApiResult } from "@/types/puter";

export default function BimLiftPage() {
  const router = useRouter();
  const mounted = useIsClient();

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [wallHeight, setWallHeight] = useState(9); // feet
  const [calibrationFeet, setCalibrationFeet] = useState(24); // Known length between two selected image points
  const [calibration, setCalibration] =
    useState<ReturnType<typeof calibrateBlueprint>>(null);
  const [vectorResult, setVectorResult] = useState<VectorizerResult | null>(
    null,
  );

  useEffect(
    () => () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelected(files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type) ||
      selectedFile.size > 10 * 1024 * 1024
    ) {
      toast.error(
        "Use PNG, JPEG, or WebP up to 10 MB. Export PDF pages as images first.",
      );
      return;
    }
    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreview(previewUrl);
    setVectorResult(null);
    setCalibration(null);
  };

  // 1. Algorithmic Vectorization (Fast, deterministic, client-side, $0 cost)
  const handleAlgorithmicLift = async () => {
    if (!imagePreview || !calibration) return;
    setIsProcessing(true);
    setProcessingStatus("Running Otsu thresholding & wall graph clustering...");
    toast.loading("Analyzing blueprint lines with CV vectorizer...", {
      id: "bim-lift",
    });

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not read this image."));
        img.src = imagePreview;
      });

      if (img.naturalWidth > 4000 || img.naturalHeight > 4000)
        throw new Error("Resize the image to 4000 pixels per side or less.");
      const result = await vectorizeBlueprintImage(img, {
        calibrationFeet,
        calibrationPixels: calibration.distancePixels,
        wallHeightFeet: wallHeight,
      });

      setVectorResult(result);

      toast.success(
        `Algorithmic Extrusion Complete: ${result.wallCount} walls, ${result.roomCount} rooms (review the suggested openings)`,
        { id: "bim-lift" },
      );
    } catch (err) {
      console.error("Vectorization error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not trace this image. Try the sample or a clean line drawing.",
        { id: "bim-lift" },
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Vision AI Semantic Fallback (GPT-4o Vision for complex/messy sketches)
  const handleAiEnhanceLift = async () => {
    if (!file || !imagePreview || !calibration) return;
    setIsProcessing(true);
    setProcessingStatus("Trying optional AI blueprint analysis...");
    toast.loading("Parsing complex blueprint with AI Vision...", {
      id: "bim-lift",
    });

    try {
      const formData = new FormData();
      const reference = await embedBlueprint(
        imagePreview,
        calibration.pixelsPerFoot,
      );
      const imageBlob = await (await fetch(reference.imageDataUrl)).blob();
      formData.append("file", imageBlob, "calibrated-blueprint.png");
      formData.append("width", String(reference.widthPixels));
      formData.append("height", String(reference.heightPixels));
      formData.append("pixelsPerFoot", String(reference.pixelsPerFoot));
      formData.append("wallHeight", String(wallHeight));

      const res = await fetch("/api/bim-analysis", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as ApiResult<FloorPlanLayout>;
      if (!res.ok || !json.ok) {
        throw new Error(!json.ok ? json.error : "AI blueprint parsing failed.");
      }
      if (!json.data) {
        throw new Error("AI blueprint parsing returned empty data.");
      }

      const layout = json.data;
      const totalArea = layout.rooms.reduce((acc, r) => acc + (r.area || 0), 0);
      const aiResult: VectorizerResult = {
        layout,
        confidence: 0,
        needsAiEnhancement: false,
        wallCount: layout.walls.length,
        roomCount: layout.rooms.length,
        totalAreaSqFt: totalArea,
      };

      setVectorResult(aiResult);

      toast.success(
        `AI Blueprint Lift Complete: ${layout.walls.length} walls, ${layout.rooms.length} rooms mapped!`,
        { id: "bim-lift" },
      );
    } catch (err) {
      console.error("AI Lift error:", err);
      toast.error(
        err instanceof Error ? err.message : "AI processing failed.",
        { id: "bim-lift" },
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInStudio = () => {
    if (!vectorResult) return;
    useEditorStore
      .getState()
      .loadProjectData(vectorResult.layout, [], "manual");
    router.push("/floor-plan");
  };

  const currentLayout = vectorResult?.layout;

  return (
    <div className="tool-studio flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-dark-surface select-none">
      {/* Parameter inputs (Left sidebar, 340px) */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-teal" />
              <span>BIM Extruder Studio</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Extract 3D digital twins from flat blueprint sketches.
            </p>
          </div>
        </div>

        {/* File Drag and Drop */}
        <div className="space-y-3">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Select Blueprint Sketch
          </label>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-hairline hover:border-indigo/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-alabaster/40 cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-hairline flex items-center justify-center text-stone">
                <Upload size={18} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold text-charcoal">
                  Drag blueprint here
                </p>
                <p className="font-body text-[10px] text-stone mt-0.5">
                  PNG, JPEG, or WebP, up to 10 MB
                </p>
              </div>
              <label className="btn-secondary text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 bg-white border border-hairline rounded-lg cursor-pointer hover:bg-gray-50">
                Browse Files
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-alabaster border border-hairline rounded-xl flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-jakarta text-xs font-bold text-charcoal truncate">
                    {file.name}
                  </h4>
                  <p className="font-body text-[10px] text-stone">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImagePreview(null);
                    setVectorResult(null);
                  }}
                  className="text-[10px] font-bold text-stone hover:text-error transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {imagePreview && (
                <div className="relative w-full h-28 rounded-xl border border-hairline overflow-hidden bg-alabaster">
                  <Image
                    src={imagePreview}
                    alt="Blueprint Preview"
                    fill
                    className="object-contain p-1.5"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="studio-outline-button"
          onClick={async () => {
            setImagePreview("/demo-blueprint.svg");
            setCalibrationFeet(24);
            setVectorResult(null);
            try {
              const response = await fetch("/demo-blueprint.svg", {
                signal: AbortSignal.timeout(10000),
              });
              if (!response.ok)
                throw new Error("Could not load the sample blueprint.");
              const blob = await response.blob();
              setFile(
                new File([blob], "demo-blueprint.svg", {
                  type: "image/svg+xml",
                }),
              );
            } catch {
              toast.error(
                "Could not load the sample image. Try uploading a clean PNG instead.",
              );
            }
          }}
        >
          Try a sample blueprint
        </button>
        <p className="text-xs text-stone leading-relaxed">
          Tracing works best with clean line drawings. Check the walls, then add
          doors, windows, and room names yourself.
        </p>
        {imagePreview && (
          <BlueprintCalibration
            key={imagePreview}
            src={imagePreview}
            lengthFeet={calibrationFeet}
            onLengthChange={setCalibrationFeet}
            onChange={setCalibration}
          />
        )}
        <button
          type="button"
          className="studio-outline-button"
          disabled={!imagePreview || !calibration || isProcessing}
          onClick={async () => {
            if (!imagePreview || !calibration) return;
            setIsProcessing(true);
            try {
              const blueprint = await embedBlueprint(
                imagePreview,
                calibration.pixelsPerFoot,
              );
              const layout = referenceLayout(blueprint);
              useEditorStore.getState().loadProjectData(layout, [], "manual");
              router.push("/floor-plan");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not open the tracing reference.",
              );
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          Trace this image in the editor
        </button>

        {/* Wall Height parameter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
              Extrusion Height
            </span>
            <span className="font-body text-xs font-bold text-teal">
              {wallHeight} ft
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={14}
            aria-label="Wall height in feet"
            value={wallHeight}
            onChange={(e) => setWallHeight(Number(e.target.value))}
            className="w-full h-1.5 bg-teal-light rounded-lg appearance-none cursor-pointer accent-teal"
          />
        </div>

        {/* Processing Actions */}
        <div className="space-y-2.5 mt-auto">
          {/* 1. Algorithmic Button */}
          <button
            type="button"
            onClick={handleAlgorithmicLift}
            disabled={!imagePreview || !calibration || isProcessing}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-button transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{processingStatus || "Vectorizing..."}</span>
              </>
            ) : (
              <>
                <span>Algorithmic Vectorize (Instant)</span>
              </>
            )}
          </button>

          {/* 2. AI Fallback Button */}
          <button
            type="button"
            onClick={handleAiEnhanceLift}
            disabled={!file || !calibration || isProcessing}
            className="w-full h-9 bg-white border border-hairline hover:bg-gray-50 text-charcoal text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>Enhance with Vision AI</span>
          </button>
        </div>
      </aside>

      {/* Primary CAD Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Viewport Floating Header */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark rounded-full text-xs font-bold shadow-hero select-none flex items-center gap-1.5">
              <span>BIM Extruder Viewport</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark-muted rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>WebGL Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          {!vectorResult ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] gap-4">
              <div className="w-16 h-16 rounded-2xl border border-[#ffffff]/10 bg-[#161622] flex items-center justify-center text-teal shadow-hero">
                <Layers size={28} />
              </div>
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-white">
                  WebGL Viewport Ready
                </h3>
                <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Upload a blueprint sketch on the left and click
                  &ldquo;Algorithmic Vectorize&rdquo; to build your 3D digital
                  twin.
                </p>
              </div>
            </div>
          ) : mounted ? (
            <EditorCanvas cameraMode="perspective" showGrid={true}>
              {/* Render actual mathematically extruded walls from vectorizer */}
              {currentLayout?.walls.map((w) => {
                const dx = feetToMeters(w.end.x - w.start.x);
                const dz = feetToMeters(w.end.y - w.start.y);
                const len = Math.hypot(dx, dz);
                const midX = feetToMeters((w.start.x + w.end.x) / 2);
                const midZ = feetToMeters((w.start.y + w.end.y) / 2);
                const angle = -Math.atan2(dz, dx);
                const hMeters = feetToMeters(w.height || wallHeight);
                const thickM = (w.thickness || 6) * 0.0254;

                return (
                  <mesh
                    key={w.id}
                    position={[midX, hMeters / 2, midZ]}
                    rotation={[0, angle, 0]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[len, hMeters, thickM]} />
                    <meshStandardMaterial
                      color="#FAF8F5"
                      roughness={0.7}
                      metalness={0.05}
                    />
                  </mesh>
                );
              })}

              {/* Render Extruded Concrete Floor Slab */}
              {currentLayout?.rooms.map((r) => {
                const b = r.bounds;
                const wM = feetToMeters(b.width);
                const hM = feetToMeters(b.height);
                const xM = feetToMeters(b.x + b.width / 2);
                const zM = feetToMeters(b.y + b.height / 2);

                return (
                  <mesh
                    key={r.id}
                    position={[xM, -0.05, zM]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                  >
                    <planeGeometry args={[wM, hM]} />
                    <meshStandardMaterial
                      color="#2C2621"
                      roughness={0.4}
                      metalness={0.1}
                    />
                  </mesh>
                );
              })}

              {/* Infinite Ground */}
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.1, 0]}
                receiveShadow
              >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
              </mesh>
            </EditorCanvas>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone">
              <Loader2 size={32} className="animate-spin text-teal" />
            </div>
          )}
        </div>
      </main>

      {/* BIM stats (Right sidebar, 300px) */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-teal" />
            <span>Extrusion Output</span>
          </h3>
        </div>

        {/* BIM calculations */}
        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            BIM Material Estimation
          </h4>

          {vectorResult ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal">
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Extruded Wall Solids</span>
                  <span className="font-mono font-bold">
                    {vectorResult.wallCount} walls
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Detected Room Zones</span>
                  <span className="font-mono font-bold">
                    {vectorResult.roomCount} rooms
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Detected closed-room area</span>
                  <span className="font-mono font-bold">
                    {vectorResult.totalAreaSqFt} sq ft
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Wall Height Set</span>
                  <span className="font-mono font-bold">
                    {wallHeight} ft ({feetToMeters(wallHeight)}m)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span>Trace heuristic score</span>
                  <span className="font-mono font-bold text-success">
                    {vectorResult.confidence > 0
                      ? `${vectorResult.confidence}/100`
                      : "Not measured"}
                  </span>
                </div>
              </div>

              <div className="bg-successLight border border-success/10 text-success rounded-xl p-3 flex items-center gap-2 text-[10px] font-body">
                <CheckCircle size={14} className="shrink-0" />
                <span className="font-bold uppercase tracking-wider">
                  Review the trace before using it
                </span>
              </div>
            </div>
          ) : (
            <p className="font-body text-[10px] text-stone italic text-center p-4 bg-alabaster border border-hairline rounded-xl">
              Upload blueprint sketch to calculate parameters and extrude 3D
              model.
            </p>
          )}
        </div>

        {/* Open in CAD Studio Button */}
        {vectorResult && (
          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={handleOpenInStudio}
              className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-button transition-colors cursor-pointer"
            >
              <span>Open in 2D/3D CAD Studio</span>
              <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={handleAlgorithmicLift}
              className="w-full h-9 bg-white border border-hairline hover:bg-gray-50 text-stone hover:text-charcoal text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Recalculate Scale</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
