# 校园行 · CampusGo

> 官网展示 + 后台登录系统（用户注册 / 管理员登录，权限分开 RBAC）｜私有仓库 · monorepo 单仓双包

- 技术栈：React 18 + Vite + Tailwind ｜ NestJS + Prisma + PostgreSQL ｜ JWT + RBAC ｜ Playwright / Vitest / Jest
- 代码组织：`apps/web`（前端）、`apps/server`（后端）、`packages/shared`（共享类型与契约）
- 分支：`main`（受保护，仅 PR 合入）/ `develop` / `feature/*` / `fix/*`
- 本地一键启动：`cp .env.example .env && docker compose up`（详见 docs）
- 唯一代码源：所有协作者 clone 同一远程仓、基于同一基准提交 `v0.1-baseline` 取码，PR 审查针对同一份代码

> 状态：M0 基准骨架已建立，功能代码由各领域工程师在 `feature/*` 分支实现并经 PR Review 合入。
