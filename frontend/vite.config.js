import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/events":  "http://localhost:8000",
      "/chunks":  "http://localhost:8000",
      "/explain": "http://localhost:8000",
      "/inject":  "http://localhost:8000",
    },
  },
});
