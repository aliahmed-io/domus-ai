"use client";
import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import PlanIllustration from "./PlanIllustration";

const finishes = [
  { name: "Natural oak", color: "#b99a74", image: "/oak_residence.png" },
  { name: "Soft linen", color: "#d9d4c7", image: "/cascade_penthouse.png" },
  { name: "City stone", color: "#899791", image: "/cascade_penthouse.png" },
];
export default function DesignBoard() {
  const [finish, setFinish] = useState(0);
  const selected = finishes[finish] ?? finishes[0]!;
  return (
    <div className="design-board">
      <div className="board-photo">
        <Image
          src={selected.image}
          alt={`${selected.name} interior inspiration`}
          fill
          sizes="(max-width: 750px) 90vw, 46vw"
          preload
        />
        <span className="photo-caption">
          A place to make your own
        </span>
      </div>
      <div className="board-plan">
        <div className="board-paper-heading">
          <span>The Sunday apartment</span>
          <span>Plan study</span>
        </div>
        <PlanIllustration />
        <div className="board-paper-foot">
          <span>Room to slow down.</span>
          <span>2 bedrooms</span>
        </div>
      </div>
      <div className="board-material">
        <span>Find your feeling</span>
        <div className="finish-options">
          {finishes.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setFinish(i)}
              aria-label={item.name}
              aria-pressed={finish === i}
              style={{ backgroundColor: item.color }}
            >
              {finish === i && <Check size={18} />}
            </button>
          ))}
        </div>
        <strong aria-live="polite">{selected.name}</strong>
        <small>Try a different palette</small>
      </div>

    </div>
  );
}
