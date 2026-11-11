# CampusGo 后端服务（apps/server）

NestJS + TypeScript + Prisma + PostgreSQL 16。本目录由**后端工程师**维护，M1 交付范围：契约（Swagger）、Prisma schema/migration、服务端基础设施、管理员种子脚本。

> 文件所有权边界（协作规范 v0.1）：你只应改动 `apps/server/**` 与 `packages/shared/**`。根 `package.json` / `pnpm-workspace.yaml` / `docker-compose.yml` / `.github/**` / `scripts/**` / 根 `README.md` 归全栈工程师；`apps/web/**` 归前端；`docs/**` 三份为受控文档，M1 不改。

## 技术栈与版本

- Node 20 / pnpm 9（与 `.github/workflows/ci.yml` 的 setup-node 20 + pnpm 9 对齐）
- NestJS 10 / TypeScript 5.x / class-validator / @nestjs/swagger
- Prisma 5 / PostgreSQL 16

## 本地启动

> ⚠️ **全新 clone 后的前置命令（跑 typecheck/test 前必做）**
> `packages/shared` 的 `dist/` 被 gitignore，`@prisma/client` 在 `prisma generate` 前未初始化。因此**全新 clone** 在跑 `typecheck`/`test` 前，必须先执行：
> ```bash
> pnpm --filter @campus-go/shared run build        # 编译共享契约包，否则 server 报 TS2307: Cannot find module '@campus-go/shared'
> pnpm --filter @campus-go/server prisma:generate  # 生成 Prisma Client，否则运行/测试报 "@prisma/client did not initialize yet"
> ```
> 你本地能直接 5/5 PASS，是因为已经跑过上述两步且连着真实 PG16；干净 CI checkout 不复现，务必先生成再校验。

```bash
# 0) 依赖（在仓库根目录，monorepo 安装）
pnpm install

# 1) 准备环境变量（切勿提交 .env，已 gitignore）
cp .env.example .env
#   编辑 .env：把 DATABASE_URL / JWT_* / ADMIN_SEED_* 占位符替换为强随机值。

# 2) 启动 PostgreSQL 16（用全栈提供的 docker-compose，或本地 PG16）
#    本服务不自带 docker-compose；PG16 连接方式见下。

# 3) 生成 Prisma Client 并执行迁移
pnpm --filter @campus-go/server prisma:generate
pnpm --filter @campus-go/server prisma:migrate   # 开发：生成+应用迁移
# 或生产/CI： pnpm --filter @campus-go/server prisma:deploy

# 4) 种子管理员（仅 ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD，不开放注册）
pnpm --filter @campus-go/server seed

# 5) 启动开发服务
pnpm --filter @campus-go/server start:dev
```

## PostgreSQL 16 连接

服务通过 `DATABASE_URL` 环境变量连接 PG16（来自 `.env.example`，由全栈 docker-compose 提供同名变量）：

```
DATABASE_URL=postgresql://campusgo:<DB_PASSWORD>@localhost:5432/campusgo?schema=public
```

- 库名：`campusgo`，用户：`campusgo`，端口：`5432`（详见 `.env.example`）。
- 推荐：仓库根 `docker compose up` 一键拉起 PG16；本目录不重复定义 compose。
- Prisma 连接池与 SSL 由 Prisma Client 默认处理；生产如需 SSL 请在 `DATABASE_URL` 追加 `?sslmode=require`。

## 数据库迁移（可重复执行）

- 首次：`pnpm --filter @campus-go/server prisma:migrate`（基于 `prisma/migrations/0_init`）。
- 重复执行：`prisma migrate deploy` 对已应用迁移幂等、无报错。
- 重置：`pnpm --filter @campus-go/server prisma:reset --force`（清空数据重跑迁移）。

## 管理员种子脚本

`prisma/seed.ts` 仅使用环境变量创建 ADMIN，**注册接口绝不产生 ADMIN**：

```bash
ADMIN_SEED_EMAIL=admin@campusgo.local ADMIN_SEED_PASSWORD=<强密码> \
  pnpm --filter @campus-go/server seed
```

- 幂等：已存在同名邮箱管理员则跳过/提升为 ADMIN。
- 密码经 bcrypt 哈希，**绝不落明文、绝不打印到日志/响应**。
- 与 `.env.example` 的 `ADMIN_SEED_*` 对齐；请勿写入真实密钥。

## Swagger（契约）

启动后访问：`http://localhost:3001/docs`

所有端点按 `docs/api-contract-v0.1.md` 标注角色与统一响应体 `{code,message,data}`；字段/错误码与契约严格一致。21 个端点：4 Auth + 2 Users + 5 Content + 10 Admin（契约 §3.4 表格实列 10 个 admin 端点；任务派发文案中的「9 个 admin」为笔误，以契约表格为准）。

## 安全约定（红线）

- `register` 硬编码 `role=USER`，请求体携带 `role` 一律忽略（杜绝公开提权）。
- 初始 ADMIN 只由种子脚本产生；密码 bcrypt 哈希。
- 接口级 `JwtAuthGuard` + `RolesGuard` 才是安全边界；`/api/admin/**` 挂两者，USER 访问一律 403。
- 登录限流（42900）。CORS 仅允许 `CORS_ORIGINS` 白名单。

## 本包脚本

| 脚本 | 说明 |
|---|---|
| `pnpm --filter @campus-go/server build` | 编译 TS 到 dist |
| `typecheck` | tsc 类型检查 |
| `lint` | ESLint |
| `test` | Jest（含 M1 基础设施验收测试） |
| `start` / `start:dev` / `start:prod` | 启动 |
| `prisma:generate` / `prisma:migrate` / `prisma:deploy` / `prisma:reset` | Prisma |
| `seed` | 管理员种子 |

## M1 vs M2

- **M1（本目录已交付）**：`packages/shared` 契约、Prisma schema/migration、Swagger 契约、统一响应/异常/校验、JwtAuthGuard+RolesGuard 骨架、限流、CORS、管理员种子。
- **M2（后续 PR）**：完整业务端点（register/login/refresh/logout 的 bcrypt+JWT 实现、Users/Content/Admin 服务与 Repository、refresh 轮换与登出吊销）。
