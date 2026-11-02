"use client";

import React, { useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import EditorCanvas from "../EditorCanvas";
import WallMesh from "./WallMesh";
import DoorMesh from "./DoorMesh";
import WindowMesh from "./WindowMesh";
import WallDrawingManager from "./WallDrawingManager";
import DimensionLineOverlay from "./DimensionLineOverlay";
import MepOverlay from "./MepOverlay";
import StaircaseMesh from "./StaircaseMesh";
import CeilingMesh from "./CeilingMesh";
import BlueprintCanvas2D from "./BlueprintCanvas2D";
import PhysicsFurniture from "../PhysicsFurniture";
import RoofMesh from "./RoofMesh";
import RoomSurface from "./RoomSurface";

const FLOOR_FINISH_PBR: Record<
  string,
  { color: string; roughness: number; metalness: number }
> = {
  hardwood: { color: "#b99a74", roughness: 0.45, metalness: 0.05 },
  tile: { color: "#CBD5E1", roughness: 0.25, metalness: 0.1 },
  marble: { color: "#F1F5F9", roughness: 0.15, metalness: 0.15 },
  carpet: { color: "#D6D3D1", roughness: 0.95, metalness: 0.0 },
  concrete: { color: "#94A3B8", roughness: 0.75, metalness: 0.05 },
  terrazzo: { color: "#E2D9D0", roughness: 0.3, metalness: 0.1 },
};

export default function FloorPlanCanvas() {
  const {
    floorPlanLayout,
    mode,
    cameraMode,
    sceneObjects,
    storeys,
    activeStoreyId,
    staircases,
    selectedObjectId,
    setSelectedObject,
  } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      mode: s.mode,
      cameraMode: s.cameraMode,
      sceneObjects: s.sceneObjects,
      storeys: s.storeys,
      activeStoreyId: s.activeStoreyId,
      staircases: s.staircases,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    })),
  );
  const cutawayWalls = useEditorStore((state) => state.cutawayWalls);
  const showGrid = useEditorStore((state) => state.showSceneGrid);
  const lowerWalls = cutawayWalls && mode === "3d";
  const displayStoreys = useMemo(() => {
    if (storeys && storeys.length > 0) {
      return storeys;
    }
    if (floorPlanLayout) {
      return [
        {
          id: activeStoreyId || "storey-1",
          name: "Level 1 - Ground",
          elevation: 0,
          height: 10,
          slabThickness: 0.8,
          floorPlanLayout,
          isVisible: true,
        },
      ];
    }
    return [];
  }, [storeys, activeStoreyId, floorPlanLayout]);

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-dark-surface">
      {/* ── 3. PRIMARY CANVAS VIEWPORT ──────────────────────────────────────── */}
      <div className="flex-1 w-full h-full relative">
        {!floorPlanLayout ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] gap-4">
            <div>
              <h3 className="font-jakarta text-heading-sm font-700 text-white">
                Your plan starts here
              </h3>
              <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
                Configure room quantities in the parameter panel and click
                &ldquo;Generate Layouts&rdquo; to create a starting layout.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Always render the 3D Canvas */}
            <div className="absolute inset-0 z-0">
              <EditorCanvas
                cameraMode={mode === "2d" ? "orthographic" : cameraMode}
                showGrid={mode !== "2d" && showGrid}
              >
                {/* Render Multi-Storey Building Stack with Volumetric Floor Slabs */}
                {displayStoreys.map((storey) => {
                  if (storey.isVisible === false) return null;
                  const elevM = feetToMeters(storey.elevation);
                  const layout = storey.floorPlanLayout;
                  const isStoreyActive =
                    storey.id === (activeStoreyId || displayStoreys[0]?.id);

                  const slabThick = feetToMeters(storey.slabThickness || 0.8);
                  const voids = staircases.filter(
                    (stair) => stair.endStoreyId === storey.id,
                  );
                  return (
                    <group key={storey.id} position={[0, elevM, 0]}>
                      {layout.rooms.map((room) => {
                        const finish =
                          (room.floorMaterial
                            ? FLOOR_FINISH_PBR[room.floorMaterial]
                            : undefined) || FLOOR_FINISH_PBR.hardwood!;
                        return (
                          <React.Fragment key={room.id}>
                            <RoomSurface
                              room={room}
                              thickness={slabThick}
                              top={0}
                              color={isStoreyActive ? "#d5cbbb" : "#bcb7af"}
                              stairs={voids}
                            />
                            <RoomSurface
                              room={room}
                              thickness={0.02}
                              top={0.025}
                              wood={!room.floorMaterial || room.floorMaterial === "hardwood"}
                            color={room.color || finish.color}
                              roughness={finish.roughness}
                              metalness={finish.metalness}
                              stairs={voids}
                              selected={selectedObjectId === room.id}
                              onSelect={() => setSelectedObject(room.id)}
                            />
                          </React.Fragment>
                        );
                      })}

                      {/* Structural walls */}
                      {(layout.walls || []).map((wall) => (
                        <WallMesh
                          key={wall.id}
                          wall={
                            lowerWalls
                              ? { ...wall, height: Math.min(wall.height, 3) }
                              : wall
                          }
                        />
                      ))}

                      {/* Doors and Windows */}
                      {!lowerWalls &&
                        (layout.doors || []).map((door) => (
                          <DoorMesh
                            key={door.id}
                            door={door}
                            walls={layout.walls || []}
                          />
                        ))}
                      {!lowerWalls &&
                        (layout.windows || []).map((win) => (
                          <WindowMesh
                            key={win.id}
                            window={win}
                            walls={layout.walls || []}
                          />
                        ))}
                    </group>
                  );
                })}

                {/* Render interactive 3D wall drawing helper plane and previews */}
                <WallDrawingManager />

                {/* Custom 3D Dimension Lines & measurement overlay */}
                <DimensionLineOverlay />

                {/* Volumetric MEP networks conduit/pipe/wire layer */}
                <MepOverlay />

                {/* Procedural Staircases & handrails */}
                <StaircaseMesh />

                {/* Ceilings per room */}
                {!lowerWalls && <CeilingMesh />}

                {/* Procedural Generative Roof */}
                {!lowerWalls && <RoofMesh />}

                {/* Render AI Synthesized & Catalog 3D Furniture Models */}
                {sceneObjects.map((obj) => {
                  const objStorey = obj.storeyId
                    ? displayStoreys.find((st) => st.id === obj.storeyId)
                    : displayStoreys.find((st) => st.id === activeStoreyId) ||
                      displayStoreys[0];
                  if (objStorey && objStorey.isVisible === false) return null;
                  const storeyElevM = objStorey
                    ? feetToMeters(objStorey.elevation)
                    : 0;

                  return (
                    <PhysicsFurniture
                      key={obj.id}
                      id={obj.id}
                      name={obj.name}
                      position={[
                        obj.position.x,
                        obj.position.y + storeyElevM,
                        obj.position.z,
                      ]}
                      rotation={[
                        obj.rotation.x,
                        obj.rotation.y,
                        obj.rotation.z,
                      ]}
                      scale={[obj.scale.x, obj.scale.y, obj.scale.z]}
                      color="#8C7662"
                      modelUrl={obj.gltfPath}
                      attachmentType={obj.attachmentType}
                      isSelected={selectedObjectId === obj.id}
                      onSelect={() => setSelectedObject(obj.id)}
                    />
                  );
                })}

                {/* Flat floor layout plane with custom styling per mode */}
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, -0.02, 0]}
                  receiveShadow
                >
                  <planeGeometry args={[100, 100]} />
                  <meshBasicMaterial color="#f2f1ed" toneMapped={false} />
                </mesh>
              </EditorCanvas>
            </div>

            {/* Render 2D Blueprint Canvas on top only when in 2d mode */}
            {mode === "2d" && (
              <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent">
                <BlueprintCanvas2D />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
