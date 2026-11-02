"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { } from "lucide-react";
import { createDemoProject } from "@/lib/demo-project";
import { saveProject } from "@/lib/puter";
import { toast } from "sonner";
export default function DemoProjectButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="studio-outline-button demo-project-button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const project = createDemoProject();
        if (!(await saveProject(project))) {
          toast.error(
            "Your browser could not save the sample. Free some storage and try again.",
          );
          setBusy(false);
          return;
        }
        router.push(`/floor-plan?projectId=${encodeURIComponent(project.id)}`);
      }}
    >
      {busy ? "Opening example..." : "Explore a furnished example"}

    </button>
  );
}
