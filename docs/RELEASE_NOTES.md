# Release Notes 草稿 · CampusGo 校园行 v0.2.0（M2）

> 本文是 GitHub Release 正文草稿，供负责人在 **CI 真实联通门禁转绿后** 统一发布时定稿使用。
> 截至本草稿：未打 tag、未发 Release、未改根 `package.json` 版本号（仍为 `0.1.0`）。仓库为 PRIVATE，不开 GitHub Pages。

---

## 做了什么

M2 在 M1 基线之上落地了**真实全栈能力**，三路（前端后台 #4、服务端 Auth/RBAC/CRUD #5、DevOps 真实服务 E2E 与 CI 门禁 #6）按统一契约 `docs/api-contract-v0.1.md` 对齐后合并进 `develop`（tip `3f2d5ee`）：

- **真实认证与鉴权**：bcrypt 密码哈希 + JWT。Access Token 默认 `15m`、Refresh Token 默认 `7d`，刷新令牌轮换（旧 token 立即吊销）。接口级 `JwtAuthGuard + RolesGuard`：未登录 → `401 / code=40100`，角色不足 → `403 / code=40300`。注册硬编码 `role=USER`，忽略请求体中的 `role`（安全红线）。
- **管理端与内容**：用户启停、活动 / 资讯真实 CRUD（含活动报名）。
- **前端后台**：官网实接真实 API（默认 `VITE_USE_MOCK=false`；置 `true` 走前端 mock adapter，零后端也能看效果）+ 后台左栏 dashboard 与完整 CRUD 界面。
- **单点响应统一包装**：所有单点资源统一包一层 key（`data.activity` / `data.post` / `data.user` / `data.enrollment` …），服务端 `ResponseInterceptor`、前端解包、mock adapter 三路按契约 §3 对齐。
- **真实服务 E2E 与 CI 门禁**：Playwright 真实联通套件（PG16 → migrate → seed → NestJS + Vite）；CI `quality-gate` 用 `--frozen-lockfile`，并新增 `e2e-real` job 在 PG16 service 下跑真实服务联通。
- **真实产品录屏与截图**：`docs/demo.webm`（真实全栈界面录屏）+ 5 张真实运行截图，替换此前自创演示页。

---

## 怎么验证

**真实全栈（需要 PostgreSQL 16 + 后端）：**

```bash
cp .env.example .env                  # 按注释替换占位符；.env 已被忽略，切勿提交
docker compose up -d                 # 启动 PostgreSQL 16
pnpm install                         # 与 CI 一致：--frozen-lockfile
pnpm --filter @campus-go/shared run build
pnpm --filter @campus-go/server exec prisma generate
pnpm --filter @campus-go/server exec prisma migrate deploy
pnpm --filter @campus-go/server run seed
pnpm --filter @campus-go/server run start     # http://localhost:3001  · Swagger /docs
pnpm --filter @campus-go/web run dev          # http://localhost:5173  · VITE_USE_MOCK 不置 true
```

浏览器按 `README.md`「真实模式」顺序走通：注册普通账号 → 用种子 ADMIN 登录进 `/admin` → 用户启停 → 活动/资讯 CRUD → 越权验证（未登录 401、USER 访问 `/api/admin/**` 403）。

**真实服务 E2E（需要真实 PG16 + server + web）：**

```bash
E2E_MODE=real ADMIN_SEED_PASSWORD=<.env 中的值> pnpm run test:e2e:real
```

CI 中由 `ci.yml` 的 `e2e-real` job 在 postgres service 容器下注入环境变量并起服务后运行；**本套件不会在无真实服务时伪装通过**。

**演示模式（零后端也能看效果）：**

- 直接本地相对路径打开 [`docs/demo.webm`](docs/demo.webm) 看真实全栈界面录屏，或看 `docs/screenshot-0{1..5}-*.png` 五张实际截图（均在仓库内、离线、零外部请求）。
- 在 `apps/web` 起前端时设 `VITE_USE_MOCK=true`，前端切到 mock adapter，官网与后台展示页照常渲染（此模式响应来自前端 mock，**不落真实数据库**）。

---

## 真实产品录屏与截图说明

- `docs/demo.webm`：真实运行的 `apps/web` SPA，接真实全栈（Docker PG16 → `prisma migrate deploy` → `seed` → NestJS(3001) → Vite(5173)），录制时 `VITE_USE_MOCK` 不置 `true`，默认对接真实 API。画面依次展示：官网首页 Hero 与活动/资讯卡片、活动列表与详情、注册/登录、管理员后台左栏 dashboard、用户管理（含 RBAC 安全边界提示）、活动管理「新建 → 编辑 → 删除」真实落库、资讯管理，最后回到官网首页。
- `docs/screenshot-01-home.png`（官网首页）、`02-auth.png`（登录/注册）、`03-admin.png`（后台 dashboard）、`04-crud.png`（活动/资讯 CRUD）、`05-users.png`（用户管理）。均为运行中 `apps/web` 的实际截图，可离线打开。

---

## 已知边界（如实，不夸大）

- **真实联通门禁状态**：合并态的 `e2e-real` 真实服务联通在另路修复中，截至本草稿**未全绿**；PR 阶段的 `e2e-real` 是真实服务套件，仅在有真实 PG16 + server + web 时运行，**不得将「PR 阶段 e2e-real 被跳过 / 未全绿」描述为联调已通过**。
- **M1 阶段 E2E** 为契约结构回归（page.route 拦截层），验证端点存在性与响应形状，不依赖真实服务；M2 新增的真实联通 E2E 与之互不替代、互不假装。
- 真实注册 / 登录 / JWT / CRUD **需要完整后端（PG16）**；`VITE_USE_MOCK=true` 仅为前端展示，不落真实数据库。
- 当前发布版本号规划为 `v0.2.0`（功能增量升 MINOR），但根 `package.json` 仍为 `0.1.0`，实际打 tag 与发 Release 待 CI 转绿后统一执行。

---

## 红线（仓库策略）

- 仓库 **PRIVATE**，不开 GitHub Pages。
- 不提交 `.env` 或任何真实密钥 / 口令；CI 凭据均为 CI 专用公开占位值或单次运行随机生成，不落仓库、不打印。
- 三份受控文档（`docs/api-contract-v0.1.md` / `docs/collaboration-v0.1.md` / `docs/design-v0.1.md`）、`schema.prisma`、`README.md`、`packages/shared` 与 CI 配置在 M2 中未改动；本次仅新增文档。
