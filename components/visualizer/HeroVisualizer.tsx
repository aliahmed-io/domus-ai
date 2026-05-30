"use client";

import dynamic from "next/dynamic";

// Dynamically import the WebGL 3D Canvas visualizer client-side only to bypass SSR
const ProjectVisualizer3D = dynamic(
  () => import("./ProjectVisualizer3D"),
  { ssr: false }
);

export default function HeroVisualizer() {
  return (
    <div className="relative w-full overflow-hidden">
      <ProjectVisualizer3D type="floor-plan" title="Domus Spatial Intelligence" />
    </div>
  );
}
