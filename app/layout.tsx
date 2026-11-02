import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://domus.ai"),
  title: {
    default: "Domus design workshop",
    template: "%s | Domus",
  },
  description:
    "Plan rooms, explore materials, and make a space your own in the open Domus workshop.",
  keywords: [
    "floor plan generator",
    "BIM software",
    "WebXR architecture",
    "3D room scanner",
    "AI interior design",
    "spatial intelligence",
    "IFC viewer",
  ],
  authors: [{ name: "Ali Ahmed" }],
  creator: "Ali Ahmed",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://domus.ai",
    siteName: "Domus",
    title: "Domus design workshop",
    description:
      "Design spaces that transcend reality. AI floor plans, BIM processing, WebXR room scanning, and generative materials in one platform.",
    images: [
      {
        url: "/oak_residence.png",
        width: 1024,
        height: 1024,
        alt: "Domus — Spatial Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Domus design workshop",
    description: "Design spaces that transcend reality.",
    images: ["/oak_residence.png"],
    creator: "domus_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-alabaster text-charcoal font-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-charcoal focus:text-white focus:rounded-lg"
        >
          Skip to content
        </a>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster
          richColors
          closeButton
          duration={3000}
          theme="light"
          position="top-center"
        />
      </body>
    </html>
  );
}
