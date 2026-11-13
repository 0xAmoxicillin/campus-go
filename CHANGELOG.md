# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 约定，版本号采用[语义化版本](https://semver.org/lang/zh-CN/)（SemVer）。

**版本策略（供后续迭代沿用）：**

- 版本号格式 `MAJOR.MINOR.PATCH`；当前处于 `0.x` 阶段，API 仍视为不稳定。
- 功能性增量（新增可用能力、新端点、新模块）升级 **MINOR**（如 `0.1.0 → 0.2.0`）。
- 仅修复缺陷、补文档、调整内部实现而不改外部契约时升级 **PATCH**（如 `0.2.0 → 0.2.1`）。
- 破坏性变更（改动既有接口契约、删除字段、改认证方式）升级 **MAJOR**（进入 `1.0.0`）。
- Git tag 命名统一为 `vX.Y.Z`（例：`v0.1.0`、`v0.2.0`），由 CI 在合并态转绿后统一打标与发 Release；本仓库为开放源代码仓库，GitHub Pages 是否开启另行决定。

> 说明：已于 2026-11-12 发布 `v0.2.0`（tag `v0.2.0`，Release 已发布），根 `package.json` 版本为 `0.2.0`。M2 作为功能增量，版本号已升 MINOR。

---

## [v0.2.0] / M2 · 功能增量 — 2026-11-12

> 对应合并 PR：前端后台 #4、服务端 Auth/RBAC/CRUD #5、DevOps 真实服务 E2E 与 CI 门禁 #6。
> 三路并行、按统一契约 `docs/api-contract-v0.1.md` 对齐；合并态 tip `3f2d5ee`。

### 新增

- **真实认证（Auth）**：bcrypt 密码哈希（`bcryptjs`，salt rounds 默认 10）+ JWT。Access Token 默认 `15m`、Refresh Token 默认 `7d`，刷新时令牌轮换（旧 refresh 立即吊销），登出吊销 refresh。
- **接口级鉴权**：`JwtAuthGuard` + `RolesGuard` 双重守卫；未登录 → `401 / code=40100`，已登录但角色不足 → `403 / code=40300`。真正的安全边界在后端的 Guards（前端 `AdminRoute` 仅为体验层提示）。
- **注册安全红线**：注册接口硬编码 `role=USER`，请求体即使携带 `role` 也一律忽略，服务端不接受外部角色。
- **管理员能力**：用户启停（`PATCH /api/admin/users/:id`）+ 活动 / 资讯真实 CRUD（创建 / 编辑 / 删除，活动含报名 `join`）。
- **前端后台**：官网实接真实 API（默认 `VITE_USE_MOCK=false`，置 `true` 走前端 mock adapter 零后端看效果）+ 后台左栏 dashboard 布局与完整 CRUD 界面。
- **单点响应统一包装**：所有单点资源统一包一层 key（`data.activity` / `data.post` / `data.user` / `data.enrollment` …），服务端 `ResponseInterceptor` 与前端解包、mock adapter 三路按契约 §3 对齐（用户拍板：选项 1——统一包一层 key）。
- **真实服务 E2E**：Playwright 套件打运行中的真实服务（PostgreSQL 16 → `prisma migrate deploy` → `seed` → NestJS(3001) → Vite(5173)）。覆盖：注册 / 登录 / 角色分流、RBAC 红线 401（未登录）· 403（USER 访问 `/api/admin/**`）、用户启停、活动·资讯 CRUD 全流程、统一响应体 `{code,message,data}` 与分页结构、单点资源包装形状、前端页面可达与角色分流。详见 `scripts/e2e/specs/real-service.spec.ts`。
- **CI 门禁**：`quality-gate` 使用 `pnpm install --frozen-lockfile`；新增 `e2e-real` job，在 PG16 service 容器下跑真实服务联通（与 contract 契约结构回归互不替代、互不假装）。
- **真实产品录屏与截图**：`docs/demo.webm`（真实全栈 `apps/web` 界面录屏，录制时 `VITE_USE_MOCK` 不置 `true`）与 5 张真实运行截图 `docs/screenshot-0{1..5}-*.png`，替换此前自创演示页；均离线、零外部请求。

### 变更

- 统一响应体 `{ code, message, data }` 后端落地（`ResponseInterceptor`），前端同步解包（Fix-B：单点响应解包 + 品牌配置抽取 + 必填 `status` + mock 包装）。

### 修复

- M2 Review 打回修复：对齐契约 §3 单点资源包装（服务端响应视图 + 前端解包 + mock 包装，三路一致）。

### 安全

- 接口级 RBAC 越权边界（401 / 403）与注册 `role` 硬编码，列为安全红线；refresh token 只存哈希（`tokenHash`），绝不落明文。

### 已知边界（如实）

- 合并态的 `e2e-real` 真实联通门禁仍在另路修复中，截至本记录未全绿；PR 阶段 `e2e-real` 为真实服务套件，仅在有真实 PG16 + server + web 时运行，**不会在无服务时伪装通过**。
- 真实注册 / 登录 / JWT / CRUD 需完整后端（PG16）；`VITE_USE_MOCK=true` 仅用于前端展示，不落真实数据库。

---

## [v0.1.0] / M1 · 基线 — 2026-11-11

> 对应合并 PR：服务端契约 #1、前端设计 #2、DevOps 基础设施 #3。
> 三路并行基线，统一以契约 `docs/api-contract-v0.1.md` 为唯一接口事实来源；基线 tag 规划 `v0.1.0`（别名 `v0.1-baseline`）。

### 新增

- **三路并行基线**：服务端 / 前端 / DevOps 各自 feature 分支，按统一契约并行开发、分别评审合并。
- **统一接口契约 v0.1**：`docs/api-contract-v0.1.md`（含 §0 统一响应体、§2 RefreshToken 契约、§3 单点资源包装约定）+ Prisma `schema.prisma` 与迁移 + Swagger（NestJS `/docs`）。
- **前端 M1**：设计系统、官网静态页、登录 / 注册页、后台骨架、契约 Mock adapter（默认接契约结构，便于零后端联调）。
- **DevOps M1**：根 workspace（pnpm 多包）、CI 门禁（含 `--frozen-lockfile` 与 E2E 骨架）、版本一致性校验脚本、`.env.example` 显式占位符。
- **基础设施与种子**：Docker Compose（PostgreSQL 16）、种子脚本（幂等创建初始 ADMIN）。

### 说明

- M1 阶段 E2E 为契约结构回归（`pnpm run test:e2e`，page.route 拦截层），验证端点存在性与响应形状，不依赖真实服务。
- 三份受控文档 `docs/api-contract-v0.1.md` / `docs/collaboration-v0.1.md` / `docs/design-v0.1.md` 在 M1 定稿，M2 仅按契约 §3 做单点包装对齐，未改其正文。

---

## 链接

- 仓库（开放源代码）：`https://github.com/0xAmoxicillin/campus-go`
- 受控文档：契约 `docs/api-contract-v0.1.md`、协作规范 `docs/collaboration-v0.1.md`、设计 `docs/design-v0.1.md`
- 本地启动与验证：见 `README.md`「真实模式」与「演示模式」
