"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Heart,
  Eye,
  TrendingUp,
  Award,
  Hash,
  FolderOpen,
} from "lucide-react";
import { listCommunityProjects } from "@/lib/puter";
import type { PuterProject } from "@/types/puter";

export default function FeedGrid() {
  const [projects, setProjects] = useState<PuterProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      try {
        const feed = await listCommunityProjects();
        setProjects(feed);
      } catch (err) {
        console.error("Failed to load community feed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeed();
  }, []);

  // Creator mock data
  const trendingItems = [
    { rank: "01", title: "Helix Residential Tower", creator: "@zaha_fans", views: "2.4k" },
    { rank: "02", title: "Sustainable Timber Loft", creator: "@forestBIM", views: "1.9k" },
    { rank: "03", title: "Minimalist Studio 12", creator: "@mikaelarch", views: "1.5k" },
    { rank: "04", title: "The Oak Residence", creator: "@sofiadesigns", views: "1.2k" },
    { rank: "05", title: "Glasshouse Pavillion", creator: "@k_spatial", views: "980" },
  ];

  const topCreators = [
    { name: "Sofia Gonzalez", handle: "@sofiadesigns", count: "1.4k followers" },
    { name: "Mikael Lindqvist", handle: "@mikaelarch", count: "920 followers" },
    { name: "BIM Studio Pro", handle: "@forestBIM", count: "810 followers" },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row gap-8 p-6 md:p-8 bg-alabaster">
      {/* Primary Discovery Grid */}
      <div className="flex-1 min-w-0">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-1.5">
            <Globe size={12} className="text-indigo" />
            <span>Discover Community</span>
          </div>
          <h1 className="font-jakarta text-heading-xl font-800 text-charcoal tracking-tight">
            Spatial Discovery Feed
          </h1>
          <p className="font-body text-sm text-stone mt-0.5">
            Browse, inspect, and fork production-ready digital twins created by the global design community.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-hairline h-[320px] animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-hairline rounded-2xl p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-indigo-light text-indigo flex items-center justify-center mb-5">
              <FolderOpen size={24} />
            </div>
            <h3 className="font-jakarta text-heading-sm font-700 text-charcoal mb-2">
              Discovery Feed Empty
            </h3>
            <p className="font-body text-xs text-stone max-w-xs mb-6">
              Be the first to share an architectural digital twin! Publish one of your workspace models to showcase it here.
            </p>
            <Link
              href="/dashboard"
              className="btn-primary text-xs font-semibold py-2.5 px-6 bg-indigo text-white rounded-lg hover:bg-indigoDark transition-colors"
            >
              Go to Workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <article
                key={project.id}
                className="group bg-white rounded-2xl border border-hairline overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card visual gradient cover */}
                  <div className="h-40 w-full bg-gradient-to-br from-indigo-light via-alabaster to-white flex items-center justify-center relative border-b border-hairline">
                    <span className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-indigo bg-white border border-hairline px-3 py-1 rounded-full shadow-sm">
                      {project.type.replace("-", " ")}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-jakarta text-base font-700 text-charcoal line-clamp-1 group-hover:text-indigo transition-colors mb-1.5">
                      {project.title}
                    </h3>
                    <p className="font-body text-xs text-stone leading-relaxed line-clamp-2 min-h-[36px]">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-hairline bg-alabaster/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo text-white text-[10px] font-bold flex items-center justify-center uppercase">
                      {project.ownerUsername.slice(0, 2)}
                    </div>
                    <span className="font-body text-xs font-semibold text-charcoal">
                      {project.ownerUsername}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-stone text-[11px] font-mono font-bold">
                    <span className="flex items-center gap-1">
                      <Heart size={13} className="text-error" />
                      <span>{project.stats.likes}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={13} className="text-stone" />
                      <span>{project.stats.views}</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Right side stats feed columns (320px) */}
      <aside className="w-full lg:w-80 shrink-0 space-y-6">
        {/* Trending Column */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-card space-y-4">
          <h3 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-widest flex items-center gap-2 border-b border-hairline pb-3">
            <TrendingUp size={14} className="text-indigo" />
            <span>Trending This Week</span>
          </h3>

          <div className="space-y-3">
            {trendingItems.map((item, idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <span className="font-jakarta text-heading-xs font-800 text-indigo/25">
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-jakarta text-xs font-bold text-charcoal truncate hover:text-indigo cursor-pointer transition-colors">
                    {item.title}
                  </h4>
                  <p className="font-body text-[10px] text-stone">
                    by {item.creator} • {item.views} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Creators Column */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-card space-y-4">
          <h3 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-widest flex items-center gap-2 border-b border-hairline pb-3">
            <Award size={14} className="text-teal" />
            <span>Top Spatial Artists</span>
          </h3>

          <div className="space-y-3">
            {topCreators.map((creator, idx) => (
              <div key={idx} className="flex justify-between items-center gap-3">
                <div>
                  <h4 className="font-jakarta text-xs font-bold text-charcoal">
                    {creator.name}
                  </h4>
                  <p className="font-body text-[10px] text-stone mt-0.5">
                    {creator.handle} • {creator.count}
                  </p>
                </div>
                <button className="text-[10px] font-bold text-indigo hover:text-indigoDark border border-indigo/20 px-3 py-1 rounded-lg hover:bg-indigo-light transition-all outline-none">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Browse tags */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-card space-y-4">
          <h3 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-widest flex items-center gap-2 border-b border-hairline pb-3">
            <Hash size={14} className="text-gold" />
            <span>Popular Tags</span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {["BIM Models", "Generative", "LiDAR Scans", "WebXR CAD", "Cost Sheets", "IFC Export", "Topologies"].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-alabaster hover:bg-gray-100 border border-hairline text-[9px] font-bold uppercase tracking-wider text-stone hover:text-charcoal rounded-lg cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
