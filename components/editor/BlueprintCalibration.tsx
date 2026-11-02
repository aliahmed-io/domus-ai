"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { calibrateBlueprint } from "@/lib/blueprint-reference";
import type { Vec2D } from "@/types/puter";

export default function BlueprintCalibration({
  src,
  lengthFeet,
  onLengthChange,
  onChange,
}: {
  src: string;
  lengthFeet: number;
  onLengthChange: (value: number) => void;
  onChange: (value: ReturnType<typeof calibrateBlueprint>) => void;
}) {
  const sample = src === "/demo-blueprint.svg";
  const [points, setPoints] = useState<Vec2D[]>(
    sample
      ? [
          { x: 80, y: 70 },
          { x: 560, y: 70 },
        ]
      : [],
  );
  const [size, setSize] = useState({ width: 640, height: 480 });
  useEffect(() => {
    onChange(
      points.length === 2
        ? calibrateBlueprint(points[0]!, points[1]!, lengthFeet)
        : null,
    );
  }, [points, lengthFeet, onChange]);
  return (
    <section className="blueprint-calibration">
      <h3>Set the drawing scale</h3>
      <p>
        Mark both ends of a line with a known length, then enter that length in
        feet. Image borders do not affect the measurement.
      </p>
      <button
        type="button"
        aria-label="Mark two calibration points"
        className="calibration-image"
        style={{ aspectRatio: `${size.width}/${size.height}` }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const point = {
            x: ((event.clientX - rect.left) / rect.width) * size.width,
            y: ((event.clientY - rect.top) / rect.height) * size.height,
          };
          setPoints((previous) =>
            previous.length === 2 ? [point] : [...previous, point],
          );
        }}
      >
        <Image
          src={src}
          alt="Blueprint scale reference"
          fill
          unoptimized
          sizes="340px"
          onLoad={(event) =>
            setSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
        />
        <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
          {points.length === 2 && (
            <line
              x1={points[0]!.x}
              y1={points[0]!.y}
              x2={points[1]!.x}
              y2={points[1]!.y}
              stroke="#3157d5"
              strokeWidth="5"
            />
          )}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="9"
              fill="#3157d5"
              stroke="white"
              strokeWidth="3"
            />
          ))}
        </svg>
      </button>
      <label htmlFor="reference-length">Known line length (feet)</label>
      <input
        id="reference-length"
        type="number"
        min="0.01"
        step="0.1"
        value={lengthFeet}
        onChange={(event) => onLengthChange(Number(event.target.value))}
      />
      <details>
        <summary>Enter pixel coordinates instead</summary>
        {[0, 1].map((index) => (
          <div key={index} className="calibration-coordinates">
            {(["x", "y"] as const).map((axis) => (
              <label key={axis}>
                Point {index + 1} {axis}
                <input
                  type="number"
                  min="0"
                  max={axis === "x" ? size.width : size.height}
                  value={points[index]?.[axis] ?? ""}
                  onChange={(event) => {
                    const next = [
                      points[0] ?? { x: 0, y: 0 },
                      points[1] ?? { x: size.width, y: 0 },
                    ];
                    next[index] = {
                      ...next[index]!,
                      [axis]: Number(event.target.value),
                    };
                    setPoints(next);
                  }}
                />
              </label>
            ))}
          </div>
        ))}
      </details>
      <span role="status">
        {points.length === 2 &&
        calibrateBlueprint(points[0]!, points[1]!, lengthFeet)
          ? "Scale ready. Trace manually or try automatic wall detection."
          : "Choose two different points and a positive length."}
      </span>
    </section>
  );
}
