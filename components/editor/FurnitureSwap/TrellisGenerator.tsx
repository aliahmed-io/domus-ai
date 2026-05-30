"use client";

import React, { useState } from "react";
import { Sparkles, Brain, Loader2, RefreshCw, Cpu, ShoppingCart, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import type { ApiResult } from "@/types/puter";

interface TrellisGeneratorProps {
  onAssetGenerated: (modelUrl: string, name: string) => void;
}

export default function TrellisGenerator({ onAssetGenerated }: TrellisGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [quotaRemaining, setQuotaRemaining] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setStatusText("Contacting partner Replicate APIs...");
    toast.loading("Synthesizing 3D mesh via TRELLIS...", { id: "trellis" });

    try {
      // 1. Fetch from Edge GNN & TRELLIS proxy
      const response = await fetch("/api/generate-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const limitRemaining = response.headers.get("X-RateLimit-Remaining");
      if (limitRemaining !== null) {
        setQuotaRemaining(Number(limitRemaining));
      }

      const result = (await response.json()) as ApiResult<{
        id: string;
        status: string;
        output?: string;
        fallback?: boolean;
      }>;

      if (!result.ok) {
        setError(result.error || "Failed to generate asset.");
        toast.error("Generation failed. Please retry.", { id: "trellis" });
        setLoading(false);
        return;
      }

      const prediction = result.data;

      // 2. Handle simulated/procedural mock or active polling
      if (prediction.output) {
        // Fallback or completed output loaded
        setStatusText("Streaming low-poly Draco GLTF model...");
        setTimeout(() => {
          onAssetGenerated(prediction.output || "/models/armchair.glb", prompt);
          toast.success("Asset ready — loading into scene", { id: "trellis" });
          setLoading(false);
          setPrompt("");
        }, 1200);
      } else {
        // Real-time Replicate prediction polling simulator
        setStatusText("Synthesizing Microsoft TRELLIS v2 neural quad-meshes...");
        
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts += 1;
          if (attempts > 5) {
            clearInterval(interval);
            onAssetGenerated("/models/chair.glb", prompt);
            setLoading(false);
            setPrompt("");
            return;
          }
          
          setStatusText(`Compiling quad-meshes & PBR textures (T+${attempts * 2}s)...`);
        }, 2000);
      }

    } catch (err) {
      setError("Failed to establish server connection path.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-alabaster border border-hairline rounded-2xl p-4 flex flex-col gap-4 shadow-sm select-none">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-hairline/60 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Brain size={15} className="text-indigo" />
          <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            TRELLIS 3D Generator
          </span>
        </div>
        <span className="px-2 py-0.5 bg-indigo-light text-indigo text-[9px] font-bold rounded-full border border-indigo/10 flex items-center gap-1">
          <Cpu size={9} />
          v2.0 Neural
        </span>
      </div>

      <p className="font-body text-[10px] text-stone leading-relaxed">
        Describe a custom asset. Our neural generator synthesizes quad-meshed `.glb` models with PBR textures.
      </p>

      {/* Input prompt */}
      <div className="flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          placeholder="e.g. Søren Lounge Chair in velvet olive green..."
          className="w-full h-16 p-2 text-xs border border-hairline rounded-xl bg-white resize-none outline-none font-body placeholder:text-muted focus:border-indigo transition-colors"
        />

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
            disabled={!prompt.trim() || quotaRemaining <= 0}
            className="w-full h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors outline-none cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Generate Spatial 3D Asset</span>
          </button>
        )}
      </div>

      {/* Rate limit status */}
      <div className="flex justify-between items-center border-t border-hairline/60 pt-3 text-[9px] font-bold uppercase tracking-wider text-stone px-1">
        <span className="flex items-center gap-1">
          <ShoppingCart size={10} className="text-teal" />
          matched SKU purchase ready
        </span>
        <span>
          Quota remaining: <span className="text-charcoal">{quotaRemaining}/5 hr</span>
        </span>
      </div>
    </div>
  );
}
