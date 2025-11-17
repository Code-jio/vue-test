import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'serve-service-worker',
      configureServer(server) {
        // 为Service Worker文件提供自定义中间件
        server.middlewares.use('/network-interceptor-sw.js', (req, res, next) => {
          const swPath = path.resolve(__dirname, './public/engine/public/network-interceptor-sw.js');

          if (fs.existsSync(swPath)) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache');
            fs.createReadStream(swPath).pipe(res);
          } else {
            res.statusCode = 404;
            res.end('Service Worker file not found');
          }
        });
      }
    },
    viteStaticCopy({
      targets: [
        {
          src: "public/static/**/*",
          dest: "static",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: false,
    port: 5173,
    open: true,
    cors: true,
  },
});
