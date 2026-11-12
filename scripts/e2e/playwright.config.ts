// ---------------------------------------------------------------------------
// Playwright 配置（M1 E2E 骨架）
//
// M1 无真实后端 / 无真实前端页面：每个用例在 about:blank 上通过
// page.route / route.fulfill 拦截 /api/** 喂入契约 fixture，因此不配置 webServer，
// 也不需要 `playwright install` 之外的任何服务即可全绿。
//
// TODO(M3): 接入真实服务后，配置 webServer（server + web）与 baseURL，
//           删除拦截层，改打真实端点做端到端回归。
// ---------------------------------------------------------------------------

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  // 只跑 M1 契约结构回归（拦截层）；真实服务用例由 playwright.real.config.ts 单独跑。
  testMatch: ['auth-flow.spec.ts', 'rbac.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  use: {
    // 用 Playwright 自带的 chromium build（本机已缓存 revision 1243）；
    // 不设置 channel，避免去找系统安装的 Google Chrome。
    // CI 里由 `pnpm exec playwright install --with-deps chromium` 准备同版浏览器。
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
