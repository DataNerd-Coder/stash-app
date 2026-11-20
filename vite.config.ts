import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { vercelApiDev } from "./server/dev/vite-api";

export default defineConfig(({ mode }) => {
  // Make server-only env vars (DATABASE_URL, ...) from .env.local available to
  // the api/ functions during `pnpm dev`. Only VITE_* vars ever reach the browser.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    process.env[key] ??= value;
  }

  return {
    plugins: [react(), tailwindcss(), vercelApiDev()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
