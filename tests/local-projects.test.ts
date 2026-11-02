import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getUser,
  kvSet,
  loadProject,
  saveProject,
  saveProjectSnapshot,
  listProjects,
  deleteProject,
  listCommunityProjects,
  updateProjectVisibility,
} from "@/lib/puter";
import type { PuterProject } from "@/types/puter";

function project(id: string): PuterProject {
  return {
    id,
    ownerId: "local-workshop",
    ownerUsername: "Designer",
    title: id,
    description: "",
    type: "floor-plan",
    isPublic: false,
    tags: [],
    stats: { likes: 0, views: 0, forks: 0 },
    createdAt: "2026-11-02",
    updatedAt: "2026-11-02",
  };
}

describe("account-free local projects", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("opens a local identity without contacting an account provider", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await getUser()).uuid).toBe("local-workshop");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps concurrent new projects and can reopen and delete them independently", async () => {
    expect(
      await Promise.all([saveProject(project("a")), saveProject(project("b"))]),
    ).toEqual([true, true]);
    expect((await listProjects()).map((p) => p.id).sort()).toEqual(["a", "b"]);
    expect(await loadProject("a")).toMatchObject(project("a"));
    expect((await loadProject("a"))?.schemaVersion).toBe(1);
    await deleteProject("a");
    expect(await loadProject("a")).toBeNull();
    expect(await loadProject("b")).toMatchObject(project("b"));
  });

  it("returns failure when the browser cannot save instead of claiming success", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(await saveProject(project("a"))).toBe(false);
    expect(await kvSet("profile", {})).toBe(false);
  });

  it("does not substitute another project for a missing ID", async () => {
    await saveProject(project("a"));
    expect(await loadProject("missing")).toBeNull();
  });

  it("recovers exact legacy backups without resurrecting deleted projects", async () => {
    localStorage.setItem(
      "domus_backup_project_old",
      JSON.stringify(project("old")),
    );
    localStorage.setItem(
      "domus_latest_project",
      JSON.stringify(project("old")),
    );
    expect((await listProjects()).map((p) => p.id)).toEqual(["old"]);
    expect(await loadProject("missing")).toBeNull();
    expect(await deleteProject("old")).toBe(true);
    expect(await listProjects()).toEqual([]);
  });

  it("saves the primary snapshot before navigation and preserves gallery metadata", async () => {
    await saveProject({
      ...project("a"),
      title: "Keep this title",
      isPublic: true,
    });
    expect(
      saveProjectSnapshot(
        "a",
        { sceneData: undefined, floorPlanData: undefined },
        "manual",
      ),
    ).toBe(true);
    const saved = await loadProject("a");
    expect(saved?.title).toBe("Keep this title");
    expect(saved?.isPublic).toBe(true);
    expect(saved?.tags).toContain("workspace-manual");
    expect((await listCommunityProjects()).map((p) => p.id)).toEqual(["a"]);
    await updateProjectVisibility("a", false);
    expect(await listCommunityProjects()).toEqual([]);
  });
});
