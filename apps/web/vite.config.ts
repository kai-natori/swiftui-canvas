import { fileURLToPath } from "node:url";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.APP_BASE_PATH ?? "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tanstackStart({
      // SPA mode with a statically prerendered shell: no server
      // functions, no server loaders. The production artifact is the
      // static client output (dist/client) — see design.md D2.
      spa: { enabled: true },
    }),
    viteReact(),
  ],
});
