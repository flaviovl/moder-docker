import type { NextConfig } from "next";

// Formato de saída escolhido no build: NEXT_OUTPUT=standalone (servidor Node mínimo) ou export (site estático).
const output = ["standalone", "export"].includes(process.env.NEXT_OUTPUT ?? "")
  ? (process.env.NEXT_OUTPUT as NextConfig["output"])
  : undefined;

const nextConfig: NextConfig = {
  output,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
