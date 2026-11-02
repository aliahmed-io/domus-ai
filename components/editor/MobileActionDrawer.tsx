"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useEditorStore } from "@/store/useEditorStore";
import ParameterPanel from "./FloorPlanEngine/ParameterPanel";
export default function MobileActionDrawer() {
  const workspace = useEditorStore((s) => s.workspace);
  if (workspace !== "generative") return null;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="mobile-layout-trigger" type="button">
          Layout requirements
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content className="mobile-layout-panel">
          <header>
            <Dialog.Title>Layout requirements</Dialog.Title>
            <Dialog.Close>Close</Dialog.Close>
          </header>
          <Dialog.Description className="sr-only">
            Set room counts, size, and furniture preferences before creating a
            starting layout.
          </Dialog.Description>
          <div>
            <ParameterPanel />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
