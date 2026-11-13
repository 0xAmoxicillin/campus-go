# 校园行 CampusGo · 官网展示模版

<p align="left">
  <img alt="stack" src="https://img.shields.io/badge/stack-React%2018%20%2F%20NestJS%20%2F%20Prisma%20%2F%20PG16-4f46e5" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-2dd4bf" />
  <img alt="reusable" src="https://img.shields.io/badge/template-reusable-green" />
</p>

> **一套拿来即套用的校园官网 + 后台展示模版**：改品牌名与文案、换内容数据即可复用；官网、登录注册、RBAC 后台、真实接口与 E2E 全链路已经串好。

这是一个**可复用的官网 / 后台展示模板**（不是某个内部系统的一次性交付）。主题是「校园行」，但你完全可以把它换成社团、赛事、实验室或任意活动的官网：品牌与站点文案集中、内容数据独立、主题走设计令牌，前后端分离且默认对接真实 API。真实产品界面的录屏与截图都在仓库内，`clone` 后用本地相对路径即可打开，不依赖任何在线服务。

## ▶ 一分钟看效果

在仓库主页即可**就地播放**下面的真实产品界面录屏：点击播放器直接在本页观看，无需跳转到文件页或下载。

https://github.com/user-attachments/assets/a4e52697-3069-4f3a-a1e2-4599948c3b85

[![点击打开真实 apps/web 界面录屏](docs/screenshot-01-home.png)](docs/demo.webm)

**[`docs/demo.webm` · 点击打开真实产品界面录屏](docs/demo.webm)** —— `clone` 后用本地相对路径点开即可播放（中文硬字幕 + AI 中文旁白 + 轻音乐、循环友好；不联网、无 CDN、无外部字体/图片，零外部请求）。

下面是**对运行中的 `apps/web` 实际截取**的 5 张截图（无头 Chromium，1280×800），不是占位图、不是外链、不是另画的 UI：

| 官网首页（近期活动真实数据卡片） | 注册 / 登录 | 管理员后台（左栏 dashboard 概览） |
|---|---|---|
| ![官网首页](docs/screenshot-01-home.png) | ![注册登录](docs/screenshot-02-auth.png) | ![管理员后台](docs/screenshot-03-admin.png) |

| 活动管理 CRUD（新建/编辑/删除） | 用户管理 + RBAC 安全边界提示 |
|---|---|
| ![内容管理](docs/screenshot-04-crud.png) | ![用户管理与安全边界](docs/screenshot-05-users.png) |

## ✨ 模板好在哪（优势）

- **真实全栈联通**：NestJS + Prisma + PostgreSQL 16，Auth / JWT / RBAC、用户启停、活动 / 资讯 CRUD 都是真实接口，不是静态壳；接口级 `JwtAuthGuard + RolesGuard` 是安全边界。
- **前后端分离 + 共享契约单一来源**：`packages/shared` 统一承载 DTO / zod schema / `ErrorCode` / 角色与状态枚举，前后端共用同一份契约，不会各写各的。
- **零后端也能看界面**：前端保留 `VITE_USE_MOCK` 演示开关，置 `true` 即走前端 mock adapter，后端没起也能浏览官网与后台展示。
- **一键分发包**：Release 附带独立分发包，解压后一条 `./bin/campus-go start` 拉起整套本地环境（详见「怎么部署」）。
- **演示素材仓库内离线零外链**：上面的录屏（`docs/demo.webm`）与 5 张截图（`docs/screenshot-*.png`）都在仓库内，完全离线、零外部请求，不依赖任何图床或 CDN。
- **MIT 可自由改**：可自由改品牌、改文案、接自己的后端，按需二次分发。

## 🚀 怎么用

前置：Node 20+、pnpm 9+、Docker（含 Compose 插件）。

```bash
git clone https://github.com/0xAmoxicillin/campus-go.git   # 或 fork 到你名下后再 clone 你的 fork
cd campus-go
cp .env.example .env                 # 按文件内注释替换占位符；.env 已被忽略，切勿提交
docker compose up -d                 # 启动 PostgreSQL 16
pnpm install                         # 与 CI 一致：--frozen-lockfile
pnpm --filter @campus-go/shared run build          # 前置①：产出 shared/dist
pnpm --filter @campus-go/server exec prisma generate  # 前置②：初始化 Prisma Client
```

端口与主要变量（其余见 `.env.example`）：

| 变量 | 值 / 用途 |
|---|---|
| `POSTGRES_USER` / `POSTGRES_DB` | `campusgo` / `campusgo` |
| `DATABASE_URL` | `postgresql://campusgo:<password>@localhost:5432/campusgo?schema=public` |
| PostgreSQL | `localhost:5432` |
| `SERVER_PORT` | `3001`（NestJS；Swagger 在 `/docs`） |
| `WEB_PORT` | `5173`（Vite） |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` |
| `VITE_USE_MOCK` | 代码默认 `false`（接真实 API）；`.env.example` 中无此项，需用时自行在 `.env` 添加并置 `true` 走前端 mock adapter，零后端看效果 |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | 初始管理员，仅由种子脚本创建 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 部署前替换为强随机值，切勿提交 |

校验 compose 配置：`docker compose config`（无需启动容器即可验证变量与占位符一致）。

### 真实模式：把服务跑起来

```bash
# 1) 建表（可重复执行）
pnpm --filter @campus-go/server exec prisma migrate deploy
# 2) 种子管理员（幂等；用 .env 里的 ADMIN_SEED_*）
pnpm --filter @campus-go/server run seed
# 3) 两个终端分别起服务
pnpm --filter @campus-go/server run start       # http://localhost:3001  · Swagger /docs
pnpm --filter @campus-go/web run dev            # http://localhost:5173   · VITE_USE_MOCK 不置 true
```

浏览器按下面顺序真实走通一遍：

1. 打开 `http://localhost:5173/register` → 注册一个普通账号（密码 ≥8 位、含大小写与数字）→ 自动进入 `/me`，角色 `USER`。
2. 用另一个浏览器 / 无痕窗口打开 `http://localhost:5173/login` → 用 `.env` 中的 `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` 登录 → 角色分流进入 `/admin`，可见**左栏 dashboard + 右侧内容区**。
3. 后台「用户管理」→ 对某个 USER 点停用 / 启用（`PATCH /api/admin/users/:id`）。
4. 「活动管理」「资讯管理」→ 新建 → 编辑 → 删除，各走一遍完整 CRUD。
5. 越权验证：
   - 未登录直接请求 `http://localhost:3001/api/users/me` 或 `/api/admin/users` → `401 / code=40100`；
   - 用 USER 的 token 请求 `/api/admin/**` → `403 / code=40300`（前端 `AdminRoute` 也会给出无权限提示，但真正的安全边界在后端 Guards）。

### 演示模式：零后端也能看效果

- **看真实界面录屏与截图**：本地相对路径点开 [`docs/demo.webm`](docs/demo.webm) 看真实全栈 `apps/web` 界面录屏，或看 `docs/screenshot-*.png` 五张实际截图；二者都在仓库内、零外部请求、无需任何服务。
- **看真实 SPA 而不起后端**：在 `apps/web` 起前端时设 `VITE_USE_MOCK=true`，前端切到 mock adapter，官网与后台展示页照常渲染；此模式下所有响应来自前端 mock，不是真实数据库。默认 `VITE_USE_MOCK=false` 才接真实 API。

## 📦 怎么部署（如实，勿编造）

本模板当前面向**本地运行**，下面只有两条真实可走的本地路径。（仓库内没有 Dockerfile、也没有线上环境的发布配置；CI 只做质量门禁，不发布产物。）若要在服务器上对外提供服务，需自行补充构建镜像与反向代理，可参考 [`docs/STANDALONE.md`](docs/STANDALONE.md)。

### 路径一：开发模式（源码直接跑）

```bash
cp .env.example .env
docker compose up -d                 # 仅起 PostgreSQL 16（server / web 在 compose 里为预留 profile）
pnpm install
pnpm --filter @campus-go/shared run build
pnpm --filter @campus-go/server exec prisma generate
pnpm --filter @campus-go/server exec prisma migrate deploy
pnpm --filter @campus-go/server run seed
pnpm --filter @campus-go/server run start   # 后端  http://localhost:3001
pnpm --filter @campus-go/web run dev        # 前端  http://localhost:5173
```

> 说明：`docker-compose.yml` 中的 `server` / `web` 仍挂在 `profiles: ["apps"]` 下，是尚未接入 Dockerfile 的占位（compose 文件内已有 `TODO` 注释），**不要**把它当成可直接 `docker compose up` 起前后端的可用能力；前后端按上面的 `pnpm` 命令本地起即可。

### 路径二：Release v0.2.0 一键分发包

Release 附件 `campus-go-standalone-0.2.0-clean.tar.gz`（80,374,873 B，sha256 `a0c6df5d6135fdc20d23e9756f09ff042ac10b5fe12a32933494160bd2c0f2da`）是把后端构建产物、前端静态产物与 PostgreSQL 16 收敛成的独立目录，解压后一条命令拉起：

```bash
tar -xzf campus-go-standalone-0.2.0-clean.tar.gz
cd standalone
./bin/campus-go start        # 首次自动建库 + seed；端口以启动日志为准
```

前置：Docker（守护进程运行中）+ Node.js 20+（运行期 server 与静态服务都是 Node 进程，没有被编译成单二进制）。

默认端口（刻意避开开发实例的 5432 / 3001 / 5173）：

| 入口 | 地址 |
|---|---|
| 官网首页 | <http://localhost:15173/> |
| 后端 API（同源代理） | <http://localhost:15173/api> |
| 后端 API（直连） | <http://localhost:13001/api> |
| PostgreSQL 宿主端口 | `55432` |

> 该分发包自身也写明「不声称开箱即用」：运行期仍需 Docker + Node 20，数据库跑在 Docker 里。详细前置、变量覆盖与排错见 [`docs/STANDALONE.md`](docs/STANDALONE.md)。

## 🔧 怎么套用到自己的项目

1. **以本模板为起点**：`git clone https://github.com/0xAmoxicillin/campus-go.git && cd campus-go`（或 fork 到你名下）。
2. **改品牌 / 站点文案**（先改集中配置，再改页面与样式）：
   - 集中品牌配置：`apps/web/src/config/site.ts`（`siteConfig`：品牌名 / 英文名 / 标语 / 页脚联系邮箱 / 版权 / 导航，Navbar·Footer·AdminSidebar 都引用它，改这里即可把整套官网与后台换皮）；
   - 产品名与页面 `<title>`：`apps/web/index.html`；
   - 导航 / 页脚 / Hero Slogan / 栏目文案：`apps/web/src/components/layout/` 与 `apps/web/src/pages/`；
   - 主题主色、圆角、字体：`apps/web/tailwind.config.js` 与 `apps/web/src/index.css` 的设计令牌。
3. **改内容数据**：活动 / 资讯 / 用户信息走接口（`GET /api/activities`、`/api/posts`、`/api/admin/**`），接自己的数据源或在后台里录入即可，不必改页面结构；用 `VITE_USE_MOCK=true` 演示模式时数据来自前端 mock，真实模式由后端接口提供。
4. **启动看效果**：按「怎么用」真实模式起全栈，或用 `VITE_USE_MOCK=true` 演示模式零后端预览；也可本地点开 [`docs/demo.webm`](docs/demo.webm) 看真实界面录屏。
5. **接自己的后端**：只要保持 [`docs/api-contract-v0.1.md`](docs/api-contract-v0.1.md) 的统一响应体与端点形状，把 `.env` 里的 `VITE_API_BASE_URL` 指向你的服务即可；契约有变化时同步更新 `packages/shared` 与契约文档、Swagger 保持一致。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + React Router + Zustand + Framer Motion |
| 后端 | Node.js 20 + NestJS 10 + Prisma 5 + PostgreSQL 16 |
| 鉴权 | JWT（access 15m / refresh 7d，刷新轮换）+ bcrypt + `USER`/`ADMIN` 双角色 + 接口级 Guards |
| 共享契约 | `packages/shared`：DTO / zod schema / `ErrorCode` / 角色与状态枚举，前后端共用单一来源 |
| API | RESTful，全局前缀 `/api`，统一响应体与错误码，Swagger(OpenAPI) 在 `http://localhost:3001/docs` |
| 测试 | Vitest（前端单元）/ Jest + Supertest（后端）/ Playwright（契约回归 + 真实服务 E2E） |
| 工程化 | pnpm workspace 单仓三包 + ESLint + TypeScript + GitHub Actions CI + Docker Compose |

## API 概览

契约事实来源：[`docs/api-contract-v0.1.md`](docs/api-contract-v0.1.md)。Base URL `/api`；全部响应统一为 `{ code, message, data }`，成功 `code=0`（`ErrorCode.OK`）；错误码 `40100` 未登录、`40300` 越权、`40900` 冲突。

**`data` 形状**：

| 响应类型 | `data` 形状 | 端点示例 |
|---|---|---|
| 单点资源 | 统一再包一层 key | `GET /api/activities/:id` → `data.activity`；`GET /api/posts/:id` → `data.post`；`POST /api/activities/:id/join` → `data.enrollment`；`GET` / `PATCH /api/users/me` 与 `PATCH /api/admin/users/:id` → `data.user`；`POST` / `PATCH /api/admin/activities[/:id]` → `data.activity`；`POST` / `PATCH /api/admin/posts[/:id]` → `data.post` |
| 分页列表 | `{ items, total, page, pageSize }` | `GET /api/activities` · `/posts` · `/admin/users` · `/admin/activities` · `/admin/posts` |
| Auth 令牌对 | `{ user, accessToken, refreshToken }`（及 refresh 的 `{ accessToken, refreshToken }`） | `POST /api/auth/register` · `/login` · `/refresh` |
| 无返回体 | `null` | `POST /api/auth/logout`、`DELETE /api/admin/activities/:id` · `/api/admin/posts/:id` |

> 单点响应一律是 `{ "code": 0, "message": "ok", "data": { "activity": { … } } }` 这样的**两层结构**，不要把 `data` 直接当资源对象用；分页列表与 Auth 令牌对、DELETE null 保持上表原样。公开列表 / 详情只返回 `PUBLISHED` 内容。

| 分组 | 端点 | 权限 |
|---|---|---|
| Auth | `POST /api/auth/register` · `/login` · `/refresh` · `/logout` | 公开 |
| 用户自助 | `GET` / `PATCH /api/users/me`（PATCH 仅允许 `{name}`） | USER / ADMIN（Bearer） |
| 官网内容 | `GET /api/activities` · `/activities/:id` · `/posts` · `/posts/:id`，`POST /api/activities/:id/join` | 列表详情公开；报名需登录 |
| 管理员 | `GET /api/admin/users`，`PATCH /api/admin/users/:id` | 仅 ADMIN |
| 管理员 | `GET/POST /api/admin/activities`，`PATCH/DELETE /api/admin/activities/:id` | 仅 ADMIN |
| 管理员 | `GET/POST /api/admin/posts`，`PATCH/DELETE /api/admin/posts/:id` | 仅 ADMIN |

`user` / `enrollment` 视图固定白名单字段，**绝不返回 `passwordHash`**；`user` 视图为 `{id,email,name,role,status,createdAt}`，且 `PATCH /api/users/me` 不会改动 `email` / `role` / `status`。Swagger 注解与端点由 NestJS 生成：`http://localhost:3001/docs`。

## 安全与隐私（要点）

- **RBAC 红线**：注册接口硬编码 `role=USER`，请求体即便带 `role=ADMIN` 也一律忽略；初始管理员只由 `prisma/seed.ts` 种子脚本创建，不开放注册。
- **接口级边界**：`JwtAuthGuard + RolesGuard` 兜底，`/api/admin/**` 未登录 `401/40100`、USER 越权 `403/40300`；前端路由守卫只做体验分流。
- **口令与密钥**：密码哈希后落库，绝不落明文、不进日志与响应；JWT 短时 access(15m) + refresh(7d) 轮换；`JWT_*`、`POSTGRES_PASSWORD`、`ADMIN_SEED_PASSWORD` 全部从 `.env` 读取，`.env` 已 `.gitignore`，**绝不入库**。

## 目录结构

```
campus-go/
├── apps/
│   ├── web/                 # React 18 + Vite 官网 SPA / 登录注册 / 左栏后台控制台
│   └── server/              # NestJS + Prisma：Auth / RBAC / 内容 / Admin CRUD / Swagger
├── packages/shared/         # 共享 DTO · zod schema · ErrorCode · 角色枚举（契约单一来源）
├── scripts/
│   ├── e2e/                # 契约结构回归 + 真实服务 E2E
│   ├── capture-demo.mjs     # 真实 apps/web 界面录屏 / 截图脚本（Playwright）
│   └── check-version-consistency.sh
├── docs/
│   ├── demo.webm            # 真实 apps/web 界面录屏（WebM/VP9，中文硬字幕 + AI 中文旁白 + 轻音乐）
│   ├── screenshot-*.png     # 对运行中 apps/web 实际截取的 5 张真实截图
│   ├── design-v0.1.md / api-contract-v0.1.md / collaboration-v0.1.md
├── .github/workflows/ci.yml # 质量门禁 + 真实服务 E2E job
├── docker-compose.yml       # PG16（+ apps profile 预留 server/web）
├── .env.example             # 占位符模板（真实 .env 不入库）
├── pnpm-workspace.yaml / pnpm-lock.yaml / package.json
└── README.md
```

## License

MIT（见 [`LICENSE`](LICENSE)）。本模板为演示与学习用途，真实部署前请替换所有占位密钥并做安全评估。
