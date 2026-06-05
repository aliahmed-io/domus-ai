"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { PanelRightClose, PanelRightOpen, Trash2, Loader2 } from "lucide-react";
import { getUser, loadProject, saveProject } from "@/lib/puter";
import type { PuterProject, EditorWorkspace } from "@/types/puter";

const ParameterPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ParameterPanel"),
  { ssr: false }
);

const FloorPlanCanvas = dynamic(
  () => import("@/components/editor/FloorPlanEngine/FloorPlanCanvas"),
  { ssr: false }
);

const ResultsPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ResultsPanel"),
  { ssr: false }
);

const MobileActionDrawer = dynamic(
  () => import("@/components/editor/MobileActionDrawer"),
  { ssr: false }
);

const CatalogPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/CatalogPanel"),
  { ssr: false }
);

const Toolbar = dynamic(
  () => import("@/components/editor/Toolbar"),
  { ssr: false }
);

const OnboardingModal = dynamic(
  () => import("@/components/editor/OnboardingModal"),
  { ssr: false }
);

export default function FloorPlanPage() {
  const { 
    setMode, 
    setTool, 
    workspace, 
    floorPlanLayout, 
    deleteSelected, 
    selectedObjectId,
    loadProjectData
  } = useEditorStore(
    useShallow((s) => ({
      setMode: s.setMode,
      setTool: s.setTool,
      workspace: s.workspace,
      floorPlanLayout: s.floorPlanLayout,
      deleteSelected: s.deleteSelected,
      selectedObjectId: s.selectedObjectId,
      loadProjectData: s.loadProjectData,
    }))
  );

  const [rightOpen, setRightOpen] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Synchronize workspace views on tool launch
    setMode("2d");
    setTool("select");
  }, [setMode, setTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected]);

  // Load project on mount
  useEffect(() => {
    async function loadEditorProject() {
      setLoadingProject(true);
      try {
        const params = new URLSearchParams(window.location.search);
        let projectId = params.get("projectId");
        const user = await getUser();

        if (!projectId) {
          projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newProject: PuterProject = {
            id: projectId,
            ownerId: user?.uuid || "anonymous",
            ownerUsername: user?.username || "Guest",
            title: "Untitled Project",
            description: "Created in Floor Plan Editor",
            type: "floor-plan",
            isPublic: false,
            tags: ["floor-plan"],
            stats: { likes: 0, views: 0, forks: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await saveProject(newProject);

          // Update URL without triggering reload
          const newUrl = `${window.location.pathname}?projectId=${projectId}`;
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
        }

        setCurrentProjectId(projectId);

        const project = await loadProject(projectId);
        if (project) {
          let ws: EditorWorkspace = "onboarding";
          if (project.tags.includes("workspace-manual")) {
            ws = "manual";
          } else if (project.tags.includes("workspace-generative")) {
            ws = "generative";
          } else if (project.floorPlanData && project.floorPlanData.rooms.length > 0) {
            ws = "manual";
          }
          loadProjectData(project.floorPlanData || null, project.sceneData?.objects || [], ws);
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

  // Setup debounced autosave subscription
  useEffect(() => {
    if (loadingProject || !currentProjectId) return;

    let saveTimeout: NodeJS.Timeout | undefined;

    // Record initial states to prevent saving immediately on mount
    const initialLayoutStr = JSON.stringify(useEditorStore.getState().floorPlanLayout);
    const initialObjectsStr = JSON.stringify(useEditorStore.getState().sceneObjects);
    const initialWorkspaceStr = useEditorStore.getState().workspace;

    let lastLayout = initialLayoutStr;
    let lastObjects = initialObjectsStr;
    let lastWorkspace = initialWorkspaceStr;

    const unsubscribe = useEditorStore.subscribe((state) => {
      const currentLayoutStr = JSON.stringify(state.floorPlanLayout);
      const currentObjectsStr = JSON.stringify(state.sceneObjects);
      const currentWorkspaceStr = state.workspace;

      const hasLayoutChanged = currentLayoutStr !== lastLayout;
      const hasObjectsChanged = currentObjectsStr !== lastObjects;
      const hasWorkspaceChanged = currentWorkspaceStr !== lastWorkspace;

      if (hasLayoutChanged || hasObjectsChanged || hasWorkspaceChanged) {
        lastLayout = currentLayoutStr;
        lastObjects = currentObjectsStr;
        lastWorkspace = currentWorkspaceStr;

        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            const existingProject = await loadProject(currentProjectId);
            if (existingProject) {
              const updatedProject: PuterProject = {
                ...existingProject,
                tags: [
                  ...existingProject.tags.filter(t => !t.startsWith("workspace-")),
                  `workspace-${currentWorkspaceStr}`
                ],
                sceneData: {
                  id: existingProject.sceneData?.id || `scene-${Date.now()}`,
                  objects: state.sceneObjects,
                  cameraPosition: existingProject.sceneData?.cameraPosition || { x: 0, y: 5, z: 10 },
                  cameraTarget: existingProject.sceneData?.cameraTarget || { x: 0, y: 0, z: 0 },
                  createdAt: existingProject.sceneData?.createdAt || new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
              };

              if (state.floorPlanLayout) {
                updatedProject.floorPlanData = state.floorPlanLayout;
              } else {
                delete updatedProject.floorPlanData;
              }

              await saveProject(updatedProject);
              console.log("Project autosaved successfully.");
            }
          } catch (err) {
            console.error("Autosave error:", err);
          }
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [loadingProject, currentProjectId]);

  if (loadingProject) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-dark-surface text-on-dark select-none min-h-screen">
        <Loader2 size={36} className="text-indigo animate-spin mb-4" />
        <h3 className="font-jakarta text-heading-xs font-bold text-white">Initializing CAD Workspace</h3>
        <p className="font-body text-xs text-on-dark-muted mt-1">Fetching spatial project details from Puter cloud KV...</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-dark-surface select-none">
      {/* Onboarding Modal Overlay */}
      {workspace === "onboarding" && <OnboardingModal projectId={currentProjectId} />}

      {/* Primary CAD Visualizer Viewport - FULL BLEED */}
      <div className="absolute inset-0 z-0">
        <FloorPlanCanvas />
      </div>

      {/* Top App Bar (Manual CAD Mode or Generative after layout creation) */}
      {(workspace === "manual" || (workspace === "generative" && floorPlanLayout)) && <Toolbar />}

      {/* Left Panel: Catalog (Manual) or Parameters (Generative) */}
      <div 
        className="absolute left-6 top-24 bottom-6 z-20 hidden lg:block"
      >
        <div className="h-full pointer-events-auto shadow-[0_0_40px_rgba(0,0,0,0.3)] rounded-2xl">
          {workspace === "manual" ? <CatalogPanel /> : workspace === "generative" ? <ParameterPanel /> : null}
        </div>
      </div>

      {/* Right Panel Toggle Button */}
      {(workspace === "manual" || workspace === "generative") && (
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute right-6 top-24 z-30 p-2.5 bg-dark-surface/90 border border-hairline-dark rounded-xl text-on-dark hover:text-white hover:bg-dark-surface-alt transition-all shadow-hero backdrop-blur-md"
        >
          {rightOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      )}

      {/* Right Panel: Results & BOM */}
      <div 
        className={`absolute right-20 top-24 bottom-6 w-80 z-20 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hidden lg:block ${
          rightOpen ? "translate-x-0" : "translate-x-[120%]"
        }`}
      >
        <div className="w-full h-full pointer-events-auto shadow-[0_0_40px_rgba(0,0,0,0.3)] rounded-2xl">
          {(workspace === "manual" || workspace === "generative") && <ResultsPanel />}
        </div>
      </div>

      {/* Floating Contextual Toolbar for Selected Items */}
      {selectedObjectId && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-dark-surface/90 backdrop-blur-md border border-hairline-dark p-2 rounded-xl flex gap-2 shadow-[0_24px_48px_rgba(0,0,0,0.4)] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={deleteSelected}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Trash2 size={16} /> Delete Selected
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet Drawer (Mobile Only) */}
      <div className="block lg:hidden">
        <MobileActionDrawer />
      </div>
    </div>
  );
}
