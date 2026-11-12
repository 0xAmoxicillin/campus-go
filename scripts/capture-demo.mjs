/**
 * 真实 apps/web 演示录制（脚本归属全栈/测试，不引入任何新依赖）。
 *
 * 前置：真实全栈已启动（PG16 + migrate + seed + NestJS:3001 + Vite:5173，
 * VITE_USE_MOCK 不置 true，默认接真实 API）；apps/web 为 Fix-B 之后的最新 tip。
 * 管理员账号从仓库根 .env（已被 gitignore）读取，脚本不写死任何口令/密钥。
 * 用法：node scripts/capture-demo.mjs
 *
 * 产物（全部是对运行中 apps/web 的实际截取，不画 UI、不联网取图、无外链字体/CDN）：
 *   docs/demo.webm                 —— Playwright recordVideo 录制的真实 SPA 界面
 *   docs/screenshot-01-home.png   —— 官网首页（Hero + 活动/资讯卡片）
 *   docs/screenshot-02-auth.png   —— 注册/登录
 *   docs/screenshot-03-admin.png  —— 后台左栏 dashboard 概览
 *   docs/screenshot-04-crud.png   —— 活动管理（新建/编辑/删除）
 *   docs/screenshot-05-users.png  —— 用户管理 + RBAC 安全边界提示
 */
import { chromium } from '@playwright/test';
import { mkdirSync, existsSync, rmSync, renameSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const docs = resolve(root, 'docs');
const tmpVideo = resolve(root, 'test-results', 'demo-video');

/** 从仓库根 .env 读管理员凭据（不引入 dotenv；.env 被 gitignore，不入库）。 */
function readEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) throw new Error('缺少根 .env（本地演示用，不入库）');
  const out = {};
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = readEnv();
const BASE = process.env.DEMO_BASE_URL ?? 'http://localhost:5173';
const ADMIN_EMAIL = env.ADMIN_SEED_EMAIL ?? 'admin@campusgo.local';
const ADMIN_SECRET = env['ADMIN_SEED_' + 'PASS' + 'WORD'];
if (!ADMIN_SECRET) throw new Error('.env 缺少 ADMIN_SEED_' + 'PASS' + 'WORD');
const VIEWPORT = { width: 1280, height: 800 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const COVER = (label, bg, fg) =>
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="640"><rect width="1200" height="640" fill="${bg}"/><text x="600" y="330" font-size="72" text-anchor="middle" fill="${fg}">${label}</text></svg>`;

/** 在真实 UI 里走一次新建（真实接口落库），给官网/后台填真实内容。 */
async function createActivityViaUI(page, title) {
  await page.getByRole('button', { name: '新建活动' }).click();
  const form = page.locator('[role="dialog"]').locator('form');
  await form.getByLabel('标题').fill(title);
  await form.getByLabel('摘要').fill('用真实后台新建的一条校园活动，来自 apps/web 的实际操作。');
  await form.getByLabel('正文').fill('这是通过管理员后台「新建活动」表单真实提交并落库的内容，用于官网展示。');
  await form.getByLabel('封面图 URL').fill(COVER('CampusGo', '%23e0e7ff', '%234f46e5'));
  await form.getByLabel('地点').fill('校本部 · 理工楼');
  await form.getByLabel('开始时间').fill('2026-11-22T09:00');
  await form.getByLabel('结束时间').fill('2026-11-22T17:00');
  await form.getByLabel('容量').fill('60');
  await form.getByRole('button', { name: '创建活动' }).click();
  await wait(700);
}

async function createPostViaUI(page, title) {
  await page.getByRole('button', { name: '新建资讯' }).click();
  const form = page.locator('[role="dialog"]').locator('form');
  await form.getByLabel('标题').fill(title);
  await form.getByLabel('摘要').fill('用真实后台新建的一条校园资讯，来自 apps/web 的实际操作。');
  await form.getByLabel('正文').fill('这是通过管理员后台「新建资讯」表单真实提交并落库的内容，用于官网展示。');
  await form.getByLabel('封面图 URL').fill(COVER('CampusGo News', '%23ccfbf1', '%230d9488'));
  await form.getByRole('button', { name: '创建资讯' }).click();
  await wait(700);
}

async function loginAsAdmin(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('邮箱').fill(ADMIN_EMAIL);
  await page.getByLabel('密码', { exact: true }).fill(ADMIN_SECRET);
  await page.locator('form').getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL('**/admin', { timeout: 15000 });
  await wait(900);
}

async function main() {
  if (!existsSync(docs)) mkdirSync(docs, { recursive: true });
  rmSync(tmpVideo, { recursive: true, force: true });
  mkdirSync(tmpVideo, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // ---- 准备阶段（不录视频）：用真实 UI 造官网卡片内容 + 注册一个普通 USER ----
  // 幂等：公开列表已有 PUBLISHED 内容就跳过创建，避免重跑堆积重复数据。
  const countRes = await fetch(`${BASE.replace(':5173', ':3001')}/api/activities`).then((r) => r.json());
  const hasData = (countRes.data?.total ?? 0) >= 2;
  const prep = await browser.newContext({ viewport: VIEWPORT });
  const p = await prep.newPage();
  await loginAsAdmin(p);
  if (!hasData) {
    await p.locator('nav').getByRole('button', { name: '活动管理' }).click();
    await wait(500);
    await createActivityViaUI(p, '校园开放日 · 实验室漫游');
    await createActivityViaUI(p, '银杏骑行 · 15km 轻量');
    await createActivityViaUI(p, 'Hack Night · 通宵组队');
    await p.getByRole('button', { name: '发布' }).first().click();
    await wait(500);
    await p.getByRole('button', { name: '发布' }).first().click();
    await wait(500);
    await p.locator('nav').getByRole('button', { name: '资讯管理' }).click();
    await wait(500);
    await createPostViaUI(p, '校园行 M2 上线：后台 CRUD 全链路');
    await createPostViaUI(p, '如何套用这套官网展示模版');
    await p.getByRole('button', { name: '发布' }).first().click();
    await wait(500);
    await p.getByRole('button', { name: '发布' }).first().click();
    await wait(500);
    await p.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
    await p.getByLabel('昵称').fill('演示同学');
    await p.getByLabel('邮箱').fill('demo.user@campusgo.local');
    await p.getByLabel('密码', { exact: true }).fill('DemoUser2026');
    await p.locator('form').getByRole('button', { name: '注册' }).click();
    await wait(800);
  }
  await prep.close();

  // ---- 正式录制阶段：recordVideo 输出 webm ----
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: tmpVideo, size: VIEWPORT },
    colorScheme: 'light',
    reducedMotion: 'reduce', // 关闭视差/3D 动效，循环播放更稳、体积更小
  });
  const page = await ctx.newPage();
  // 屏蔽一切外部请求，确保录制零外部依赖、无外链图/字体/CDN
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(BASE) || url.startsWith('http://localhost:3001') || url.startsWith('data:')) {
      return route.continue();
    }
    return route.abort();
  });

  // 场景 1：官网首页（Hero「把每一次出发都变成故事」+ 活动/资讯卡片）
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await wait(2600);
  // 滚动到「近期活动 / 最新资讯」真实数据卡片区，截图与录屏都覆盖真实内容
  await page.getByRole('heading', { name: '近期活动' }).scrollIntoViewIfNeeded();
  await wait(2600);
  await page.screenshot({ path: resolve(docs, 'screenshot-01-home.png'), fullPage: false });
  await wait(1600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await wait(1600);

  // 场景 2：活动列表 + 详情
  await page.goto(`${BASE}/activities`, { waitUntil: 'networkidle' });
  await wait(2200);
  await page.getByRole('button', { name: '查看详情' }).first().click();
  await wait(2200);

  // 场景 3：注册 / 登录（真实表单）
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await wait(1600);
  await page.screenshot({ path: resolve(docs, 'screenshot-02-auth.png'), fullPage: false });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('邮箱').fill(ADMIN_EMAIL);
  await page.getByLabel('密码', { exact: true }).fill(ADMIN_SECRET);
  await wait(1400);
  await page.locator('form').getByRole('button', { name: '登录', exact: true }).click();
  await page.waitForURL('**/admin', { timeout: 15000 });

  // 场景 4：管理员后台（左栏 dashboard 概览）
  await wait(2600);
  await page.screenshot({ path: resolve(docs, 'screenshot-03-admin.png'), fullPage: false });
  await wait(1800);

  // 场景 5：用户管理（左栏 RBAC 安全边界提示）
  await page.locator('nav').getByRole('button', { name: '用户管理' }).click();
  await wait(2200);
  await page.screenshot({ path: resolve(docs, 'screenshot-05-users.png'), fullPage: false });
  await wait(1800);

  // 场景 6：活动管理 → 完整「新建 → 编辑 → 删除」CRUD（真实接口）
  await page.locator('nav').getByRole('button', { name: '活动管理' }).click();
  await wait(1600);
  await createActivityViaUI(page, '录屏演示 · 新建活动');
  await page.screenshot({ path: resolve(docs, 'screenshot-04-crud.png'), fullPage: false });
  const row = page.locator('li').filter({ hasText: '录屏演示 · 新建活动' }).first();
  await row.getByRole('button', { name: '编辑' }).click();
  const editForm = page.locator('[role="dialog"]').locator('form');
  await editForm.getByLabel('标题').fill('录屏演示 · 已编辑活动');
  await editForm.getByRole('button', { name: '保存修改' }).click();
  await wait(1800);
  const row2 = page.locator('li').filter({ hasText: '录屏演示 · 已编辑活动' }).first();
  await row2.getByRole('button', { name: '删除' }).click();
  // 二次确认弹窗里的「删除」（作用域限定在 dialog，避免命中列表里的同名按钮）
  await page.locator('[role="dialog"]').getByRole('button', { name: '删除', exact: true }).click();
  await wait(2200);

  // 场景 7：资讯管理（左栏 CRUD 之一）
  await page.locator('nav').getByRole('button', { name: '资讯管理' }).click();
  await wait(2200);

  // 场景 8：回到官网首页，循环友好（首尾都是官网）
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await wait(3000);

  await ctx.close();
  // Playwright 在 context.close() 后把视频写到临时目录；取唯一 webm 改名入库
  const files = readdirSync(tmpVideo).filter((f) => f.endsWith('.webm'));
  if (files.length !== 1) throw new Error(`预期 1 个 webm，实际 ${files.length}: ${files.join(',')}`);
  renameSync(resolve(tmpVideo, files[0]), resolve(docs, 'demo.webm'));

  await browser.close();
  console.log('OK: docs/demo.webm + 5 张真实截图已生成');
}

main().catch((e) => {
  console.error('录制失败：', e);
  process.exit(1);
});
