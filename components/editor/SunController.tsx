"use client";
import { useEditorStore } from "@/store/useEditorStore";
export default function SunController() {
  const time = useEditorStore((s) => s.sunTime),
    setTime = useEditorStore((s) => s.setSunTime);
  const [h, m] = time.split(":").map(Number),
    minutes = (h ?? 12) * 60 + (m ?? 0);
  return (
    <div className="editor-sun-controls">
      <label htmlFor="sun-preview-time">
        Time of day <output>{time}</output>
      </label>
      <input
        id="sun-preview-time"
        type="range"
        min={0}
        max={1439}
        value={minutes}
        onChange={(e) => {
          const value = Number(e.target.value);
          setTime(
            `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`,
          );
        }}
      />
      <div>
        {[
          ["Morning", "08:00"],
          ["Noon", "12:00"],
          ["Evening", "18:00"],
          ["Night", "00:00"],
        ].map(([label, value]) => (
          <button
            key={value}
            type="button"
            aria-pressed={time === value}
            onClick={() => setTime(value!)}
          >
            {label}
          </button>
        ))}
      </div>
      <p>Lighting preview only. This is not a measured daylight study.</p>
    </div>
  );
}
