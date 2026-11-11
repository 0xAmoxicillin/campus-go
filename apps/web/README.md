# 校园行 CampusGo · 前端（@campus-go/web）

M1 交付：设计系统 + 官网静态页 + 登录/注册 + 后台控制台骨架 + 按契约的 Mock adapter。
本包**只改动 `apps/web/**`**；根配置、后端、共享包与 docs 均不触碰（协作门禁见仓库 `docs/collaboration-v0.1.md`）。

## 技术栈

React 18 + TypeScript 5 + Vite 5 + Tailwind CSS 3 + React Router 6 + Zustand 4 + Framer Motion 11 + react-hook-form/zod。
对齐 `docs/design-v0.1.md` §3。包名 `@campus-go/web`，提供 `lint / typecheck / test / build` 四个 scripts。

> 说明：本分支是 M1 并行开发分支，**根 `pnpm-workspace.yaml` 尚不存在**（由全栈负责，M2 才合入）。
> 因此本包作为独立包运行，进入 `apps/web/` 后执行 `pnpm install` 与 `pnpm <script>`。
> 等 M2 根 workspace 就绪后，会有一次简单迁移（加入 workspace 依赖图），不影响业务代码。

## 启动

```bash
cd apps/web
pnpm install        # 安装依赖（会生成 node_modules；请勿提交 pnpm-lock.yaml，见下）
pnpm dev            # 开发服务器 http://localhost:5173
pnpm build          # 类型检查 + 生产构建
pnpm test           # Vitest 运行（含契约一致性测试）
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
```

## Mock → 真实 API 切换

- 默认走 mock adapter（`VITE_USE_MOCK` 缺省为 `true`），**不真实调用 `/api`**，可离线跑通全部页面与契约。
- 切真实后端：在 `.env`（本地，`gitignore` 已忽略，勿提交）或 shell 中设置：
  ```bash
  VITE_USE_MOCK=false
  VITE_API_BASE_URL=http://localhost:3001/api   # 默认即此（见仓库 .env.example）
  ```
  代码中 `src/api/apiClient.ts` 据此选择 `createMockAdapter()` 或 `createHttpAdapter(baseURL)`，
  两者都按统一响应体 `{code,message,data}` 解析，切换零业务改动。

## 设计令牌（design tokens）

定义在 `tailwind.config.js` 与 `src/index.css`（CSS 变量），对应 `docs/design-v0.1.md` §6：
- 主色：靛蓝 → 青绿渐变（brand / teal 阶梯），`--brand-*`、`--teal-*`。
- 点缀：暖橙（accent / CTA），`--accent-*`。
- 字号（`fontSize`：`2xs`~`6xl`）、间距（4px 基准，扩展 `18`/`22`）、圆角（`sm`~`2xl`）、
  阴影/景深层级（`shadow-depth-1/2/3` + `glow`）、渐变背景（`bg-brand-gradient` / `bg-brand-soft`）。
- 深浅双主题：默认浅色；`.dark` 切换深色（变量已就绪，主题切换器在 Navbar）。

## 立体视觉与可访问性

- 玻璃拟态：`.glass`（backdrop-blur + 多层投影）；3D tilt：`useTilt` 与 Hero 卡片；视差：Hero 滚动 `useScroll`。
- 微动效：Framer Motion 渐显/弹性；`prefers-reduced-motion` 在 `src/index.css` 与 hooks 中**全部降级关闭**（验收标准之一）。
- 移动端优先响应式：`Container`/`Navbar` 折叠，栅格 `sm/lg` 断点。

## 3D / UI 开源方案选型与 License 核对

- M1 的 3D Hero 采用**纯 CSS 3D transform + Framer Motion** 实现，**未引入** Three.js / React Three Fiber / Aceternity UI / Magic UI 等第三方库，
  以避免体积膨胀与 License 风险，并满足 `prefers-reduced-motion` 降级需求。
- 图标为手写内联 SVG（`src/components/icons.tsx`），无外部依赖、无 License 负担。
- 结论：本期**无需核对外部 License**（无外部 3D/UI 库依赖）。若 M2 计划引入 R3F/Hero 库，将另行选型并核对其 License 后记录。

## 临时契约 shim（M1 → M2 替换计划）

- 契约唯一事实来源是 **`docs/api-contract-v0.1.md`**，禁止私自改字段。
- M1 因 `packages/shared` 由后端在并行 PR 创建、本分支不存在，故在 `src/contracts/api-contract.ts`
  维护一份**临时类型 shim**（含 DTO、ErrorCode、分页、角色枚举），文件头已明确标注「M1 临时 shim」。
- **M2 替换步骤（由 @项目组长 统一安排）**：
  1. 删除 `src/contracts/` 下本 shim；
  2. 改为 `import type { ... } from '@campus-go/shared'`；
  3. 校验 shared 类型与本 shim 逐字段一致后删除头部 TODO。
  该替换不视为「违反契约单一来源」，因为 shim 与 shared 均按同一契约生成。

## 安全边界声明（重要）

前端路由守卫（`src/components/route/ProtectedRoute.tsx` 的 `ProtectedRoute` / `AdminRoute`）
**只做体验层分流**：未登录跳登录、非 ADMIN 访问 `/admin` 给出「403 无权限」提示。
真正的鉴权与越权拦截由后端接口级 `JwtAuthGuard + RolesGuard` 兜底——USER 访问 `/api/admin/**` 一律返回 `403 / code=40300`。
注册接口硬编码 `role=USER`，请求体带 role 一律忽略（安全红线，见 `docs/api-contract-v0.1.md` §1）。

## 演示账号（仅本地 mock，非真实凭证）

- 管理员：`admin@campusgo.local` / 见仓库内常量 `DEMO_PASSWORD`（`src/api/mock/mockData.ts`，满足 ≥8 位含大小写与数字）。
- 普通用户：`alice@campusgo.local`、`bob@campusgo.local` / 同上演示密码。
- 也可直接注册新账号（一律 USER）。

## 自测命令与结果

见 PR 描述中「本地自测命令与结果」一节（M1 分支 CI 仅绿跳，真实门禁在三方合入 develop 后生效，已作为已知遗留项记录）。

## 约定

- 根 `pnpm-lock.yaml` / 根文件 / `apps/server/**` / `packages/shared/**` / `docs/` / `.env.example` 一概不提交。
- 提交信息结尾附 `Co-Authored-By: Claude Code <noreply@anthropic.com>`。
