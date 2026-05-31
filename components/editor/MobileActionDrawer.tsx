import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Cuboid, LayoutGrid, Armchair, Home } from "lucide-react";
import { toast } from "sonner";
import { furnishRooms } from "@/lib/geometry-solver";

export default function MobileActionDrawer() {
  const { setGenerating, setFloorPlan, toggleRoof, showRoof, floorPlanLayout, addSceneObject } = useEditorStore(
    useShallow((s) => ({
      setGenerating: s.setGenerating,
      setFloorPlan: s.setFloorPlan,
      toggleRoof: s.toggleRoof,
      showRoof: s.showRoof,
      floorPlanLayout: s.floorPlanLayout,
      addSceneObject: s.addSceneObject,
    }))
  );

  const handleQuickGenerate = async () => {
    toast.loading("Generating quick layout...", { id: "mob-gen" });
    try {
      const response = await fetch("/api/floor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beds: 2, baths: 1, area: 1200, style: "modern" }),
      });
      const result = await response.json();
      if (result.ok && result.data[0]) {
        toast.success("Done!", { id: "mob-gen" });
        setFloorPlan(result.data[0]);
      } else {
        toast.error("Failed", { id: "mob-gen" });
      }
    } catch (err) {
      toast.error("Error", { id: "mob-gen" });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-hairline p-4 pb-8 z-50 rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
      
      <div className="grid grid-cols-4 gap-2">
        <button 
          onClick={handleQuickGenerate}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-indigo-light/30 text-indigo hover:bg-indigo-light transition-colors"
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold tracking-wide">Generate</span>
        </button>

        <button 
          onClick={toggleRoof}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${showRoof ? "bg-stone-800 text-white" : "bg-gray-100 text-stone"}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold tracking-wide">Roof</span>
        </button>

        <button 
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-100 text-stone opacity-50 cursor-not-allowed"
          onClick={() => toast("AR mode coming soon to mobile WebXR")}
        >
          <Cuboid size={24} />
          <span className="text-[10px] font-bold tracking-wide">AR View</span>
        </button>

        <button 
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-100 text-stone"
          onClick={() => {
            if (!floorPlanLayout) {
              toast.error("Generate a layout first");
              return;
            }
            toast.success("Furnishing room...");
            const furnishings = furnishRooms(floorPlanLayout.rooms);
            furnishings.forEach(f => addSceneObject(f));
          }}
        >
          <Armchair size={24} />
          <span className="text-[10px] font-bold tracking-wide">Furnish</span>
        </button>
      </div>
    </div>
  );
}
