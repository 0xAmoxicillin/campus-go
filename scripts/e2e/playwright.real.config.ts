// ---------------------------------------------------------------------------
// Playwright 配置 · 真实服务模式（M2）
//
// 与 M1 的 playwright.config.ts（契约结构回归 / page.route 拦截层）分开：
//   - contract : `pnpm run test:e2e:contract`，不依赖任何服务，任何分支可跑。
//   - real     : `pnpm run test:e2e:real`，打真实运行的 PG16 + NestJS + Vite。
//
// 真实服务的启动方式有两种（都要求先按 README「本地启动与验证」准备好环境）：
//   (a) 本地：先手动起 docker compose / migrate / seed / server / web，再跑本配置；
//       reuseExistingServer=true 会复用已启动的服务，不重复拉起。
//   (b) 本地一键：设置 E2E_START_SERVICES=1，本配置用 webServer 自动拉起 server 与 web
//       （PG 仍需事先 `docker compose up -d` + migrate + seed）。
//   (c) CI：ci.yml 的 e2e-real job 用 postgres service 容器 + 前置步骤注入环境变量，
//       再后台启动 server/web，本配置同样复用（reuseExistingServer=true）。
//
// 若服务未起且未设置 E2E_START_SERVICES，Playwright 报端口不可达而失败——**不会**
// 用拦截层伪装通过。真实服务 E2E 需要的是真实联通，不是绿色假象。
// ---------------------------------------------------------------------------

import { defineConfig } from '@playwright/test';
import { API_BASE, ENTRY_URL } from './fixtures/real-env';

const startServices = process.env.E2E_START_SERVICES === '1';

/** 真实服务用例（不含 M1 拦截层 spec）。 */
const specs = ['**/real-service.spec.ts'];

export default defineConfig({
  testDir: './specs',
  testMatch: specs,
  // 真实服务共用同一个数据库，串行避免并发互相踩数据。
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report-real', open: 'never' }]]
    : 'list',
  use: {
    baseURL: ENTRY_URL,
    // APIRequestContext 用绝对 URL（API_BASE），不依赖 baseURL。
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // 仅在 E2E_START_SERVICES=1 时由 Playwright 拉起服务；CI/本地手动启动则复用。
  webServer: startServices
    ? [
        {
          command: 'pnpm --filter @campus-go/server run start',
          url: `${API_BASE}/activities`,
          reuseExistingServer: true,
          timeout: 180_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        {
          command: 'pnpm --filter @campus-go/web run dev -- --host 127.0.0.1',
          url: ENTRY_URL,
          reuseExistingServer: true,
          timeout: 180_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      ]
    : undefined,
});
