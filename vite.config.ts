import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: "dist", // Vite's default output directory
  },
  server: {
    host: "0.0.0.0",
    port: 9999,
    fs: {
      // The `allow` option is now more concise as you don't need to specify client directory
      // since the dev server's root is the project root by default
      allow: ["."],
    },
  },
});
