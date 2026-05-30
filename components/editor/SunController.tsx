"use client";

import React from "react";
import { Sun, Moon, Sunrise, Sunset, Clock } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";

export default function SunController() {
  const { sunTime, setSunTime, sunAltitude, sunAzimuth } = useEditorStore(
    useShallow((s) => ({
      sunTime: s.sunTime,
      setSunTime: s.setSunTime,
      sunAltitude: s.sunAltitude,
      sunAzimuth: s.sunAzimuth,
    }))
  );

  const times = [
    { label: "Sunrise", value: "06:00", icon: Sunrise },
    { label: "Midday", value: "12:00", icon: Sun },
    { label: "Sunset", value: "18:00", icon: Sunset },
    { label: "Midnight", value: "24:00", icon: Moon },
  ];

  // Convert "HH:MM" to progress percentage for slider
  const [hStr, mStr] = sunTime.split(":");
  const currentMinutes = parseInt(hStr || "12", 10) * 60 + parseInt(mStr || "0", 10);
  const maxMinutes = 24 * 60;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value, 10);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const formattedTime = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    setSunTime(formattedTime);
  };

  return (
    <div className="bg-dark-surface/90 border border-hairline-dark backdrop-blur-md rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col gap-3 select-none pointer-events-auto w-64">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-hairline-dark pb-2">
        <span className="font-jakarta text-[10px] font-bold text-on-dark uppercase tracking-widest flex items-center gap-1.5">
          <Sun size={12} className="text-gold" />
          Solar Shadow Path
        </span>
        <span className="font-mono text-[10px] font-extrabold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20 flex items-center gap-1">
          <Clock size={9} />
          {sunTime}
        </span>
      </div>

      {/* Sliders for time selection */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max={maxMinutes - 1}
          value={currentMinutes}
          onChange={handleSliderChange}
          className="w-full h-1 bg-hairline-dark rounded-lg appearance-none cursor-pointer accent-gold"
        />
        <div className="flex justify-between text-[8px] font-bold text-stone uppercase tracking-wide px-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </div>

      {/* Solar Angle Data */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-stone border-t border-hairline-dark/40 pt-2">
        <div>
          Alt: <span className="text-on-dark font-bold">{sunAltitude}°</span>
        </div>
        <div>
          Azimuth: <span className="text-on-dark font-bold">{sunAzimuth}°</span>
        </div>
      </div>

      {/* Pre-mapped spatial presets */}
      <div className="grid grid-cols-4 gap-1.5 mt-1">
        {times.map((t) => {
          const Icon = t.icon;
          const isActive = sunTime === t.value || (t.value === "24:00" && sunTime === "00:00");
          return (
            <button
              key={t.value}
              onClick={() => setSunTime(t.value === "24:00" ? "00:00" : t.value)}
              className={`py-1 rounded flex flex-col items-center gap-1 text-[8px] font-bold uppercase tracking-wider transition-all border outline-none cursor-pointer ${
                isActive
                  ? "bg-gold/25 border-gold text-gold"
                  : "bg-dark-surface-alt border-hairline-dark text-stone hover:bg-gold/5 hover:text-gold"
              }`}
              title={t.label}
            >
              <Icon size={10} />
              <span>{t.label.substring(0, 4)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
