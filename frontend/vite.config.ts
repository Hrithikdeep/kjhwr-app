import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all addresses so the dev server is reachable from Docker
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Put the libraries in their own files, apart from our own code. The
        // browser can cache them separately, because they change far less often.
        // React gets its own file, and everything else (mainly the chart
        // library) goes into a second one.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined; // our own code stays in the main file
          }
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
});
