/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// M1：前端独立包，不依赖根 pnpm-workspace（根 workspace 由全栈负责，M1 分支上不存在）。
// 运行本包脚本请进入 apps/web/ 目录后执行 pnpm install / pnpm <script>。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // 契约测试针对 mock adapter 形态；真实后端不在测试环境，故固定走 mock。
    // 默认运行（无 VITE_USE_MOCK）仍走真实 HTTP（见 apiClient.ts），此处仅覆盖契约测试。
    env: { VITE_USE_MOCK: 'true' },
  },
});
