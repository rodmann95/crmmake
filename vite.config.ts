import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import createHtmlPlugin from "vite-plugin-simple-html";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };

  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        open: process.env.NODE_ENV !== "CI",
        filename: "./dist/stats.html",
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            mainScript: `src/main.tsx`,
          },
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        },
        manifest: false, // Use existing manifest.json from public/
      }),
    ],
    define: {
      "import.meta.env.VITE_IS_DEMO": JSON.stringify(env.VITE_IS_DEMO),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SB_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SB_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SB_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY),
      "import.meta.env.VITE_INBOUND_EMAIL": JSON.stringify(env.VITE_INBOUND_EMAIL),
      "import.meta.env.VITE_ATTACHMENTS_BUCKET": JSON.stringify(env.VITE_ATTACHMENTS_BUCKET),
    },
    base: "./",
    esbuild: {
      keepNames: true,
    },
    build: {
      sourcemap: true,
    },
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
