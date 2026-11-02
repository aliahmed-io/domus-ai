/** Browser-local project storage. The filename preserves existing imports during the prototype. */
"use client";

import { readProjectDocument } from "@/lib/project-document";
import type { PuterUser, PuterProject } from "@/types/puter";

const PREFIX = "domus:local:v1:";
const visitor: PuterUser = { uuid: "local-workshop", username: "Designer" };

export async function getUser(): Promise<PuterUser> {
  const profile = await kvGet<{ name: string }>("profile");
  return {
    ...visitor,
    username:
      typeof profile?.name === "string" && profile.name.trim()
        ? profile.name.trim()
        : visitor.username,
  };
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? null : (JSON.parse(value) as T);
  } catch {
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function kvDelete(key: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

export async function kvList(prefix: string): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX + prefix))
      .map((key) => key.slice(PREFIX.length));
  } catch {
    return [];
  }
}

// ─── Project CRUD (KV-backed) ─────────────────────────────────────────────────

const PROJECT_PREFIX = "domus:project:";

// Keep the primary record current before navigation or tab closure can cancel a timer.
export function saveProjectSnapshot(
  id: string,
  updates: Pick<PuterProject, "floorPlanData" | "sceneData">,
  workspace: string,
): boolean {
  try {
    const key = PREFIX + PROJECT_PREFIX + id;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const previous = JSON.parse(raw) as PuterProject;
    const next: PuterProject = {
      ...previous,
      ...updates,
      tags: [
        ...previous.tags.filter((tag) => !tag.startsWith("workspace-")),
        `workspace-${workspace}`,
      ],
      updatedAt: new Date().toISOString(),
    };
    const document = readProjectDocument(next);
    if (!document) return false;
    localStorage.setItem(key, JSON.stringify(document));
    // The latest pointer is only a convenience. Failure here does not undo a saved record.
    try {
      localStorage.setItem("domus_latest_project", JSON.stringify(next));
    } catch {
      /* Primary record already saved. */
    }
    return true;
  } catch {
    return false;
  }
}

export async function saveProject(project: PuterProject): Promise<boolean> {
  const document = readProjectDocument(project);
  return document ? kvSet(`${PROJECT_PREFIX}${project.id}`, document) : false;
}

export async function loadProject(id: string): Promise<PuterProject | null> {
  const current = await kvGet<unknown>(`${PROJECT_PREFIX}${id}`);
  if (current !== null) { const document = readProjectDocument(current); return document?.id === id ? document : null; }
  // Recover an existing local backup by exact ID. Never substitute the latest unrelated plan.
  try {
    const raw = localStorage.getItem(`domus_backup_project_${id}`);
    if (!raw) return null;
    const backup = readProjectDocument(JSON.parse(raw));
    if (!backup) return null;
    if (
      backup.id !== id ||
      !Array.isArray(backup.tags) ||
      typeof backup.updatedAt !== "string"
    )
      return null;
    await saveProject(backup);
    return backup;
  } catch {
    return null;
  }
}

export async function listProjects(): Promise<PuterProject[]> {
  try {
    const legacyIds = Object.keys(localStorage)
      .filter((key) => key.startsWith("domus_backup_project_"))
      .map((key) => key.slice("domus_backup_project_".length));
    await Promise.all(legacyIds.map(loadProject));
  } catch {
    /* Storage may be unavailable. */
  }
  const keys = await kvList(PROJECT_PREFIX);
  const projects = await Promise.all(
    keys.map((key) => loadProject(key.slice(PROJECT_PREFIX.length))),
  );
  return projects
    .filter((p): p is PuterProject => p !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteProject(id: string): Promise<boolean> {
  const removed = await kvDelete(`${PROJECT_PREFIX}${id}`);
  if (!removed) return false;
  try {
    localStorage.removeItem(`domus_backup_project_${id}`);
    const latest = localStorage.getItem("domus_latest_project");
    if (latest && JSON.parse(latest).id === id)
      localStorage.removeItem("domus_latest_project");
    return true;
  } catch {
    return false;
  }
}

export async function updateProjectVisibility(
  id: string,
  isPublic: boolean,
): Promise<boolean> {
  const project = await loadProject(id);
  if (!project) return false;
  return saveProject({
    ...project,
    isPublic,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Community (public projects) ─────────────────────────────────────────────

const COMMUNITY_INDEX_KEY = "domus:community-index";

export async function publishProject(project: PuterProject): Promise<boolean> {
  const index = (await kvGet<string[]>(COMMUNITY_INDEX_KEY)) ?? [];
  if (!index.includes(project.id)) {
    index.unshift(project.id);
    await kvSet(COMMUNITY_INDEX_KEY, index);
  }
  return updateProjectVisibility(project.id, true);
}

export async function unpublishProject(id: string): Promise<boolean> {
  const index = (await kvGet<string[]>(COMMUNITY_INDEX_KEY)) ?? [];
  const updated = index.filter((i) => i !== id);
  await kvSet(COMMUNITY_INDEX_KEY, updated);
  return updateProjectVisibility(id, false);
}

export async function listCommunityProjects(): Promise<PuterProject[]> {
  return (await listProjects()).filter((project) => project.isPublic);
}
