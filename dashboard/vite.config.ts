import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/web",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
        system: "./system.html",
        process: "./process.html",
      },
    },
  },
});
