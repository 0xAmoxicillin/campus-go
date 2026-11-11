# 校园行（CampusGo）整体设计文档方案 v0.1 · 待 Review

> 状态：**已批准定稿（v0.1）** ｜ 撰写：项目组长 ｜ 日期：2026-11-11
> 本轮只交方案：不建仓、不派活、不写业务代码。文档通过后再进入 M0。
>
> ## 定稿记录（2026-11-11）
> - 用户拍板：**后台深度 = B**（真实用户管理 + 活动/资讯 CRUD 后台）；其余（技术栈、官网栏目、普通用户能力、仓库定稿后建、本地 `docker compose up` 交付）按推荐默认走。
> - M0 已完成：私有仓 `https://github.com/0xAmoxicillin/campus-go.git` 已建；`main` / `develop` / `v0.1-baseline` 对齐同一提交 `76bfc3e3169d041dff5cf760597dbc503e5326ce`；`.env.example` 已改为显式占位符、从未提交真实密钥；CI（GitHub Actions）在私有仓可用且已 4 次绿色。
> - ⚠️ **环境偏差**：私有仓 + 免费套餐下，GitHub 分支保护与 Rulesets API 均返回 403（提示「Upgrade to GitHub Pro or make this repository public」）。故 §2 的「分支保护」无法由平台强制实现；改为**流程门禁**：全员禁止直接 push `main` / `develop`，一律 `feature/*` → 对 `develop` 开 PR → CI 绿 + 项目组长逐行 Review 批准后才合入，合并由项目组长执行。若需平台硬保护，需用户升级 GitHub Pro（或改公开仓，但与「私有」要求冲突）。
> - M1/M2 任务已按「契约先行、前端先 mock 并行」派发：后端先交 `packages/shared` + Prisma schema + 接口契约；前端并行做设计系统与官网静态页；全栈做一键环境、CI 门禁、E2E 骨架与版本一致性校验。

## 0. 我的思路（一句话版）
先把「要你拍板的」和「你授权我代定的」分开；用一份**契约先行**的计划让前后端能并行、三位工程师基于**同一基准提交**取码；权限安全在架构层兜死（注册绝不产生管理员）；视觉走「立体但不牺牲性能」的渐进增强；你点头后我再建仓、派活、逐行审、给你汇总结论。

## 1. 需求拆解
### 1.1 你明确要的
- 用 Git 管理，仓库**私有**，名字我取。
- 前端：官网展示界面，产品名「校园行」，主题/调性我定。
- 后台登录系统：用户注册 + 管理员登录，**权限分开（RBAC）**。
- 界面**美观、立体**；可参考 GitHub 开源实现。
- 先交**整体设计文档 + 每人分工**，一起 Review。

### 1.2 你授权我代定的（已定，Review 可一句话改）
- 产品名 / 仓库名：校园行 / `campus-go`（私有）。
- 主题调性：青春校园 × 轻科技，靛蓝→青绿渐变主色 + 暖橙点缀。
- 视觉手法：玻璃拟态 + 多层景深 + 3D tilt / 视差 + 微动效（详见 §6）。
- 官网信息架构与技术栈：按 §3 / §5 的推荐默认走。

### 1.3 必须你来拍板的（见 §11，最关键是「后台深度」）
技术栈、后台做到多深、普通用户能做什么、是否现在建仓、部署目标。

## 2. Git 与仓库方案
- 平台：GitHub，账号 `0xAmoxicillin`（今早已核：已登录、可建私有仓、token 含 repo 权限）。
- 仓库：`campus-go`，**Private**，初始化 README / .gitignore / LICENSE / 分支保护。
- 分支：`main`（受保护，仅 PR 合入）/ `develop` / `feature/*` / `fix/*`。
- 规范：约定式提交(commitlint) + ESLint/Prettier + Husky 钩子 + PR 模板 + CI 必过。
- 单一代码源（沿用团队既定方案）：三位工程师各自私有桌面 clone 同一远程仓，**以同一个基准提交取码、提交、联调、PR 审查**；跨桌面不贴代码、不传文件。
- 基准：M0 由我建仓并打 `v0.1-baseline` tag，三方从此开工；每日 rebase，全栈测试校验版本一致。

## 3. 技术栈（推荐默认，待拍板）
| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + React Router + Zustand + Framer Motion + react-hook-form/zod |
| 立体视觉 | CSS 3D transform / glassmorphism 为主，Three.js / React Three Fiber 作为 Hero 可选增强 |
| 后端 | Node.js 20 + TypeScript + **NestJS**（模块 + Guard 天然适配 RBAC） |
| ORM / DB | Prisma + PostgreSQL 16（docker-compose 统一，schema 即单一事实来源） |
| 鉴权 | JWT(短时 access + 长时 refresh，刷新轮换) + bcrypt + 角色 `USER`/`ADMIN` + RolesGuard 接口级校验 |
| API | RESTful + 统一响应体/错误码 + class-validator 校验 + Swagger(OpenAPI) 契约 |
| 测试 | Vitest(前端) / Jest+Supertest(后端) / Playwright(E2E) |
| 工程化 | monorepo 单仓双包 + ESLint/Prettier/Husky/commitlint + GitHub Actions CI + Docker 多阶段构建 |

## 4. 系统架构
```
浏览器（官网 SPA / 登录注册 / 后台控制台）
        │ HTTPS · REST(JSON) + JWT
┌───────▼──────────────────────────────┐
│ 前端 React SPA (Vite)                │ 前端路由守卫按角色分流（仅体验层）
└───────┬──────────────────────────────┘
        │ /api/auth · /api/users · /api/admin ...
┌───────▼──────────────────────────────┐
│ 后端 NestJS                          │
│ JwtAuthGuard → RolesGuard(USER/ADMIN) │ ← 真正的安全边界
│ Auth / Users / Content / Admin 模块   │
└───────┬──────────────────────────────┘
        │ Prisma
┌───────▼──────────────────────────────┐
│ PostgreSQL (docker-compose)          │
└──────────────────────────────────────┘
```
四条线权限边界清晰：官网内容(公开) / Auth / 用户自助 / 管理员后台。

## 5. 功能设计
### 5.1 官网（前端展示，公开）
首页(3D Hero + Slogan + CTA) / 关于校园行 / 活动·行程(列表+详情) / 资讯·动态 / 加入我们(引导注册) / 登录·注册 / 页脚。响应式、移动端优先。

### 5.2 后台登录与权限（核心）
| 能力 | 访客 | 普通用户 USER | 管理员 ADMIN |
|---|:---:|:---:|:---:|
| 浏览官网公开内容 | ✅ | ✅ | ✅ |
| 注册 | ✅（仅注册为 USER） | — | — |
| 登录 | — | ✅ | ✅ |
| 查看/修改自己资料 | — | ✅ | ✅ |
| 报名/参与活动 | — | ✅（建议） | ✅ |
| 后台控制台 `/admin` | — | ❌ 403 | ✅ |
| 用户管理(列表/启停/改角色) | — | ❌ | ✅ |
| 内容管理(活动/资讯 CRUD) | — | ❌ | ✅ |

**安全红线**
- 注册接口**硬编码 role=USER**，请求体携带 role 一律忽略/拒绝 → 杜绝公开提权。
- 初始 ADMIN 由**服务端种子脚本**创建，不开放注册。
- 密码 bcrypt 哈希、绝不落明文；JWT 短时 access + 长时 refresh + 刷新轮换。
- 前端路由守卫只做体验，**接口级 Guards 才是安全边界**；越权统一 403、登录限流、CORS 白名单、Swagger 标注权限。

### 5.3 接口契约草案（后端 M1 先定，前端据此并行）
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout`
- `GET /api/users/me` · `PATCH /api/users/me`
- `GET /api/activities` · `GET /api/activities/:id` · `POST /api/activities/:id/join`
- `GET /api/posts` · `GET /api/posts/:id`
- `GET /api/admin/users` · `PATCH /api/admin/users/:id`
- `POST/PATCH/DELETE /api/admin/activities` · `/api/admin/posts`

全量以 Swagger 为准，契约变更走 PR 通知全组。

## 6. UI / 视觉方向（美观立体）
- 调性：青春校园 × 轻科技；深浅双主题（先做浅色）。
- 立体手法：玻璃拟态卡片、多层投影与景深、鼠标 3D tilt、视差滚动、渐显动效、Hero 轻量 3D。
- 性能与可访问性：渐进增强、移动端降级、`prefers-reduced-motion`、Lighthouse 达标。
- 组件/参考：Tailwind + shadcn/ui 打底，动效参考 Aceternity UI / Magic UI / Framer Motion 等开源方案；**文档通过后由前端工程师去 GitHub 具体选型并核对 License，不照搬**。
- 交付物：设计令牌(配色/字号/间距)、组件清单、页面高保真稿（评审时给我过一眼）。

## 7. 工程结构（单仓双包）
```
campus-go/
├── apps/web/          # 前端 React SPA
├── apps/server/       # 后端 NestJS
├── packages/shared/   # 共享 TS 类型 / zod schema / 常量（契约单一来源）
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
└── README.md
```
`shared` 包让前后端共用 DTO 类型，是并行开发不跑偏的关键。

## 8. 分工与验收标准
### @资深前端工程师
- 任务：前端工程初始化、路由、设计系统、全部官网页面、3D/立体视觉与动效、响应式；登录/注册/后台控制台页面与表单校验；JWT 存储与前端路由守卫；按 Swagger 对接后端 API；GitHub 开源 3D/UI 方案选型与 License 核对。
- 验收：desktop/mobile 正常、动效流畅、表单校验完整、角色分流正确、构建无错误、Lighthouse 达标、与契约一致。
- 边界：不做服务端逻辑、不碰数据库。

### @资深后端工程师
- 任务：NestJS 工程、Prisma schema 与 migration、docker-compose(PostgreSQL)、Auth 模块(注册/登录/JWT/refresh/bcrypt)、Users 模块、RBAC Guards(USER/ADMIN)、Admin 模块(用户管理 + 内容 CRUD)、统一响应/异常/错误码、参数校验、Swagger 契约、管理员种子脚本、单元/接口测试。
- 验收：契约(Swagger)稳定、越权返回 403、密码不明文、注册无法提权为 ADMIN、migration 可重复执行、API 测试通过。
- 边界：不做页面与视觉。

### @资深全栈与测试工程师
- 任务：一键本地环境(.env.example + docker-compose)、前后端联调、E2E(Playwright 覆盖注册/登录/权限分流/官网)、API 测试、CI(构建+lint+test)、Docker 镜像与部署脚本、跨桌面取码与**版本一致性校验(基准提交)**、回归测试与疑难攻关。
- 验收：`docker compose up` 一键起全栈、E2E 全绿、CI 通过、三桌面基于同一提交可复现、有部署与回滚说明。
- 边界：不一手写业务功能，负责把它们合起来跑通、测到位。

### @项目组长（我）
- 需求澄清与确认、拆解与派活、架构/接口契约拍板、逐行 PR Review 与审批、合并结论。**不写任何业务代码**。

## 9. 里程碑与依赖
| 阶段 | 内容 | 依赖 |
|---|---|---|
| M0 文档与仓库 | 文档 Review 通过 → 建私有仓 + 分支保护 + 骨架 → 打 `v0.1-baseline` → 三方 clone | 你拍板 |
| M1 契约先行 | 后端交 Prisma schema + Swagger 契约 + .env.example；前端据此并行(先 mock) | M0 |
| M2 并行开发 | 前端官网+页面 ‖ 后端 Auth/RBAC/接口 并行 | M1 |
| M3 联调 | 全栈测试接入，前后端联通、权限分流跑通 | M2 |
| M4 测试与加固 | E2E / CI / 安全 / 性能 / 3D 视觉打磨 | M3 |
| M5 Review 交付 | 我逐行审、打回修复、达标合并、给你汇总结论 | M4 |

## 10. 风险与对策
| 风险 | 对策 |
|---|---|
| 前后端契约对不齐 | M1 先定契约 + `shared` 共享类型，变更走 PR 通知全组 |
| 三私有桌面版本分叉 | 统一基准 tag + 每日 rebase + 全栈测试校验（呼应团队既定方案） |
| ADMIN 提权漏洞 | 注册硬编码 USER、种子建管理员、接口 Guards 兜底、E2E 覆盖越权 |
| 3D 动效性能/兼容 | 渐进增强、移动端降级、reduced-motion、Lighthouse 把关 |
| 主题/内容未定 | 我代定视觉与官网 IA，Review 时你点头或一句话改 |

## 11. 请你拍板（都给了推荐默认，没意见回「按推荐来」即可）
- ⭐ **最关键：后台做到多深？** (A) 仅登录 + 角色分流 + 占位控制台 ／ (B) 真实用户管理 + 内容(活动/资讯)CRUD 后台。我推荐 **B**，才撑得起「后台系统」。
- 技术栈用 React + NestJS + Prisma + PostgreSQL 这套？（备选：Express+SQLite 更轻，或你指定语言）
- 普通用户登录后能做什么：推荐「改自己资料 + 报名活动」。
- 官网栏目按 §5.1 这套？
- 仓库现在就建 `campus-go` 私有仓，还是等文档定稿一起？我建议**定稿后建**，避免白建。
- 交付形态：先本地 `docker compose up` 可复现，还是这次就要上线？部署目标未给我就按本地可跑交付。

除标 ⭐ 那条外，其余我按默认走，Review 时告诉我要改哪条即可。

## 12. 文档通过后我立刻做
① 建私有仓 + 分支保护 + 初始骨架 ② 打 `v0.1-baseline`、三方 clone 同一提交 ③ 让后端先交 Prisma schema + Swagger 契约(M1) ④ 三份带验收标准的任务正式派发、互不依赖的并行 ⑤ 之后我逐行 PR Review、打回修复、达标才合并、给你一份汇总结论。
