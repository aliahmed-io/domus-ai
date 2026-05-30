'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PuterProject } from '@/types/puter';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface ProjectState {
  // ── Data ──────────────────────────────────────────────────────────────────
  projects: PuterProject[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setProjects(projects: PuterProject[]): void;
  addProject(project: PuterProject): void;
  updateProject(id: string, updates: Partial<PuterProject>): void;
  removeProject(id: string): void;
  setSelectedProject(id: string | null): void;
  setLoading(isLoading: boolean): void;
  setError(error: string | null): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>()(
  immer((set) => ({
    // ── Initial State ────────────────────────────────────────────────────────
    projects: [],
    selectedProjectId: null,
    isLoading: false,
    error: null,

    // ── Actions ──────────────────────────────────────────────────────────────

    setProjects(projects) {
      set((state) => {
        state.projects = projects;
      });
    },

    addProject(project) {
      set((state) => {
        // Guard against duplicates by id
        const exists = state.projects.some((p) => p.id === project.id);
        if (!exists) {
          state.projects.push(project);
        }
      });
    },

    updateProject(id, updates) {
      set((state) => {
        const index = state.projects.findIndex((p) => p.id === id);
        if (index !== -1) {
          // Immer allows direct mutation here — cast is safe because immer drafts
          // make the inner object mutable while preserving structural typing.
          Object.assign(state.projects[index] as PuterProject, updates);
        }
      });
    },

    removeProject(id) {
      set((state) => {
        state.projects = state.projects.filter((p) => p.id !== id);
        // Clear selection if the removed project was selected
        if (state.selectedProjectId === id) {
          state.selectedProjectId = null;
        }
      });
    },

    setSelectedProject(id) {
      set((state) => {
        state.selectedProjectId = id;
      });
    },

    setLoading(isLoading) {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setError(error) {
      set((state) => {
        state.error = error;
      });
    },
  })),
);
