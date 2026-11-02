"use client";
import { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { Eye, EyeOff, Trash2, ChevronDown } from "lucide-react";

export default function StoreySelector() {
  const storeys = useEditorStore(s => s.storeys);
  const activeId = useEditorStore(s => s.activeStoreyId);
  const [expanded, setExpanded] = useState(false);
  const active = storeys.find(s => s.id === activeId);
  const actions = useEditorStore.getState();
  return <div className="floor-selector">
    <button type="button" className="floor-selector-trigger" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
      <span>{active?.name || "No floors yet"}</span><ChevronDown size={15} />
    </button>
    {expanded && <div className="floor-selector-list" aria-label="Building floors">
      {[...storeys].sort((a,b) => b.elevation - a.elevation).map(level => <div className="floor-selector-row" key={level.id}>
        <button type="button" aria-pressed={level.id === activeId} onClick={() => actions.setActiveStoreyId(level.id)}>
          <strong>{level.name}</strong><small>{level.elevation.toFixed(1)} ft elevation</small>
        </button>
        <button type="button" aria-label={`${level.isVisible === false ? "Show" : "Hide"} ${level.name} in 3D`} onClick={() => actions.toggleStoreyVisibility(level.id)}>
          {level.isVisible === false ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button type="button" aria-label={`Delete ${level.name}`} disabled={storeys.length <= 1} onClick={() => actions.removeStorey(level.id)}><Trash2 size={15} /></button>
      </div>)}
      <div className="floor-selector-actions">
        <button type="button" onClick={() => actions.addStorey()}>New floor</button>
        <button type="button" disabled={!active} onClick={() => actions.duplicateActiveStorey()}>Copy floor plan</button>
      </div>
      <p>Copy floor plan copies walls and openings. Furniture stays on its original floor.</p>
    </div>}
  </div>;
}
