"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUser, loadProject, saveProject } from "@/lib/puter";
import {
  getProjectSaveStatus,
  getServerSaveStatus,
  subscribeProjectSaveStatus,
} from "@/lib/project-persistence";
import type { PuterProject, EditorWorkspace } from "@/types/puter";

const ParameterPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ParameterPanel"),
  { ssr: false },
);

const FloorPlanCanvas = dynamic(
  () => import("@/components/editor/FloorPlanEngine/FloorPlanCanvas"),
  { ssr: false },
);

const ResultsPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ResultsPanel"),
  { ssr: false },
);

const PropertiesPanel = dynamic(
  () => import("@/components/editor/PropertiesPanel"),
  { ssr: false },
);

const MobileActionDrawer = dynamic(
  () => import("@/components/editor/MobileActionDrawer"),
  { ssr: false },
);

const CatalogPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/CatalogPanel"),
  { ssr: false },
);

const Toolbar = dynamic(() => import("@/components/editor/Toolbar"), {
  ssr: false,
});

const OnboardingModal = dynamic(
  () => import("@/components/editor/OnboardingModal"),
  { ssr: false },
);

const PresentationOverlay = dynamic(
  () => import("@/components/editor/PresentationOverlay"),
  { ssr: false },
);

export default function FloorPlanPage() {
  const {
    setMode,
    setTool,
    workspace,
    deleteSelected,
    selectedObjectId,
    loadProjectData,
    isPresentationMode,
  } = useEditorStore(
    useShallow((s) => ({
      setMode: s.setMode,
      setTool: s.setTool,
      workspace: s.workspace,
      deleteSelected: s.deleteSelected,
      selectedObjectId: s.selectedObjectId,
      loadProjectData: s.loadProjectData,
      isPresentationMode: s.isPresentationMode,
    })),
  );

  const [rightOpen, setRightOpen] = useState(false);
  const catalogOpen = useEditorStore((state) => state.catalogOpen);
  const [rightTab, setRightTab] = useState<"inspector" | "results">(
    "inspector",
  );
  const [loadingProject, setLoadingProject] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const saveStatus = useSyncExternalStore(
    subscribeProjectSaveStatus,
    getProjectSaveStatus,
    getServerSaveStatus,
  );
  const lastSaved =
    saveStatus.projectId === currentProjectId && saveStatus.savedAt
      ? new Date(saveStatus.savedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  if (selectedObjectId && selectedObjectId !== prevSelectedId) {
    setPrevSelectedId(selectedObjectId);
    setRightOpen(true);
    setRightTab("inspector");
  } else if (!selectedObjectId && prevSelectedId) {
    setPrevSelectedId(null);
  }

  useEffect(() => {
    // Synchronize workspace views on tool launch
    setMode("2d");
    setTool("select");
  }, [setMode, setTool]);

  // Load project on mount
  useEffect(() => {
    async function loadEditorProject() {
      setLoadingProject(true);
      try {
        const params = new URLSearchParams(window.location.search);
        let projectId = params.get("projectId");
        const user = await getUser();
        const startFresh = params.get("new") === "1";

        // Check if another studio (/bim-lift, /ar-map, /furniture, /material-lab) just populated the store
        const existingState = useEditorStore.getState();
        const hasInMemoryFloorPlan =
          !startFresh &&
          Boolean(existingState.floorPlanLayout) &&
          (Boolean(existingState.floorPlanLayout?.blueprint) ||
            (existingState.floorPlanLayout?.walls.length ?? 0) > 0 ||
            (existingState.floorPlanLayout?.rooms.length ?? 0) > 0);
        const hasInMemoryObjects =
          !startFresh && existingState.sceneObjects.length > 0;

        if (!projectId && !startFresh && existingState.projectId)
          projectId = existingState.projectId;
        if (!projectId) {
          // If no projectId in URL and no in-memory handoff, check if there is a recent local backup
          if (!startFresh && !hasInMemoryFloorPlan && !hasInMemoryObjects) {
            const latestStr = localStorage.getItem("domus_latest_project");
            if (latestStr) {
              try {
                const latestProj = JSON.parse(latestStr) as PuterProject;
                if (
                  latestProj?.id &&
                  latestProj.floorPlanData &&
                  latestProj.floorPlanData.walls.length > 0
                ) {
                  projectId = latestProj.id;
                  const restoredUrl = `${window.location.pathname}?projectId=${projectId}`;
                  window.history.replaceState(
                    {
                      ...window.history.state,
                      as: restoredUrl,
                      url: restoredUrl,
                    },
                    "",
                    restoredUrl,
                  );
                }
              } catch {
                // Ignore invalid JSON
              }
            }
          }

          if (!projectId) {
            projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            const initialWorkspaceTag =
              hasInMemoryFloorPlan || hasInMemoryObjects
                ? "workspace-manual"
                : "floor-plan";
            const newProject: PuterProject = {
              id: projectId,
              ownerId: user?.uuid || "anonymous",
              ownerUsername: user?.username || "Guest",
              title: hasInMemoryFloorPlan
                ? "Imported BIM Spatial Twin"
                : "Untitled Project",
              description: "Created in Domus Floor Plan Studio",
              type: "floor-plan",
              isPublic: false,
              tags: ["floor-plan", initialWorkspaceTag],
              stats: { likes: 0, views: 0, forks: 0 },
              floorPlanData: hasInMemoryFloorPlan
                ? existingState.floorPlanLayout || undefined
                : undefined,
              sceneData:
                hasInMemoryFloorPlan || hasInMemoryObjects
                  ? {
                      id: `scene-${Date.now()}`,
                      objects: existingState.sceneObjects,
                      cameraPosition: { x: 0, y: 5, z: 10 },
                      cameraTarget: { x: 0, y: 0, z: 0 },
                      createdAt: new Date().toISOString(),
                      storeys: existingState.storeys,
                      activeStoreyId: existingState.activeStoreyId,
                      staircases: existingState.staircases,
                      dimensionLines: existingState.dimensionLines,
                      materials: existingState.materials,
                    }
                  : undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            if (!(await saveProject(newProject))) {
              setSaveError(true);
              toast.error(
                "Browser storage is unavailable. Export your work before leaving.",
              );
            }
            try {
              localStorage.setItem(
                `domus_backup_project_${projectId}`,
                JSON.stringify(newProject),
              );
              localStorage.setItem(
                "domus_latest_project",
                JSON.stringify(newProject),
              );
            } catch {
              // Ignore storage quota errors
            }

            const newUrl = `${window.location.pathname}?projectId=${projectId}`;
            window.history.replaceState(
              { ...window.history.state, as: newUrl, url: newUrl },
              "",
              newUrl,
            );

            if (hasInMemoryFloorPlan || hasInMemoryObjects) {
              setCurrentProjectId(projectId);
              loadProjectData(
                existingState.floorPlanLayout,
                existingState.sceneObjects,
                "manual",
                {
                  storeys: existingState.storeys,
                  activeStoreyId: existingState.activeStoreyId,
                  staircases: existingState.staircases,
                  dimensionLines: existingState.dimensionLines,
                  materials: existingState.materials,
                  projectId,
                },
              );
              setLoadingProject(false);
              return;
            }
          }
        }

        setCurrentProjectId(projectId);
        const resolvedUrl = `${window.location.pathname}?projectId=${encodeURIComponent(projectId)}`;
        window.history.replaceState(
          { ...window.history.state, as: resolvedUrl, url: resolvedUrl },
          "",
          resolvedUrl,
        );

        let project = await loadProject(projectId);

        // Dual-layer auto-save fallback: if Puter KV is empty, restore from local storage
        if (!project) {
          const localStr = localStorage.getItem(
            `domus_backup_project_${projectId}`,
          );
          if (localStr) {
            try {
              const backup = JSON.parse(localStr) as PuterProject;
              if (backup.id === projectId) project = backup;
              toast.success("Restored project from local autosave!");
            } catch (lsParseErr) {
              console.warn("Local storage parse error:", lsParseErr);
            }
          }
        }

        if (project) {
          let ws: EditorWorkspace = "onboarding";
          if (project.tags.includes("workspace-manual")) {
            ws = "manual";
          } else if (project.tags.includes("workspace-generative")) {
            ws = "generative";
          } else if (
            project.floorPlanData &&
            (project.floorPlanData.rooms.length > 0 ||
              project.floorPlanData.walls.length > 0)
          ) {
            ws = "manual";
          }
          loadProjectData(
            project.floorPlanData || null,
            project.sceneData?.objects || [],
            ws,
            {
              storeys: project.sceneData?.storeys,
              activeStoreyId: project.sceneData?.activeStoreyId,
              staircases: project.sceneData?.staircases,
              dimensionLines: project.sceneData?.dimensionLines,
              materials: project.sceneData?.materials,
              projectId,
            },
          );
        } else {
          loadProjectData(null, [], "onboarding");
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
        loadProjectData(null, [], "onboarding");
      } finally {
        setLoadingProject(false);
      }
    }

    loadEditorProject();
  }, [loadProjectData]);

  if (loadingProject) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-dark-surface text-on-dark select-none min-h-screen">
        <Loader2 size={36} className="text-indigo animate-spin mb-4" />
        <h3 className="font-jakarta text-heading-xs font-bold text-white">
          Initializing CAD Workspace
        </h3>
        <p className="font-body text-xs text-on-dark-muted mt-1">
          Opening your local project...
        </p>
      </div>
    );
  }

  return (
    <div
      className="cad-workspace relative flex-1 w-full h-full overflow-hidden select-none"
      data-catalog-open={catalogOpen && workspace === "manual"}
      data-project-open={rightOpen}
      data-generative={workspace === "generative"}
      data-presenting={isPresentationMode}
    >
      {/* Onboarding Modal Overlay */}
      {workspace === "onboarding" && (
        <OnboardingModal projectId={currentProjectId} />
      )}

      {/* Primary CAD Visualizer Viewport - FULL BLEED */}
      <div className="cad-scene">
        <FloorPlanCanvas />
      </div>

      {/* Client Presentation Mode Cinema Overlay */}
      {isPresentationMode && <PresentationOverlay />}

      {!isPresentationMode && workspace !== "onboarding" && (
        <Toolbar
          onToggleProject={() => setRightOpen(!rightOpen)}
          projectOpen={rightOpen}
        />
      )}

      {/* Left Panel: Catalog (Manual) or Parameters (Generative) */}
      {!isPresentationMode && (
        <div className="editor-catalog-slot">
          <div className="h-full pointer-events-auto">
            {workspace === "manual" ? (
              <CatalogPanel />
            ) : workspace === "generative" ? (
              <ParameterPanel />
            ) : null}
          </div>
        </div>
      )}

      {/* Right Panel: Contextual Inspector & Project BOM */}
      {!isPresentationMode && (
        <div
          inert={!rightOpen}
          className="editor-project-panel"
          data-open={rightOpen}
        >
          <div className="w-full h-full pointer-events-auto flex flex-col overflow-hidden bg-white">
            {/* Header Tab Switcher */}
            <div className="flex border-b border-hairline bg-alabaster/60 p-1.5 gap-1 select-none">
              <button
                onClick={() => setRightTab("inspector")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  rightTab === "inspector"
                    ? "bg-white text-indigo shadow-sm"
                    : "text-stone hover:text-charcoal"
                }`}
              >
                Inspector {selectedObjectId ? "•" : ""}
              </button>
              <button
                onClick={() => setRightTab("results")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  rightTab === "results"
                    ? "bg-white text-indigo shadow-sm"
                    : "text-stone hover:text-charcoal"
                }`}
              >
                BOM & Export
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {rightTab === "inspector" ? (
                <PropertiesPanel />
              ) : (
                (workspace === "manual" || workspace === "generative") && (
                  <ResultsPanel />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Contextual Toolbar for Selected Items */}
      {!isPresentationMode && selectedObjectId && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-dark-surface/90 backdrop-blur-md border border-hairline-dark p-2 rounded-xl flex gap-2 shadow-[0_24px_48px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button
            onClick={deleteSelected}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 size={16} /> Delete Selected
          </button>
        </div>
      )}

      {/* Dual-Layer Autosave Indicator Badge */}
      {!isPresentationMode && (
        <footer className="editor-statusbar">
          <span>Projects save on this device</span>
          <span>
            {saveError ||
            (saveStatus.projectId === currentProjectId &&
              saveStatus.state === "error")
              ? "Could not save. Export your work."
              : lastSaved
                ? `Saved here · ${lastSaved}`
                : "Local autosave ready"}
          </span>
        </footer>
      )}

      {/* Mobile Bottom Sheet Drawer (Mobile Only) */}
      {!isPresentationMode && (
        <div className="block lg:hidden">
          <MobileActionDrawer />
        </div>
      )}
    </div>
  );
}
