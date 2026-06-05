import { useEffect } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { useEditorStore } from "@/store/useEditorStore";
import type { SceneObject } from "@/types/puter";

// Initialize a global Yjs Document
const ydoc = new Y.Doc();
const ySceneObjects = ydoc.getMap<SceneObject>("sceneObjects");

// Connect to WebRTC signaling server (using the public test server or self-hosted)
const provider = new WebrtcProvider("domus-ai-room-alpha", ydoc, {
  signaling: ["wss://signaling.yjs.dev", "wss://y-webrtc-signaling-eu.herokuapp.com"],
});

export function useMultiplayerSync() {
  const { sceneObjects } = useEditorStore();

  useEffect(() => {
    // 1. Listen for remote changes from other clients
    const observeYjs = (event: Y.YMapEvent<SceneObject>) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === "add") {
          const obj = ySceneObjects.get(key);
          if (obj) useEditorStore.getState().addSceneObject(obj);
        } else if (change.action === "update") {
          const obj = ySceneObjects.get(key);
          if (obj) useEditorStore.getState().updateSceneObject(key, obj);
        } else if (change.action === "delete") {
          useEditorStore.getState().removeSceneObject(key);
        }
      });
    };

    ySceneObjects.observe(observeYjs);

    return () => {
      ySceneObjects.unobserve(observeYjs);
    };
  }, []);

  useEffect(() => {
    // 2. Broadcast local changes to other clients
    // (In a real app, you'd want to distinguish local vs remote to avoid infinite loops,
    // but Yjs handles identical updates efficiently).
    sceneObjects.forEach((obj) => {
      const existing = ySceneObjects.get(obj.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(obj)) {
        ySceneObjects.set(obj.id, obj);
      }
    });

    // Handle deletions
    Array.from(ySceneObjects.keys()).forEach((key) => {
      if (!sceneObjects.find((o) => o.id === key)) {
        ySceneObjects.delete(key);
      }
    });
  }, [sceneObjects]);

  return { connected: provider.connected };
}
