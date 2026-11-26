import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Permite apuntar a una API de pruebas aislada sin cambiar el destino local habitual.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": loadEnv(mode, ".", "VITE_").VITE_API_TARGET || "http://localhost:8080",
    },
  },
}));
