import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react()],
    base: "/web",
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          main: "./index.html",
          system: "./system.html",
          process: "./process.html",
          404: "./404.html",
        },
      },
    },
  });
};
