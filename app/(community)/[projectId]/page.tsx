"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Heart,
  Eye,
  ExternalLink,
  Globe,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { loadProject } from "@/lib/puter";
import { formatDate } from "@/lib/utils";
import type { PuterProject } from "@/types/puter";

const ProjectVisualizer3D = dynamic(
  () => import("@/components/visualizer/ProjectVisualizer3D"),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = use(params);
  
  const [project, setProject] = useState<PuterProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    async function fetchProject() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await loadProject(projectId);
        
        if (active) {
          if (data) {
            setProject(data);
            document.title = `${data.title} | Domus Discover`;
          } else {
            setError("The requested spatial project could not be found.");
          }
        }
      } catch {
        if (active) {
          setError("Failed to communicate with Puter cloud database.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  // Loading view
  if (loading) {
    return (
      <div className="w-full min-h-screen p-6 md:p-8 bg-alabaster flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo animate-spin" />
        <p className="font-headline font-semibold text-stone text-sm">
          Accessing spatial coordinate registry...
        </p>
      </div>
    );
  }

  // Error / Not found view
  if (error || !project) {
    return (
      <div className="w-full min-h-screen p-6 md:p-8 bg-alabaster flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white border border-hairline rounded-2xl p-8 shadow-card text-center space-y-5">
          <div className="w-12 h-12 bg-error-light text-error border border-error/10 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="font-jakarta text-lg font-bold text-charcoal tracking-tight">
            Spatial Workspace Not Found
          </h2>
          <p className="font-body text-xs text-stone leading-relaxed">
            {error || "The project coordinate ID is invalid or may have been deleted by the owner."}
          </p>
          <Link
            href="/community"
            className="w-full h-10 btn-primary justify-center bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-button transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Discovery Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  // Standard Loaded view
  return (
    <div className="w-full min-h-screen p-6 md:p-8 bg-alabaster">
      {/* Back button */}
      <header className="mb-6 flex justify-between items-center">
        <Link
          href="/community"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone hover:text-charcoal px-3 py-1.5 border border-hairline hover:bg-white rounded-lg transition-colors outline-none"
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </Link>
      </header>

      {/* Main visual split container */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
        {/* Left 3D / Image viewer wrapper (2 cols) */}
        <div className="lg:col-span-2">
          <ProjectVisualizer3D type={project.type} title={project.title} />
        </div>

        {/* Right Info pane (1 col) */}
        <div className="bg-white border border-hairline rounded-2xl p-6 shadow-card space-y-6">
          {/* Headline details */}
          <div className="border-b border-hairline pb-4 space-y-2">
            <span className="px-2.5 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase tracking-wider border border-indigo/15 rounded-full inline-block">
              {project.type.replace("-", " ")}
            </span>
            <h1 className="font-jakarta text-heading-md font-800 text-charcoal tracking-tight leading-snug">
              {project.title}
            </h1>
            <p className="font-body text-xs text-stone leading-relaxed">
              {project.description || "No description provided for this spatial Twin environment."}
            </p>
          </div>

          {/* Social details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-alabaster border border-hairline rounded-xl p-3.5 flex items-center gap-3">
              <Eye size={18} className="text-stone shrink-0" />
              <div>
                <p className="font-body text-[10px] text-stone font-semibold uppercase tracking-wider">
                  Total Views
                </p>
                <h4 className="font-mono text-sm font-bold text-charcoal mt-0.5">
                  {project.stats?.views ?? 0}
                </h4>
              </div>
            </div>

            <div className="bg-alabaster border border-hairline rounded-xl p-3.5 flex items-center gap-3">
              <Heart size={18} className="text-error shrink-0" />
              <div>
                <p className="font-body text-[10px] text-stone font-semibold uppercase tracking-wider">
                  Total Likes
                </p>
                <h4 className="font-mono text-sm font-bold text-charcoal mt-0.5">
                  {project.stats?.likes ?? 0}
                </h4>
              </div>
            </div>
          </div>

          {/* Metadata counts */}
          <div className="space-y-3.5 border-t border-hairline pt-5 text-xs text-charcoal font-body">
            <div className="flex items-center justify-between">
              <span className="text-stone">Published By</span>
              <span className="font-semibold flex items-center gap-1.5">
                <div className="w-5 h-5 bg-indigo rounded-full text-white text-[9px] font-bold flex items-center justify-center uppercase">
                  {project.ownerUsername?.slice(0, 2) ?? "US"}
                </div>
                <span>{project.ownerUsername ?? "Anonymous"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone">Publish Date</span>
              <span className="font-semibold flex items-center gap-1.5">
                <Calendar size={13} className="text-stone" />
                <span>{formatDate(project.createdAt)}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone">Visibility Status</span>
              <span className="font-semibold flex items-center gap-1.5 text-success">
                <Globe size={13} />
                <span>Public Workspace</span>
              </span>
            </div>
          </div>

          {/* Call-to-action buttons */}
          <div className="border-t border-hairline pt-5 flex flex-col gap-2.5">
            <Link
              href={`/editor/${project.type === "floor-plan" ? "floor-plan" : project.type === "bim-model" ? "bim-lift" : project.type === "ar-scan" ? "ar-map" : project.type === "material-lab" ? "material-lab" : "furniture"}`}
              className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors"
            >
              <ExternalLink size={13} />
              <span>Fork & Open in Editor</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
