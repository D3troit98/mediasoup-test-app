import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/', // Adjust this if your app is served from a subpath
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
