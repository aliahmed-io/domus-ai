"use client";

import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonSliderProps {
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  beforeContent?: React.ReactNode;
  afterContent?: React.ReactNode;
}

export default function ComparisonSlider({
  beforeLabel = "BEFORE",
  afterLabel = "AFTER",
  className,
  beforeContent,
  afterContent,
}: ComparisonSliderProps) {
  // Value ranging from 0 to 100 representing percentage from left
  const [sliderVal, setSliderVal] = useState<number>(50);

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/9] max-h-[500px] border border-hairline rounded-2xl shadow-hero overflow-hidden bg-dark-surface select-none",
        className
      )}
    >
      {/* ── BEFORE CONTAINER ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-10">
        {beforeContent || (
          <div className="w-full h-full bg-gradient-to-br from-[#1e1e35] via-[#10101b] to-dark-surface flex items-center justify-center">
            {/* Mock wireframe blueprint grid */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <span className="font-jakarta text-xs font-bold text-[#A1A1AA] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              Blueprint Wireframe Scene
            </span>
          </div>
        )}
        {/* Label bottom left */}
        <span className="absolute bottom-5 left-5 z-30 px-2.5 py-1 bg-charcoal/80 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-white rounded-lg select-none">
          {beforeLabel}
        </span>
      </div>

      {/* ── AFTER CONTAINER (CLIPPED) ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 w-full h-full z-20 transition-all duration-75"
        style={{
          clipPath: `polygon(${sliderVal}% 0, 100% 0, 100% 100%, ${sliderVal}% 100%)`,
        }}
      >
        {afterContent || (
          <div className="w-full h-full bg-gradient-to-br from-indigo-light via-white to-alabaster flex items-center justify-center">
            {/* Mock fully rendered layout */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(#5B6AF0 1px, transparent 1px), linear-gradient(90deg, #5B6AF0 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <span className="font-jakarta text-xs font-bold text-indigo bg-indigo-light border border-indigo/15 px-3 py-1.5 rounded-lg shadow-sm">
              Extruded 3D Spatial Twin
            </span>
          </div>
        )}
        {/* Label bottom right */}
        <span className="absolute bottom-5 right-5 z-30 px-2.5 py-1 bg-indigo/90 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-white rounded-lg select-none">
          {afterLabel}
        </span>
      </div>

      {/* ── DRAGGABLE DIVIDER HANDLE ──────────────────────────────────────── */}
      <Slider.Root
        min={0}
        max={100}
        step={0.5}
        value={[sliderVal]}
        onValueChange={(val) => val[0] !== undefined && setSliderVal(val[0])}
        className="absolute inset-0 w-full h-full z-30 flex items-center select-none touch-none pointer-events-none"
      >
        {/* Hidden track slider */}
        <Slider.Track className="relative w-full h-full pointer-events-none">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/95 shadow-hero"
            style={{ left: `${sliderVal}%` }}
          />
        </Slider.Track>

        {/* Drag handle button */}
        <Slider.Thumb
          className="absolute block w-10 h-10 bg-white border border-hairline rounded-full shadow-modal pointer-events-auto cursor-col-resize focus:outline-none focus:ring-2 focus:ring-indigo/40 select-none"
          style={{
            left: `calc(${sliderVal}% - 20px)`,
            top: "calc(50% - 20px)",
          }}
          aria-label="Comparison divider slider"
        >
          <div className="w-full h-full flex items-center justify-center text-charcoal">
            <ArrowLeftRight size={16} />
          </div>
        </Slider.Thumb>
      </Slider.Root>
    </div>
  );
}
