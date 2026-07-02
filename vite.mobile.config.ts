// Static SPA build for Capacitor Android. Outputs to /dist without SSR/Nitro.
// Do NOT use for the web deployment — the web build stays on vite.config.ts (SSR).
//
// Usage: `bun run build:mobile`  →  `npx cap sync android`
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  define: {
    // Router runs in browser history mode; strip any SSR-only branches.
    "import.meta.env.SSR": "false",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
});
