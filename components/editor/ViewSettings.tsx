"use client";
import { useState } from "react";
import * as Popover from "@radix-ui/react-dialog";
import { useEditorStore } from "@/store/useEditorStore";
import { getXRStore } from "./EditorCanvas";
import StoreySelector from "./StoreySelector";
import SunController from "./SunController";
export default function ViewSettings() {
  const open = useEditorStore((s) => s.viewSettingsOpen),
    setOpen = useEditorStore((s) => s.setViewSettingsOpen);
  const mode = useEditorStore((s) => s.mode),
    setMode = useEditorStore((s) => s.setMode);
  const camera = useEditorStore((s) => s.cameraMode),
    toggleCamera = useEditorStore((s) => s.toggleCameraMode);
  const cutaway = useEditorStore((s) => s.cutawayWalls),
    setCutaway = useEditorStore((s) => s.setCutawayWalls);
  const light = useEditorStore((s) => s.sceneLighting),
    setLight = useEditorStore((s) => s.setSceneLighting);
  const measurements = useEditorStore((s) => s.showMeasurements),
    toggleMeasurements = useEditorStore((s) => s.toggleMeasurements);
  const showGrid = useEditorStore((s) => s.showSceneGrid),
    toggleGrid = useEditorStore((s) => s.toggleSceneGrid);
  const roof = useEditorStore((s) => s.showRoof),
    toggleRoof = useEditorStore((s) => s.toggleRoof);
  const presentation = useEditorStore((s) => s.togglePresentationMode);
  const [xrStatus, setXrStatus] = useState(
    "Headset viewing needs a compatible device and browser.",
  );
  const [busy, setBusy] = useState(false);
  async function enterXR(kind: "immersive-vr" | "immersive-ar") {
    if (busy) return;
    setBusy(true);
    try {
      if (!navigator.xr || !(await navigator.xr.isSessionSupported(kind))) {
        setXrStatus(
          `${kind === "immersive-vr" ? "VR" : "AR"} is not available in this browser. Use a compatible device.`,
        );
        return;
      }
      const session = await (kind === "immersive-vr"
        ? getXRStore().enterVR()
        : getXRStore().enterAR());
      if (!session) throw new Error("No session started");
      if (kind === "immersive-ar") setMode("ar");
      setXrStatus("Headset session active in this browser.");
      session.addEventListener(
        "end",
        () => {
          setXrStatus("Headset session ended.");
          setMode("3d");
        },
        { once: true },
      );
    } catch {
      setXrStatus(
        "The headset session could not start. Check device access and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Popover.Root modal={false} open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="editor-text-button"
          aria-label="View settings"
        >
          View settings
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="editor-view-panel"
          aria-label="View settings panel"
        >
          <header>
            <Popover.Title>View settings</Popover.Title>
            <Popover.Close aria-label="Close view settings">
              Close
            </Popover.Close>
          </header>
          <Popover.Description className="sr-only">
            Camera, lighting, floors, and optional headset tools.
          </Popover.Description>
          <section>
            <h3>Floor</h3>
            <StoreySelector />
          </section>
          <section>
            <h3>Scene</h3>
            <label>
              Lighting
              <select
                value={light}
                onChange={(e) => setLight(e.target.value as "studio" | "sun")}
              >
                <option value="studio">Bright studio</option>
                <option value="sun">Sun and shadows</option>
              </select>
            </label>
            <label>
              Camera
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={`Camera: ${camera === "perspective" ? "Perspective" : "Orthographic"}`}
              >
                {camera === "perspective" ? "Perspective" : "Orthographic"}
              </button>
            </label>
            <label className="editor-check">
              <input
                type="checkbox"
                checked={cutaway}
                onChange={(e) => {
                  setCutaway(e.target.checked);
                  if (e.target.checked && roof) toggleRoof();
                }}
              />
              Lower walls in 3D
            </label>
            <label className="editor-check">
              <input type="checkbox" checked={showGrid} onChange={toggleGrid} />
              Show 3D grid
            </label>
            <label className="editor-check">
              <input
                type="checkbox"
                checked={measurements}
                onChange={toggleMeasurements}
              />
              Wall measurements in 2D
            </label>
            <label className="editor-check">
              <input
                type="checkbox"
                checked={roof}
                onChange={() => {
                  if (!roof) setCutaway(false);
                  toggleRoof();
                }}
              />
              Show roof
            </label>
            <p>
              Lower walls helps you see furniture. It does not change the plan
              dimensions.
            </p>
            {light === "sun" && <SunController />}
          </section>
          <section>
            <h3>Explore</h3>
            <div className="editor-view-actions">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "walk" ? "3d" : "walk");
                  setOpen(false);
                }}
              >
                {mode === "walk" ? "Exit walk" : "Walk through"}
              </button>
              <button
                type="button"
                onClick={() => {
                  presentation();
                  setOpen(false);
                }}
              >
                Presentation
              </button>
            </div>
          </section>
          <details>
            <summary>Headset options</summary>
            <p role="status">{xrStatus}</p>
            <div className="editor-view-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => enterXR("immersive-vr")}
              >
                Start VR session
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => enterXR("immersive-ar")}
              >
                WebXR AR
              </button>
            </div>
          </details>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
