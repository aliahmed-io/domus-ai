import type { NextConfig } from "next";
import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  reactCompiler: false,

  experimental: {
    webpackBuildWorker: true,
  },

  turbopack: {},

  webpack: (config, { isServer }) => {
    // Enable async WebAssembly for IFC WASM parsing
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Prevent SSR bundling of browser-only 3D / WASM libs
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...externals,
        "@thatopen/components",
        "@thatopen/fragments",
        "web-ifc",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
        "@react-three/xr",
      ];
    }

    // Resolve WASM files correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };

    // Handle .wasm file imports
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    return config;
  },

  // Transpile packages that ship ESM-only or need special handling
  transpilePackages: [
    "@thatopen/components",
    "@thatopen/fragments",
    "web-ifc",
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.puter.site" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.puter.site" },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), xr-spatial-tracking=(self)",
          },
        ],
      },
      {
        // WASM files need correct MIME + COOP/COEP for SharedArrayBuffer
        source: "/wasm/:path*",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

const analyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default analyzer(nextConfig);
