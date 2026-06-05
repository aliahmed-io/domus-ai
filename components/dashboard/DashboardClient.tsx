"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  Brain,
  Layers,
  Scan,
  FolderOpen,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { useAuthStore } from "@/store/useAuthStore";
import { listProjects, getUser, signOut } from "@/lib/puter";
import ProjectCard from "./ProjectCard";
import type { ProjectType } from "@/types/puter";

export default function DashboardClient() {
  const router = useRouter();
  const { projects, setProjects, isLoading, setLoading } = useProjectStore();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"all" | ProjectType>("all");

  // Fetch projects and auth details on mount
  useEffect(() => {
    async function initDashboard() {
      setLoading(true);
      try {
        const [userData, projectList] = await Promise.all([
          getUser(),
          listProjects(),
        ]);
        if (userData) {
          setUser(userData);
        }
        setProjects(projectList);
      } catch (err) {
        console.error("Failed to initialize dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [setProjects, setUser, setLoading]);

  // Handle Logout
  const handleLogout = async () => {
    await signOut();
    // Delete local cookie if set, and redirect
    document.cookie = "puter_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setUser(null);
    router.push("/login");
  };

  // Filter projects by activeTab
  const filteredProjects = projects.filter((p) => {
    if (activeTab === "all") return true;
    return p.type === activeTab;
  });

  // Calculate Stats
  const totalProjects = projects.length;
  const bimModelsCount = projects.filter((p) => p.type === "bim-model").length;
  const arScansCount = projects.filter((p) => p.type === "ar-scan").length;
  const floorPlansCount = projects.filter((p) => p.type === "floor-plan").length;

  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-8 bg-alabaster">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-1.5">
            <LayoutDashboard size={12} className="text-indigo" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="font-jakarta text-heading-xl font-800 text-charcoal tracking-tight">
            Welcome Back{user ? `, ${user.username}` : ""}
          </h1>
          <p className="font-body text-sm text-stone mt-0.5">
            Create, manage, and render your unified spatial intelligence environments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="btn-primary flex items-center gap-2 shadow-button text-sm py-2.5 px-5 font-semibold bg-indigo text-white rounded-lg hover:bg-indigoDark transition-colors"
          >
            <Plus size={16} />
            <span>New Project</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 rounded-lg border border-hairline text-stone hover:text-charcoal hover:bg-white transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── STATS ROW ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Projects", value: totalProjects, icon: FolderOpen, tint: "text-indigo bg-indigo-light" },
          { label: "AI Floor Plans", value: floorPlansCount, icon: Brain, tint: "text-indigo bg-indigo-light" },
          { label: "BIM Lifters", value: bimModelsCount, icon: Layers, tint: "text-teal bg-teal-light" },
          { label: "AR Scans", value: arScansCount, icon: Scan, tint: "text-gold bg-gold-light" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-5 border border-hairline shadow-card flex items-center gap-4 transition-all duration-300 hover:shadow-cardHover hover:-translate-y-0.5"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.tint}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="font-body text-xs font-semibold text-stone uppercase tracking-wider">{stat.label}</p>
              <h3 className="font-jakarta text-heading-md font-800 text-charcoal mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* ── FILTER BAR ────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Projects" },
            { id: "floor-plan", label: "Floor Plans" },
            { id: "bim-model", label: "BIM Models" },
            { id: "ar-scan", label: "AR Scans" },
            { id: "material-lab", label: "Material Labs" },
            { id: "furniture", label: "Furniture swaps" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | ProjectType)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-indigo text-white shadow-sm"
                  : "bg-white text-stone border border-hairline hover:bg-gray-50 hover:text-charcoal"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-stone">
          <TrendingUp size={14} className="text-teal" />
          <span>Active Session • Cloud Sync ON</span>
        </div>
      </section>

      {/* ── PROJECT GRID ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-hairline h-[360px] animate-pulse overflow-hidden">
              <div className="h-44 bg-gray-100" />
              <div className="p-5 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-100 rounded w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white border border-dashed border-hairline rounded-2xl p-8 max-w-xl mx-auto w-full text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-light text-indigo flex items-center justify-center mb-5">
            <FolderOpen size={28} />
          </div>
          <h3 className="font-jakarta text-heading-sm font-700 text-charcoal mb-2">
            No projects found
          </h3>
          <p className="font-body text-sm text-stone max-w-xs mb-6">
            {activeTab === "all"
              ? "You haven't created any spatial digital twins yet. Start designing now!"
              : `You don't have any projects categorized under ${activeTab}.`}
          </p>
          <Link
            href="/editor"
            className="btn-primary inline-flex items-center gap-2 shadow-button text-sm py-2.5 px-6 font-semibold bg-indigo text-white rounded-lg hover:bg-indigoDark transition-colors"
          >
            <Plus size={16} />
            <span>Create First Project</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
