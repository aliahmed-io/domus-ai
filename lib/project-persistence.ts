import {
  captureProjectDocument,
  type EditorDocumentState,
} from "@/lib/project-document";

export interface ProjectSaveStatus {
  projectId: string | null;
  state: "idle" | "saved" | "error";
  savedAt: number | null;
}
const initialStatus: ProjectSaveStatus = {
  projectId: null,
  state: "idle",
  savedAt: null,
};
let status = initialStatus;
const listeners = new Set<() => void>();
export const getProjectSaveStatus = () => status;
export const getServerSaveStatus = () => initialStatus;
export const subscribeProjectSaveStatus = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

/** One persistence adapter for every tool. View changes never become document writes. */
export function startProjectPersistence(
  store: {
    getState(): EditorDocumentState;
    subscribe(callback: (state: EditorDocumentState) => void): () => void;
  },
  save: (
    id: string,
    snapshot: ReturnType<typeof captureProjectDocument>,
    workspace: string,
  ) => boolean,
  onProject?: (id: string) => void,
) {
  const initial = store.getState();
  let last = JSON.stringify([
    initial.projectId,
    initial.workspace,
    captureProjectDocument(initial),
  ]);
  return store.subscribe((state) => {
    if (!state.projectId) return;
    onProject?.(state.projectId);
    if (state.workspace === "onboarding") return;
    const snapshot = captureProjectDocument(state);
    const signature = JSON.stringify([
      state.projectId,
      state.workspace,
      snapshot,
    ]);
    if (signature === last) return;
    const saved = save(state.projectId, snapshot, state.workspace);
    // Keep failed snapshots dirty so the next edit can retry.
    if (saved) last = signature;
    status = {
      projectId: state.projectId,
      state: saved ? "saved" : "error",
      savedAt: saved ? Date.now() : null,
    };
    listeners.forEach((listener) => listener());
  });
}
