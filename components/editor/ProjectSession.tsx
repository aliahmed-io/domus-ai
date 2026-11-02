"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
import { createDemoProject } from "@/lib/demo-project";
import { loadProject, saveProject, saveProjectSnapshot } from "@/lib/puter";
import { startProjectPersistence } from "@/lib/project-persistence";

/** Keep a project's edits when moving between its material and furniture tools. */
export default function ProjectSession() {
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    if (pathname !== "/floor-plan" && !useEditorStore.getState().projectId) {
      let id: string | null = null;
      try {
        id = localStorage.getItem("domus:active-project");
      } catch {
        /* Storage unavailable. */
      }
      if (!id && pathname === "/furniture") {
        const draft = createDemoProject();
        draft.title = "Furniture study";
        draft.type = "furniture";
        draft.floorPlanData = undefined;
        draft.tags = ["workspace-manual"];
        if (draft.sceneData) draft.sceneData.objects = [];
        void saveProject(draft).then((saved) => {
          if (active && saved && !useEditorStore.getState().projectId)
            useEditorStore
              .getState()
              .loadProjectData(null, [], "manual", { projectId: draft.id });
        });
      }
      if (id)
        void loadProject(id).then((project) => {
          if (!active || !project || useEditorStore.getState().projectId)
            return;
          useEditorStore
            .getState()
            .loadProjectData(
              project.floorPlanData ?? null,
              project.sceneData?.objects ?? [],
              "manual",
              {
                ...project.sceneData,
                projectId: project.id,
              },
            );
        });
    }
    const unsubscribe = startProjectPersistence(
      useEditorStore,
      saveProjectSnapshot,
      (id) => {
        try {
          localStorage.setItem("domus:active-project", id);
        } catch {
          /* The save status reports unavailable storage. */
        }
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [pathname]);
  return null;
}
