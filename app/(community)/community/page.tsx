import type { Metadata } from "next";
import FeedGrid from "@/components/community/FeedGrid";

export const metadata: Metadata = {
  title: "Community Discovery Hub",
  description: "Browse spatial models and architectural floor plans shared by designers worldwide.",
};

export default function CommunityPage() {
  return <FeedGrid />;
}
