import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import EnvironmentPlugin from "vite-plugin-environment";

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [react(), EnvironmentPlugin("all")],
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
