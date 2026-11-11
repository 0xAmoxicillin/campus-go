# 校园行 · CampusGo

> 官网展示 + 后台登录系统（用户注册 / 管理员登录，权限分开 RBAC）｜私有仓库 · monorepo 单仓双包
> 根工作区由 M1 全栈/测试交付：`package.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml` / `docker-compose.yml` / CI / E2E 骨架 / 版本一致性脚本。

- 技术栈：React 18 + Vite + Tailwind ｜ NestJS + Prisma + PostgreSQL 16 ｜ JWT + RBAC ｜ Playwright / Vitest / Jest
- 代码组织：`apps/web`（前端）、`apps/server`（后端）、`packages/shared`（共享类型与契约）
- 工具链：Node 20 / pnpm 9 / TypeScript 5.x，跨包依赖用 `workspace:*`
- 分支：`main`（受保护，仅 PR 合入）/ `develop` / `feature/*` / `fix/*`
- 唯一代码源：所有协作者 clone 同一远程仓、基于同一基准提交 `v0.1-baseline` 取码，PR 审查针对同一份代码
- 契约事实来源：`docs/api-contract-v0.1.md`（受控文档，M1 不改）

---

## 本地启动

前置：Node 20、pnpm 9、Docker（含 Compose 插件）。

```bash
cp .env.example .env      # 按文件内注释替换占位符；.env 已被 .gitignore 忽略，切勿提交
docker compose up -d      # 启动 PostgreSQL 16（供后端 Prisma）
pnpm install              # 安装根工作区依赖（M1 用 --no-frozen-lockfile，见「CI」）
```

端口与变量（全部对齐 `.env.example`）：

| 变量 | 值 / 用途 |
|---|---|
| `POSTGRES_USER` | `campusgo` |
| `POSTGRES_PASSWORD` | 由 `.env` 提供，不落明文、不进日志与响应 |
| `POSTGRES_DB` | `campusgo` |
| `DATABASE_URL` | `postgresql://campusgo:<password>@localhost:5432/campusgo?schema=public` |
| PostgreSQL | `localhost:5432` |
| `SERVER_PORT` | `3001`（NestJS 预留） |
| `WEB_PORT` | `5173`（Vite 预留） |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` |

校验 compose 配置：`docker compose config`（无需启动容器即可验证变量与占位符一致）。

> M1 只要求 PostgreSQL 可用；`server` / `web` 服务为**预留**，置于 `apps` profile 下，
> 默认 `docker compose up` 不会尝试构建尚不存在的镜像。M2 补 Dockerfile 后用
> `docker compose --profile apps up` 启用。受控文档 `docs/` 三份 M1 不改，本地说明以本 README 为准。

---

## CI

`.github/workflows/ci.yml` 在 `push`（`main` / `develop` / `feature/**` / `fix/**`）与对
`main` / `develop` 的 `pull_request` 触发，步骤：

1. `pnpm install --no-frozen-lockfile`
   - **M1 并行建包**：三个 `package.json` 在三个并行 PR 里分别创建，此刻不存在一份覆盖全部工作区的权威 lockfile，故允许按当前工作区解析依赖。
   - **M2** 三方合并到 `develop`、工作区稳定后切回 `--frozen-lockfile`。
2. **真实门禁前置步骤**（install 之后、Lint 之前，顺序固定）：
   - `pnpm --filter @campus-go/shared run build`：产出 `packages/shared/dist`。干净 checkout 里 `dist/` 被 `.gitignore` 忽略，而 `@campus-go/server` 的 `typecheck/test/build` 都 `import '@campus-go/shared'`，其 `main/types` 指向 `dist/index.js`；不先产出会报 `TS2307` / `Cannot find module`。
   - `pnpm --filter @campus-go/server exec prisma generate`：初始化 Prisma Client。`@prisma/client` 未 generate 时 Jest 报 `did not initialize yet`、5 个用例全崩。此步**不需要** `DATABASE_URL` 真实可连。
   - 仅根包形态（三方合并前）下这两个包尚不存在，`--filter` 无匹配返回 0，不误报失败；合并后三包齐全时才真正产出 `dist` / 初始化 Client。
3. `pnpm -r run --if-present lint|typecheck|test|build`：逐个包跑真实检查。
   - `--if-present` 必须放在 `run` 之后、脚本名之前。旧写法 `pnpm -r run <script> --if-present` 会把 flag 透传给脚本本身（`eslint`/`tsc`/`echo` 收到未知参数而失败），只在「零子包空跑」时伪装成绿，合并后必红。
4. E2E：`pnpm exec playwright install --with-deps chromium` + `pnpm run test:e2e`。
5. 版本一致性报告（**非阻塞**）：`bash scripts/check-version-consistency.sh`。

**鲁棒性**：CI 同时兼容 (a) 仅根 `package.json`、`apps/*` / `packages/*` 尚无 `package.json`（三方合并前）与 (b) 三包齐全两种形态。`pnpm -r run --if-present <script>` 在包缺失 / 脚本缺失时返回 0，不因 glob 无匹配失败；真实质量门禁在三方合并到 `develop` 后生效，但**需带上面两个前置步骤才会生效**，否则合并后第一跑就是红的。

本地复现 CI 质量步骤（含真实门禁前置步骤，顺序与 ci.yml 一致）：

```bash
pnpm install --no-frozen-lockfile
pnpm --filter @campus-go/shared run build
pnpm --filter @campus-go/server exec prisma generate
pnpm -r run --if-present lint
pnpm -r run --if-present typecheck
pnpm -r run --if-present test
pnpm -r run --if-present build
pnpm exec playwright install --with-deps chromium
pnpm run test:e2e
```

---

## E2E（Playwright 骨架）

```bash
pnpm exec playwright install chromium   # 首次；CI 里已自动装
pnpm run test:e2e                      # 等价 playwright test --config scripts/e2e/playwright.config.ts
```

- 配置：`scripts/e2e/playwright.config.ts`（`testDir: scripts/e2e/specs`）。
- 拦截层：`scripts/e2e/fixtures/mock-api.ts` 用 `page.route` / `route.fulfill` 把 `/api/**` 替换为符合契约的 fixture，`scripts/e2e/fixtures/api.ts` / `contract.ts` 提供数据形状。
- 覆盖：
  - 越权红线 —— 未登录访问受保护资源 → `401 / code=40100`；USER 访问 `/api/admin/**` → `403 / code=40300`（`rbac.spec.ts`）
  - 统一响应体 `{code,message,data}` 与分页 `{items,total,page,pageSize}` 结构断言
  - 注册（含「请求体带 `role=ADMIN` 一律忽略」红线）/ 登录 / 角色分流 / 刷新登出骨架（`auth-flow.spec.ts`）
- **M1 无真实后端**：所有响应来自拦截层，因此本地与 CI 均可独立全绿。
- **TODO(M3)**：后端 Auth/RBAC/Admin 就绪后删除拦截层，改打真实服务，验证真实 `JwtAuthGuard` + `RolesGuard` 与页面路由分流。

---

## 版本一致性

```bash
bash scripts/check-version-consistency.sh
# 或
pnpm run check:versions
```

脚本对比 `git rev-parse HEAD` 与 `v0.1-baseline` / `origin/develop`，输出可读的 `[PASS]` / `[FAIL]` / `[WARN]` 结论、领先/落后提交数、共同祖先与合流建议；引用缺失时降级为 WARN 并给出 `git fetch` 提示，绝不误报失败。

- **M1 非阻塞**：feature 分支 HEAD 本就领先 develop，报告仅供核对，CI 里以 `continue-on-error` 运行。
- **TODO(M3)**：改造成「三方 HEAD 指向同一提交才放行」的硬门禁。

---

## 本 PR（M1）已知限制

1. **CI 真实检查推迟，且需带前置步骤才会生效**：三方 feature 合并到 `develop` 前，仅根包存在，`lint/typecheck/test/build` 为 no-op（pnpm 返回 0），CI 绿**不等于**对后端/前端代码做过真实检查。合并到 `develop` 后也不是「自动生效即全绿」——必须先跑 `pnpm --filter @campus-go/shared run build`（产出 `dist`）与 `pnpm --filter @campus-go/server exec prisma generate`（初始化 Prisma Client），否则 server 的 `typecheck/test/build` 会因缺 `dist` / 缺 Prisma Client 直接失败，合并后第一跑就是红的。基线 `ci.yml` 在无根 `package.json` 时跳过检查，同样如此。
2. **E2E 走拦截层**：无真实后端、无真实前端页面，响应来自 `page.route` fixture；只验证契约结构与红线判定，不是端到端联通。
3. **版本一致性非阻塞**：M1 仅报告，不作放行门禁。
4. **compose 的 server/web 为预留**：M1 不要求真实联通，镜像/构建 TODO(M2)。
5. **lockfile 非冻结**：M1 用 `--no-frozen-lockfile`，M2 稳定后切回。

> 流程门禁（私有仓免费套餐无法用平台分支保护）：禁止直接 push `main` / `develop`；
> `feature/*` → 对 `develop` 开 PR → CI 绿 + 项目组长逐行 Review 批准 → 由项目组长合并。
