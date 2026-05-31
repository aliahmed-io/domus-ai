/**
 * Puter.js client wrapper
 * All Puter interactions are client-side only.
 * Never import this in Server Components or API routes.
 */
"use client";

import type { PuterUser, PuterProject } from "@/types/puter";

// Safe accessor — returns null on SSR or if Puter hasn't loaded
function getPuter(): typeof window.puter | null {
  if (typeof window === "undefined") return null;
  return window.puter ?? null;
}

// Timeout helper: races a promise against a time limit to prevent client UI freeze if cloud APIs hang
function withTimeout<T>(promise: Promise<T>, timeoutMs = 1200, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`Puter API call timed out after ${timeoutMs}ms. Invoking safe fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(): Promise<PuterUser | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    await puter.auth.signIn();
    return getUser();
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  const puter = getPuter();
  if (!puter) return;
  await puter.auth.signOut();
}

export async function getUser(): Promise<PuterUser | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    const user = await puter.auth.getUser();
    return user as PuterUser;
  } catch {
    return null;
  }
}

export async function isSignedIn(): Promise<boolean> {
  const puter = getPuter();
  if (!puter) return false;
  try {
    return await puter.auth.isSignedIn();
  } catch {
    return false;
  }
}

// ─── KV Storage ──────────────────────────────────────────────────────────────

export async function kvGet<T>(key: string): Promise<T | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    const apiCall = puter.kv.get(key).then((value) => {
      if (!value) return null;
      return JSON.parse(value as string) as T;
    }).catch(() => null);
    return await withTimeout(apiCall, 1200, null);
  } catch {
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<boolean> {
  const puter = getPuter();
  if (!puter) return false;
  try {
    const apiCall = puter.kv.set(key, JSON.stringify(value)).then(() => true).catch(() => false);
    return await withTimeout(apiCall, 1200, false);
  } catch {
    return false;
  }
}

export async function kvDelete(key: string): Promise<boolean> {
  const puter = getPuter();
  if (!puter) return false;
  try {
    const apiCall = puter.kv.del(key).then(() => true).catch(() => false);
    return await withTimeout(apiCall, 1200, false);
  } catch {
    return false;
  }
}

export async function kvList(prefix: string): Promise<string[]> {
  const puter = getPuter();
  if (!puter) return [];
  try {
    const apiCall = puter.kv.list(prefix + "*").then((result) => {
      return (result as { key: string }[]).map((r) => r.key);
    }).catch(() => []);
    return await withTimeout(apiCall, 1200, []);
  } catch {
    return [];
  }
}

// ─── File Storage ─────────────────────────────────────────────────────────────

export async function uploadFile(
  path: string,
  content: Blob | string
): Promise<string | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    const file = await puter.fs.write(path, content);
    return (file as { path: string }).path;
  } catch {
    return null;
  }
}

export async function readFile(path: string): Promise<Blob | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    const file = await puter.fs.read(path);
    return file as Blob;
  } catch {
    return null;
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  const puter = getPuter();
  if (!puter) return false;
  try {
    await puter.fs.delete(path);
    return true;
  } catch {
    return false;
  }
}

// ─── AI Proxy ────────────────────────────────────────────────────────────────

export async function aiChat(
  prompt: string,
  options?: { model?: string; maxTokens?: number }
): Promise<string | null> {
  const puter = getPuter();
  if (!puter) return null;
  try {
    const response = await puter.ai.chat(prompt, {
      model: options?.model ?? "claude-3-5-sonnet",
    });
    const message = response as { message?: { content?: string }; content?: string };
    return message?.message?.content ?? message?.content ?? null;
  } catch {
    return null;
  }
}

// ─── Project CRUD (KV-backed) ─────────────────────────────────────────────────

const PROJECT_PREFIX = "domus:project:";
const PROJECT_INDEX_KEY = "domus:project-index";

export async function saveProject(project: PuterProject): Promise<boolean> {
  const [saved, indexed] = await Promise.all([
    kvSet(`${PROJECT_PREFIX}${project.id}`, project),
    (async () => {
      const index = (await kvGet<string[]>(PROJECT_INDEX_KEY)) ?? [];
      if (!index.includes(project.id)) {
        index.unshift(project.id);
      }
      return kvSet(PROJECT_INDEX_KEY, index);
    })(),
  ]);
  return saved && indexed;
}

export async function loadProject(id: string): Promise<PuterProject | null> {
  return kvGet<PuterProject>(`${PROJECT_PREFIX}${id}`);
}

export async function listProjects(): Promise<PuterProject[]> {
  const index = (await kvGet<string[]>(PROJECT_INDEX_KEY)) ?? [];
  const projects = await Promise.all(index.map((id) => loadProject(id)));
  return projects.filter((p): p is PuterProject => p !== null);
}

export async function deleteProject(id: string): Promise<boolean> {
  const [deleted, deindexed] = await Promise.all([
    kvDelete(`${PROJECT_PREFIX}${id}`),
    (async () => {
      const index = (await kvGet<string[]>(PROJECT_INDEX_KEY)) ?? [];
      const updated = index.filter((i) => i !== id);
      return kvSet(PROJECT_INDEX_KEY, updated);
    })(),
  ]);
  return deleted && deindexed;
}

export async function updateProjectVisibility(
  id: string,
  isPublic: boolean
): Promise<boolean> {
  const project = await loadProject(id);
  if (!project) return false;
  return saveProject({ ...project, isPublic, updatedAt: new Date().toISOString() });
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
  const index = (await kvGet<string[]>(COMMUNITY_INDEX_KEY)) ?? [];
  const projects = await Promise.all(index.map((id) => loadProject(id)));
  return projects.filter((p): p is PuterProject => p !== null && p.isPublic);
}
