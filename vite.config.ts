import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Asegurar que las URLs tengan el formato correcto
  const apiUrl = env.VITE_API_URL || "http://localhost:3000/api";
  const socketUrl = env.VITE_SOCKET_URL || "http://localhost:3000";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/socket.io": {
          target: socketUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              // React y sus dependencias
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router-dom")
              ) {
                return "vendor-react";
              }
              // dnd-kit
              if (id.includes("@dnd-kit")) {
                return "vendor-dnd";
              }
              // Socket.io
              if (id.includes("socket.io-client")) {
                return "vendor-socket";
              }
              // UI libraries
              if (
                id.includes("lucide-react") ||
                id.includes("clsx") ||
                id.includes("date-fns")
              ) {
                return "vendor-ui";
              }
              // Todo lo demás
              return "vendor";
            }
          },
        },
      },
      // Aumentar el límite de advertencia para chunks grandes
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "socket.io-client",
        "axios",
        "react-hot-toast",
        "@dnd-kit/core",
        "@dnd-kit/sortable",
        "@dnd-kit/utilities",
      ],
      exclude: ["@tailwindcss/postcss"], // Excluir dependencias de build
    },
    // Configuración para producción
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
      "import.meta.env.VITE_SOCKET_URL": JSON.stringify(socketUrl),
    },
  };
});
