import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * Webview build for the VSCode extension. Same app as the browser build,
 * but:
 * - output goes into the extension's media folder;
 * - `base: "./"` so assets resolve relative to the vscode-webview URI;
 * - stable file names (no content hashes) so the extension host can
 *   reference `assets/index.js` / `assets/index.css` in its generated HTML.
 *
 * The emitted index.html is unused — the host builds its own HTML with a
 * CSP nonce (see vscode-extension/src/extension.ts).
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "vscode-extension/media/webview",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
