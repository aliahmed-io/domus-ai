"use client";
import { useCallback, useEffect, useRef } from "react";
import { requestModel, type ModelRequest } from "./model-client";
import { useEditorStore } from "@/store/useEditorStore";
export function useModelRequest() {
  const pending = useRef<AbortController | null>(null);
  const projectId = useEditorStore((state) => state.projectId);
  useEffect(() => () => pending.current?.abort(), [projectId]);
  return useCallback(
    async (input: ModelRequest, onStatus?: (message: string) => void) => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      const startingProject = useEditorStore.getState().projectId;
      const result = await requestModel(input, {
        signal: controller.signal,
        ...(onStatus ? { onStatus } : {}),
      });
      controller.signal.throwIfAborted();
      if (useEditorStore.getState().projectId !== startingProject)
        throw new DOMException("Project changed.", "AbortError");
      return result;
    },
    [],
  );
}
