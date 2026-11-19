import type { NextConfig } from "next";

// Formato de saída escolhido no build: NEXT_OUTPUT=standalone (servidor Node mínimo) ou export (site estático).
const output = ["standalone", "export"].includes(process.env.NEXT_OUTPUT ?? "")
  ? (process.env.NEXT_OUTPUT as NextConfig["output"])
  : undefined;

// O export estático não aceita pré-renderização parcial (PPR): Cache Components só fora dele.
const isExport = output === "export";

const nextConfig: NextConfig = {
  output,
  cacheComponents: !isExport,
  partialPrefetching: !isExport,
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
