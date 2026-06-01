import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://domus.ai"),
  title: {
    default: "Domus — Unified Spatial Intelligence Platform",
    template: "%s | Domus",
  },
  description:
    "From AI floor plans to photorealistic WebXR walkthroughs — Domus is the complete spatial intelligence platform for the future of architecture and interior design.",
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
    title: "Domus — Unified Spatial Intelligence Platform",
    description:
      "Design spaces that transcend reality. AI floor plans, BIM processing, WebXR room scanning, and generative materials in one platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Domus — Spatial Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Domus — Unified Spatial Intelligence Platform",
    description: "Design spaces that transcend reality.",
    images: ["/og-image.png"],
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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${jakarta.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <head>
        {/* Puter.js SDK — loaded client-side only */}
        <script src="https://js.puter.com/v2/" async defer />
      </head>
      <body className="min-h-full flex flex-col bg-alabaster text-charcoal font-body">
        <a href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-charcoal focus:text-white focus:rounded-lg">
          Skip to content
        </a>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster richColors theme="light" position="bottom-right" />
      </body>
    </html>
  );
}
