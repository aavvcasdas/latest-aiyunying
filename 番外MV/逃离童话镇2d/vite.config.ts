import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  // 预览/隧道环境用外部域名访问：放行任意 Host（仅开发服务器，不影响 build 产物）
  server: { host: true, allowedHosts: true, port: 5288, strictPort: false },
  preview: { host: true, allowedHosts: true, port: 5288, strictPort: false },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
