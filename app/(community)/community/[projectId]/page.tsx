"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { loadProject, saveProject, getUser } from "@/lib/puter";
import type { PuterProject } from "@/types/puter";
import SavedPlan from "@/components/studio/SavedPlan";
export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<PuterProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    let active = true;
    loadProject(projectId).then((saved) => {
      if (active) {
        setProject(saved);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [projectId]);
  async function openCopy() {
    if (!project) return;
    setCopying(true);
    try {
      const user = await getUser();
      const id = crypto.randomUUID();
      const copy: PuterProject = {
        ...project,
        id,
        title: `${project.title} copy`,
        ownerId: user.uuid,
        ownerUsername: user.username,
        isPublic: false,
        stats: { views: 0, likes: 0, forks: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!(await saveProject(copy)))
        throw Error(
          "Your browser could not save a copy. Free up storage and try again.",
        );
      router.push(`/floor-plan?projectId=${encodeURIComponent(id)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not copy the project.",
      );
      setCopying(false);
    }
  }
  return (
    <div className="local-settings project-detail">
      <Link href="/community" className="studio-text-link">
        <ArrowLeft size={15} /> Back to local gallery
      </Link>
      {loading ? (
        <p role="status">Opening saved project...</p>
      ) : project ? (
        <>
          <h1>{project.title}</h1>
          <p>{project.description || "Your saved design."}</p>
          <SavedPlan project={project} />
          <p>
            {project.floorPlanData?.walls.length ?? 0} walls.{" "}
            {project.sceneData?.objects.length ?? 0} scene objects.
          </p>
          <button
            className="studio-button"
            onClick={openCopy}
            disabled={copying}
          >
            <Copy size={17} />
            {copying ? "Creating a copy..." : "Make a copy and edit"}
          </button>
          <small>
            This makes a separate local project. The original stays unchanged.
          </small>
        </>
      ) : (
        <>
          <h1>Project not found.</h1>
          <p>
            This project is not saved in this browser. Open My projects to find
            a local plan.
          </p>
          <Link href="/dashboard" className="studio-button">
            My projects
          </Link>
        </>
      )}
    </div>
  );
}
