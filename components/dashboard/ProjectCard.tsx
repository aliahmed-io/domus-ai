"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Layers,
  Scan,
  Palette,
  Package,
  Lock,
  Globe,
  MoreVertical,
  Trash2,
  Share2,
  ExternalLink,
  Eye,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useProjectStore } from "@/store/useProjectStore";
import { deleteProject, updateProjectVisibility } from "@/lib/puter";
import { formatRelative } from "@/lib/utils";
import type { PuterProject, ProjectType } from "@/types/puter";

interface ProjectCardProps {
  project: PuterProject;
}

const TYPE_CONFIG: Record<
  ProjectType,
  { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; badgeClass: string }
> = {
  "floor-plan": {
    icon: Brain,
    label: "Floor Plan",
    badgeClass: "bg-indigo-light text-indigo border-indigo/20",
  },
  "bim-model": {
    icon: Layers,
    label: "BIM Lift",
    badgeClass: "bg-teal-light text-teal border-teal/20",
  },
  "ar-scan": {
    icon: Scan,
    label: "AR Scan",
    badgeClass: "bg-gold-light text-gold border-gold/20",
  },
  "material-lab": {
    icon: Palette,
    label: "Material Lab",
    badgeClass: "bg-indigo-light text-indigo border-indigo/20",
  },
  "furniture": {
    icon: Package,
    label: "Furniture Swap",
    badgeClass: "bg-gray-100 text-charcoal border-gray-200",
  },
  "comparison": {
    icon: Layers,
    label: "Comparison",
    badgeClass: "bg-teal-light text-teal border-teal/20",
  },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const { removeProject, updateProject } = useProjectStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const config = TYPE_CONFIG[project.type] || {
    icon: Brain,
    label: "Spatial Twin",
    badgeClass: "bg-indigo-light text-indigo border-indigo/20",
  };

  const IconComponent = config.icon;

  // Handle Delete
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return;
    setIsDeleting(true);
    try {
      const success = await deleteProject(project.id);
      if (success) {
        removeProject(project.id);
      } else {
        alert("Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async () => {
    setIsUpdating(true);
    const newVisibility = !project.isPublic;
    try {
      const success = await updateProjectVisibility(project.id, newVisibility);
      if (success) {
        updateProject(project.id, { isPublic: newVisibility });
      } else {
        alert("Failed to update visibility.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <article
      className={`group relative bg-white rounded-2xl border border-hairline overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300 hover:-translate-y-1 ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* ── CARD HEADER / THUMBNAIL ────────────────────────────────────────── */}
      <div className="relative h-44 w-full bg-gradient-to-br from-indigo-light via-alabaster to-white flex items-center justify-center overflow-hidden border-b border-hairline">
        {/* Spatial grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#5B6AF0 1px, transparent 1px), linear-gradient(90deg, #5B6AF0 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Big centered spatial icon */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-white border border-hairline shadow-sm flex items-center justify-center text-indigo group-hover:scale-110 transition-transform duration-300">
          <IconComponent size={32} />
        </div>

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Link
            href={`/editor/${project.type === "floor-plan" ? "floor-plan" : project.type === "bim-model" ? "bim-lift" : project.type === "ar-scan" ? "ar-map" : project.type === "material-lab" ? "material-lab" : "furniture"}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-charcoal hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200"
          >
            <ExternalLink size={14} />
            <span>Open Editor</span>
          </Link>
          {project.isPublic && (
            <Link
              href={`/community/${project.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo hover:bg-indigoDark text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-200"
            >
              <Eye size={14} />
              <span>Preview</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── CARD BODY ──────────────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.badgeClass}`}
          >
            {config.label}
          </span>
          <span className="font-body text-xs text-muted">
            {formatRelative(project.updatedAt)}
          </span>
        </div>

        <h3 className="font-jakarta text-base font-700 text-charcoal leading-snug line-clamp-1 group-hover:text-indigo transition-colors mb-1.5">
          {project.title}
        </h3>

        <p className="font-body text-xs text-stone leading-relaxed line-clamp-2 min-h-[36px]">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* ── CARD FOOTER ────────────────────────────────────────────────────── */}
      <div className="border-t border-hairline px-5 py-3.5 flex items-center justify-between bg-alabaster/40">
        <div className="flex items-center gap-2.5">
          {/* Owner Avatar */}
          <div className="w-7 h-7 rounded-full bg-indigo text-white font-jakarta text-[11px] font-bold flex items-center justify-center border border-white shadow-sm">
            {getInitials(project.ownerUsername)}
          </div>
          <span className="font-body text-xs font-medium text-stone">
            {project.ownerUsername}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Visibility indicator */}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-stone border border-transparent ${
              isUpdating ? "animate-pulse" : ""
            }`}
            title={project.isPublic ? "Public Project" : "Private Workspace"}
          >
            {project.isPublic ? <Globe size={15} /> : <Lock size={15} />}
          </div>

          {/* Action Menu dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-white hover:border hover:border-hairline transition-all">
                <MoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-white rounded-xl p-1.5 border border-hairline shadow-modal z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                align="end"
              >
                <DropdownMenu.Item
                  onClick={handleToggleVisibility}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-stone hover:text-charcoal hover:bg-gray-50 rounded-lg outline-none cursor-pointer"
                >
                  <Globe size={14} />
                  <span>{project.isPublic ? "Make Private" : "Make Public"}</span>
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/community/${project.id}`
                    );
                    alert("Project link copied to clipboard!");
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-stone hover:text-charcoal hover:bg-gray-50 rounded-lg outline-none cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Copy Share Link</span>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-hairline my-1" />

                <DropdownMenu.Item
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-errorLight rounded-lg outline-none cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Project</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </article>
  );
}
