"use client";

import React, { useState } from "react";
import {
  Palette,
  Sparkles,
  Info,
  Loader2,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import EditorCanvas from "@/components/editor/EditorCanvas";

export default function MaterialLabPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mappedMaterial, setMappedMaterial] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setMappedMaterial(prompt);
      setPrompt("");
    }, 2000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-darkSurface select-none">
      {/* Parameter inputs */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Palette size={18} className="text-gold" />
              <span>Material Lab</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Render dynamic seamless PBR shader textures onto meshes.
            </p>
          </div>
        </div>

        {/* Input prompt */}
        <div className="space-y-3 flex-1">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Texture Prompt (TRELLIS v2)
          </label>
          <textarea
            rows={4}
            placeholder="e.g. brushed brass metal panels, industrial style, scratch mapping, fine details..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-alabaster border border-hairline rounded-xl text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-12 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating PBR Textures...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Material</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Primary Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Floating toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-darkSurface/90 border border-hairlineDark text-onDark rounded-full text-xs font-bold shadow-hero select-none">
              PBR Texture Previewer
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-darkSurface/90 border border-hairlineDark text-teal rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>WebGL Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          <EditorCanvas cameraMode="perspective" showGrid={true}>
            {/* Displaying sphere mapping standard shaders */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
              <sphereGeometry args={[1.5, 64, 64]} />
              <meshStandardMaterial
                color={mappedMaterial ? "#CCCCCC" : "#B38F4D"}
                roughness={mappedMaterial ? 0.3 : 0.6}
                metalness={mappedMaterial ? 0.8 : 0.2}
              />
            </mesh>

            {/* Flat floor layout plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
            </mesh>
          </EditorCanvas>
        </div>
      </main>

      {/* Right Sidebar statistics info */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-gold" />
            <span>Material Outputs</span>
          </h3>
        </div>

        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Active Material Node
          </h4>

          {mappedMaterial ? (
            <div className="space-y-3">
              <div className="p-4 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal">
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Shader Name</span>
                  <span className="font-bold truncate max-w-[120px]">{mappedMaterial}</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Target Mesh Width</span>
                  <span className="font-mono font-bold">1.5 meters</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Calculated Roughness</span>
                  <span className="font-mono font-bold">0.3</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span>Mapped Maps</span>
                  <span className="font-mono font-bold">Diff, Norm, Rough</span>
                </div>
              </div>

              <div className="bg-successLight border border-success/10 text-success rounded-xl p-3 flex items-center gap-2 text-[10px] font-body">
                <CheckCircle size={14} className="shrink-0 animate-bounce" />
                <span className="font-bold uppercase tracking-wider">
                  Shader maps active in canvas
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline text-stone rounded-xl text-center">
              <p className="font-body text-[10px] leading-relaxed">
                Generate material maps using text prompts to render PBR details.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-hairline pt-4 flex flex-col gap-2.5 mt-auto">
          <button
            onClick={() => alert("Shader maps applied to active scene materials.")}
            disabled={!mappedMaterial}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors"
          >
            <span>Apply To Selected Object</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
