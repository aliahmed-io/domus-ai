"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Loader2, Image as ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useModelRequest } from "@/lib/use-model-request";

interface TrellisGeneratorProps {
  onAssetGenerated: (modelUrl: string, name: string) => void;
}

export default function TrellisGenerator({
  onAssetGenerated,
}: TrellisGeneratorProps) {
  const findModel = useModelRequest();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [prompt, setPrompt] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [catalogMode, setCatalogMode] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const handleImageFile = (file: File) => {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      toast.error("Use PNG, JPG, or WebP, up to 10 MB.");
      return;
    }
    setImageName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (mode === "text" && !prompt.trim()) return;
    if (mode === "image" && !imagePreview) return;

    setLoading(true);
    setError(null);
    setStatusText("Finding a model…");
    try {
      const result = await findModel(
        {
          prompt: prompt.trim() || imageName || "Furniture model",
          image: mode === "image" ? (imagePreview ?? undefined) : undefined,
        },
        setStatusText,
      );
      setCatalogMode(result.fallback);
      const label = prompt.trim() || imageName || "Furniture model";
      onAssetGenerated(
        result.output,
        result.fallback ? `Catalog sample: ${label}` : label,
      );
      toast.success(
        result.fallback
          ? "Catalog sample added. No original model was generated."
          : "Generated model added.",
      );
      setPrompt("");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setError(
          error instanceof Error ? error.message : "No model was added.",
        );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-alabaster border border-hairline rounded-2xl p-4 flex flex-col gap-4 shadow-sm select-none">
      <p className="text-xs text-stone leading-relaxed">
        Try chair, sofa, table, lamp, or plant. Without an AI provider, you get
        a catalog sample. Sample mode does not reconstruct photos.
      </p>
      {/* Title */}
      <div className="flex justify-between items-center border-b border-hairline/60 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Furniture models
          </span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-white rounded-xl p-1 border border-hairline gap-1">
        <button
          type="button"
          onClick={() => setMode("image")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === "image"
              ? "bg-indigo-light text-indigo shadow-xs"
              : "text-stone hover:text-charcoal"
          }`}
        >
          <ImageIcon size={12} />
          <span>Photo to 3D</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === "text"
              ? "bg-indigo-light text-indigo shadow-xs"
              : "text-stone hover:text-charcoal"
          }`}
        >
          <span>Search catalog</span>
        </button>
      </div>

      {/* Input area */}
      <div className="flex flex-col gap-2.5">
        {mode === "image" ? (
          <div>
            {!imagePreview ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFile(file);
                }}
                className="w-full h-24 border-2 border-dashed border-hairline hover:border-indigo/40 rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors p-3 text-center"
              >
                <Upload size={16} className="text-indigo" />
                <span className="text-[10px] font-bold text-charcoal">
                  Drop photo of furniture here
                </span>
                <span className="text-[8px] text-stone">
                  PNG, JPG, WebP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative w-full h-24 rounded-xl border border-hairline overflow-hidden bg-white flex items-center justify-center group">
                <Image
                  src={imagePreview}
                  alt="Furniture reference"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageName("");
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-charcoal/80 text-white flex items-center justify-center hover:bg-charcoal transition-colors shadow-sm cursor-pointer"
                  title="Remove photo"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <textarea
            aria-label="Furniture model description"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="e.g. Søren Lounge Chair in velvet olive green..."
            className="w-full h-16 p-2 text-xs border border-hairline rounded-xl bg-white resize-none outline-none font-body placeholder:text-muted focus:border-indigo transition-colors"
          />
        )}

        {error && (
          <span className="text-[9px] font-bold text-error leading-tight px-1 uppercase tracking-wide">
            {error}
          </span>
        )}

        {loading ? (
          <div className="flex flex-col gap-2 p-3 bg-white border border-hairline rounded-xl items-center text-center">
            <Loader2 className="w-5 h-5 text-indigo animate-spin" />
            <span className="font-body text-[10px] text-stone font-bold uppercase tracking-wider animate-pulse">
              {statusText}
            </span>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={
              (mode === "text" && !prompt.trim()) ||
              (mode === "image" && !imagePreview)
            }
            className="w-full h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors outline-none cursor-pointer"
          >
            <span>
              {mode === "image"
                ? "Find or generate model"
                : "Find or generate model"}
            </span>
          </button>
        )}
      </div>

      {/* Rate limit status */}
      <div className="flex justify-between items-center border-t border-hairline/60 pt-3 text-[9px] font-bold uppercase tracking-wider text-stone px-1">
        <span className="flex items-center gap-1">
          Catalog or optional AI model
        </span>
        <span>
          Model source:{" "}
          <span className="text-charcoal">
            {loading ? "Processing request" : catalogMode ? "Built-in catalog" : "AI provider"}
          </span>
        </span>
      </div>
    </div>
  );
}
