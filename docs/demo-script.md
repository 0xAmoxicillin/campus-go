# 校园行 CampusGo · 官网展示模版 · 产品演示分镜（M2）

> 配套页面：`docs/demo.html`（**零依赖、自包含，`file://` 双击即开**）。
> **定位主线**：这是一套「展示模版 · 拿来即套用」的可复用官网 / 后台模板，不是内部系统汇报。
> 本分镜描述 5 个场景的时间轴、旁白文案、界面动作与验证点；页面内数据全部为**合成演示数据**，
> 不含任何真实账号、密钥、线上地址或外部资源。仓库保持 PRIVATE，**不开 Pages、不附在线演示链接**。

## 0. 播放与交互

| 操作 | 效果 |
|---|---|
| 打开 `docs/demo.html` | 自动播放，从场景 01 开始 |
| `空格` / 「暂停」按钮 | 暂停 / 继续 |
| `←` / `→` | 上一 / 下一场景（跳转后暂停，便于逐帧看） |
| 顶部章节按钮 | 直达任意场景 |
| `1` / `1.5` / `2` × | 倍速切换（默认 1×） |
| `R` / 「重播」按钮 | 回到 00:00 重新播放 |

总时长约 **48 秒**（5 场景：9s / 9.5s / 9.5s / 10s / 10s）；进度条与 `MM:SS / MM:SS` 实时显示。
页面不发起任何网络请求：无 CDN、无外部字体、无 `<img src>` 外链、无 fetch/XHR；样式与脚本全部内联。

## 1. 场景总览

| # | 章节 | 时长 | 一句话 | 对应接口（契约 §3） |
|---|---|---|---|---|
| 01 | 官网浏览 | 9.0s | 3D Hero + 活动/资讯卡片，公开内容只读 | `GET /api/activities`、`GET /api/posts` |
| 02 | 注册登录 | 9.5s | 注册只产 USER，管理员登录分流 | `POST /api/auth/register`、`POST /api/auth/login` |
| 03 | 管理员后台 | 9.5s | 左栏 dashboard + KPI + 用户列表 | `GET /api/admin/users` 等 |
| 04 | 用户·活动·资讯管理 | 10.0s | 新建 / 编辑 / 删除 / 启停全流程 | `POST/PATCH/DELETE /api/admin/**` |
| 05 | 安全红线 | 10.0s | 401 / 403 / 200 三条请求对照 | `/api/admin/users` 三种身份 |

**响应形状约定**（与 `docs/api-contract-v0.1.md` 及 README「API 概览」一致，演示页日志按此写）：
- 全部响应统一为 `{ code, message, data }`，成功 `code=0`；
- **单点资源**的 `data` 再包一层 key —— `data.activity` / `data.post` / `data.enrollment` / `data.user`；
- **分页列表** `data` 为 `{ items, total, page, pageSize }`；**Auth 令牌对** `data` 为 `{ user, accessToken, refreshToken }`；**DELETE / logout** 的 `data` 为 `null`。

## 2. 分镜明细

### 场景 01 · 官网浏览（00:00 – 00:09）

**旁白（逐字显示）**
> 这是一套**校园官网展示模版**：改品牌名、换文案、换内容数据就能直接套用到自己的社团 / 赛事 / 活动官网。3D 立体 Hero、活动与资讯卡片按契约从接口取数，列表只展示 **PUBLISHED** 内容。

**界面动作**
- 模拟浏览器窗口（`localhost:5173/`），顶部导航：首页 / 活动 / 资讯 / 关于 / 登录·注册。
- Hero 渐变光晕 + CTA「探索近期活动 →」。
- 三张卡片（校园迎新跑 / 实验室开放日 / 城市骑行计划）依次上浮高亮。

**要点逐条**（1.2s 起每 1.5s 一条）
1. 可复用：官网 + 登录注册 + RBAC 后台三块解耦，clone 即改
2. 易改品牌：站名 / 导航 / 主色集中在 `apps/web` 与设计令牌
3. 一键启动：`docker compose` + `pnpm install` 即可起全栈

---

### 场景 02 · 注册登录（00:09 – 00:18.5）

**旁白**
> 模板自带完整鉴权样板：密码 ≥8 位、**bcrypt 哈希** 落库，返回 user 视图与 access / refresh token。注册**硬编码 role=USER**，请求体带 role=ADMIN 也一律忽略——拿去复用时红线也已替你兜好。

**界面动作（时间轴，相对本场景起点）**

| t | 动作 |
|---|---|
| 0.9s | 邮箱输入框进入 typing 状态 |
| 2.2s | 密码框显示示例值 `Campus2026` |
| 4.2s | 提交按钮变为 `✓ 201 Created · { code: 0, data: { user, accessToken, refreshToken } }`，出现 `role = USER` 胶囊 |
| 5.6s | 显示红线批注：请求体带 role=ADMIN 一律忽略；初始 ADMIN 只由种子脚本创建 |
| 7.0s | 页签切到「登录」，按钮变为管理员登录，出现 `role = ADMIN` 胶囊 |

**要点逐条**
1. `POST /api/auth/register` → `{ code: 0, message: "ok", data: { user, accessToken, refreshToken } }`（Auth 令牌对不包第二层 key）
2. `POST /api/auth/login` · refresh 轮换（`data: { accessToken, refreshToken }`）· logout 吊销（`data: null`）
3. 初始 ADMIN 仅由 `prisma/seed.ts` 种子脚本创建

---

### 场景 03 · 管理员后台（00:18.5 – 00:28）

**旁白**
> 后台采用**左栏模块导航 + 右栏内容区**的 dashboard 版式，比堆叠式页面更好看也更好套用。KPI 与用户列表来自 **/api/admin/**，每个请求都经 JwtAuthGuard + RolesGuard 双重校验。

**界面动作**
- 左侧栏每 2s 依次高亮：总览 Dashboard → 用户管理 → 活动管理 → 资讯管理。
- 三个 KPI：注册用户 128 / 进行中活动 7 / 已发资讯 24（合成数据）。
- 用户表格含 USER / ADMIN 角色徽章与 ACTIVE 状态徽章。

**要点逐条**
1. `GET /api/admin/users` · `/activities` · `/posts`（分页）
2. 统一响应体 `{ code, message, data }`，错误同步 code 语义
3. 前端 AdminRoute 只做体验分流，接口层才是边界

---

### 场景 04 · 用户·活动·资讯管理（00:28 – 00:38）

**旁白**
> 内容不写死在页面里：用户启停、活动与资讯**新建 / 编辑 / 删除**都走真实接口，换成自己的数据源即可复用这套后台。删除返回 data:null，仍保持统一响应体。

**界面动作（时间轴）**

| t | 动作 | 日志行 |
|---|---|---|
| 1.5s | 活动列表新增「城市骑行计划」 | `> POST /api/admin/activities → 201 { code: 0, data: { activity } }` |
| 3.8s | 编辑后标题变为「城市骑行计划 · 更新版」 | `> PATCH /api/admin/activities/:id → 200 { code: 0, data: { activity } }` |
| 6.2s | 用户状态 ACTIVE → DISABLED | `> PATCH /api/admin/users/:id → 200 { code: 0, data: { user: { status: "DISABLED", … } } }` |
| 8.0s | 删除资讯 | `> DELETE /api/admin/posts/:id → 200 { code: 0, data: null }` |

**要点逐条**
1. `POST` / `PATCH` / `DELETE /api/admin/activities` · `/posts`（单点响应均为 `data.activity` / `data.post` 包装）
2. `PATCH /api/admin/users/:id` 改 status / role（启停），返回 `data.user`
3. 报名 `POST /api/activities/:id/join` 返回 `data.enrollment`，去重与容量 409

---

### 场景 05 · 安全红线（00:38 – 00:48）

**旁白**
> 模板把安全边界也一并交付：未登录 **401 / 40100**、USER 越权 **403 / 40300**、ADMIN 正常 200。前端路由守卫只做体验，**接口级 Guards 才是边界**；真实服务 E2E 对越权与 CRUD 做回归断言。

**界面动作（时间轴）**

| t | 响应 |
|---|---|
| 1.2s | `401 { "code": 40100, "message": "未登录或 token 无效", "data": null }` |
| 3.6s | `403 { "code": 40300, "message": "权限不足", "data": null }` |
| 6.4s | `200 { "code": 0, "message": "ok", "data": { "items": [...], "total": 3 } }` |

底部盾牌卡片：JwtAuthGuard + RolesGuard 是安全边界；密码 bcrypt 哈希、JWT 短时 access + refresh 轮换、密钥不入库。

**要点逐条**
1. 拿来即套用：clone → 改品牌文案 → 换内容数据 → 启动
2. JWT 短时 access(15m) + refresh(7d) 轮换 · 密钥只从 `.env` 读
3. 零后端看效果：`VITE_USE_MOCK=true` 或双击本演示页

## 3. 与真实产品的边界（如实说明）

- 本页是**离线产品演示**：所有数据为内联合成数据，界面为 HTML/CSS 模拟，用于说明这套「展示模版 · 拿来即套用」的交互、定位与权限模型，**不是**运行中的 `apps/web` 截图，也不替代真实服务 E2E。
- 真实可运行的功能以 README「快速开始」为准：PG16 → migrate → seed → server(3001) + web(5173) → 浏览器走通注册/登录/后台 CRUD；零后端看效果可用 `VITE_USE_MOCK=true` 演示模式或双击本演示页。
- 真实端到端回归由 `scripts/e2e/specs/real-service.spec.ts`（`E2E_MODE=real`）覆盖；它在 CI 中由 PG16 service 容器 + server + web 真实启动后执行。
- `docs/screenshot-*.png` 是本演示页用无头 Chromium 实际截取的画面，README 引用的是这些**仓库内真实存在**的文件。

## 4. 自测清单

- [ ] 断开网络后双击 `docs/demo.html` 仍可播放、切场景、倍速、重播。
- [ ] 浏览器 DevTools Network 面板显示 0 个外部请求。
- [ ] 控制台无报错；`window.__campusDemo.state()` 可读当前场景/进度/倍速。
- [ ] 键盘 `空格` / `←` / `→` / `R` / `1` / `2` 均生效。
- [ ] 页面不含任何在线演示、视频或 Pages 链接。
