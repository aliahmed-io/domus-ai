import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://domus.ai";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/editor`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/community`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
  ];
}
