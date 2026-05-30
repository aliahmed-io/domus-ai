import type { Metadata } from "next";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "My Workspace",
  description: "Manage your spatial twin models, floor plans, and material configurations.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
