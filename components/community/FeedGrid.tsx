"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { listCommunityProjects } from "@/lib/puter";
import type { PuterProject } from "@/types/puter";
export default function FeedGrid() {
  const [projects, setProjects] = useState<PuterProject[] | null>(null);
  useEffect(() => {
    let active = true;
    listCommunityProjects().then((items) => {
      if (active) setProjects(items);
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="local-settings">
      <span className="studio-kicker">A collection of your ideas</span>
      <h1>Your local gallery.</h1>
      <p>
        Projects marked for the gallery appear here. This collection stays in
        this browser. Public sharing and online community features are not
        connected yet.
      </p>
      {projects === null ? (
        <p role="status">Opening your gallery...</p>
      ) : projects.length === 0 ? (
        <div className="gallery-empty">
          <FolderOpen size={30} />
          <h2>A little space for your work.</h2>
          <p>Open My projects and add a plan to your gallery.</p>
          <Link className="studio-button" href="/dashboard">
            My projects <ArrowUpRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="local-gallery">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/community/${encodeURIComponent(project.id)}`}
            >
              <span>{project.type.replaceAll("-", " ")}</span>
              <h2>{project.title}</h2>
              <p>
                {project.description ||
                  "Open this project to see its saved plan."}
              </p>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
