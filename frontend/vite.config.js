import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // 👈 change this
    strictPort: true, // optional: fail if port is in use
  },
});
