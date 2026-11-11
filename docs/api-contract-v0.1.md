# 校园行 CampusGo · 统一接口契约 v0.1（契约先行 · 项目组长拍板定稿）

> 状态：v0.1 定稿（2026-11-11）｜由项目组长按设计文档 §5.3 拍板统一，三方一律以此为准。
> 本文件是**契约事实来源**：前端据此 mock 并行、后端据此实现、全栈据此写 E2E/联调、项目组长据此逐行 Review。
> 契约变更必须走 PR（改 `packages/shared` 的 DTO/zod + 更新本文件 + Swagger 同步），并在群里 @项目组长 通知全组；**禁止任一方私自改字段**。

## 0. 通用约定

- Base URL：`/api`，全部 `JSON`，UTF-8；时间统一 ISO 8601（UTC，带 `Z`）。
- **统一响应体**（所有接口，含错误）：
  ```jsonc
  // 成功
  { "code": 0, "message": "ok", "data": { /* ... */ } }
  // 分页成功
  { "code": 0, "message": "ok", "data": { "items": [], "total": 0, "page": 1, "pageSize": 20 } }
  // 失败
  { "code": 40001, "message": "参数校验失败", "data": null }
  ```
- **统一错误码**（`code` 为业务码，HTTP 状态码同步语义）：
  | code | HTTP | 含义 |
  |---|---|---|
  | 0 | 200/201 | 成功 |
  | 40000 | 400 | 通用参数错误 |
  | 40001 | 400 | 参数校验失败（class-validator / zod） |
  | 40100 | 401 | 未登录 / token 缺失或无效 |
  | 40101 | 401 | token 过期 |
  | 40102 | 401 | 账号或密码错误 |
  | 40300 | 403 | 越权（角色不足）——**RBAC 红线** |
  | 40400 | 404 | 资源不存在 |
  | 40900 | 409 | 冲突（如邮箱已注册） |
  | 42900 | 429 | 请求过于频繁（登录限流） |
  | 50000 | 500 | 服务端内部错误 |
- 鉴权：`Authorization: Bearer <accessToken>`；access 短时（15m）、refresh 长时（7d）+ 刷新轮换。
- 分页参数：`?page=1&pageSize=20`（`pageSize` 上限 100）。
- 字段命名：`camelCase`；ID 用 cuid 字符串。

## 1. 角色与权限矩阵（RBAC 唯一 truth）

角色只有两种：`USER`、`ADMIN`。

| 接口 | 访客 | USER | ADMIN |
|---|:---:|:---:|:---:|
| 官网内容 GET（activities/posts 公开） | ✅ | ✅ | ✅ |
| `POST /api/auth/register` | ✅ 仅注册为 USER | — | — |
| `POST /api/auth/login` / `refresh` / `logout` | ✅ / ✅ / ✅ | ✅ | ✅ |
| `GET/PATCH /api/users/me` | ❌ | ✅ | ✅ |
| `POST /api/activities/:id/join` | ❌ | ✅ | ✅ |
| `/api/admin/**` 全部 | ❌ 403 | ❌ 403 | ✅ |

**安全红线（Review 必查）**
- `register` 请求体即便携带 `role` 也**一律忽略/拒绝**，服务端硬编码 `role=USER`。
- 初始 ADMIN 只由服务端种子脚本创建，**不开放注册**。
- 密码 bcrypt 哈希，绝不落明文、绝不出现在日志/响应。
- 前端路由守卫只做体验；**接口级 JwtAuthGuard + RolesGuard 才是安全边界**，越权统一 403。
- Swagger 每个接口标注所需角色；登录接口限流、CORS 白名单。

## 2. 数据模型（Prisma schema 由后端落地，字段以此为准）

```
User        id, email(unique), passwordHash, name, role(USER|ADMIN), status(ACTIVE|DISABLED), createdAt, updatedAt
RefreshToken id, userId, tokenHash, expiresAt, revokedAt, createdAt        // 刷新轮换
Activity    id, title, summary, content, coverUrl, location, startAt, endAt, capacity, status(DRAFT|PUBLISHED|ARCHIVED), createdById, createdAt, updatedAt
Post        id, title, summary, content, coverUrl, status(DRAFT|PUBLISHED|ARCHIVED), createdById, createdAt, publishedAt
Enrollment  id, userId, activityId, createdAt, unique(userId, activityId) // 报名去重
```

## 3. 接口清单

### 3.1 Auth（公开）
| 方法 | 路径 | 说明 | 关键入参 → 出参 data |
|---|---|---|---|
| POST | `/api/auth/register` | 注册（仅 USER） | `{email,password,name}` → `{user,accessToken,refreshToken}` |
| POST | `/api/auth/login` | 登录 | `{email,password}` → `{user,accessToken,refreshToken}` |
| POST | `/api/auth/refresh` | 刷新（轮换） | `{refreshToken}` → `{accessToken,refreshToken}` |
| POST | `/api/auth/logout` | 登出（吊销 refresh） | Bearer + `{refreshToken}` → `null` |

> `user` 视图统一为 `{id,email,name,role,status,createdAt}`，**绝不返回 passwordHash**。
> 注册/登录密码规则：≥8 位，含大小写字母与数字；邮箱格式校验。

### 3.2 用户自助（USER / ADMIN，需登录）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/users/me` | 取当前用户资料 → `{user}` |
| PATCH | `/api/users/me` | 改自己资料，仅允许 `{name}`（email/role/status 不可在此改）→ `{user}` |

### 3.3 官网公开内容（无需登录）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/activities` | 活动列表（仅 `PUBLISHED`，分页，支持 `?q=` 搜索）→ 分页 `{items,total,page,pageSize}` |
| GET | `/api/activities/:id` | 活动详情（仅 PUBLISHED）→ `{activity}` |
| GET | `/api/posts` | 资讯列表（仅 `PUBLISHED`，分页）→ 分页 |
| GET | `/api/posts/:id` | 资讯详情（仅 PUBLISHED）→ `{post}` |
| POST | `/api/activities/:id/join` | 报名活动（需登录；容量已满/重复报名返回 409）→ `{enrollment}` |

### 3.4 管理员后台（仅 ADMIN，全部需 Bearer + RolesGuard）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/users` | 用户列表（分页，支持 `?role=&status=&q=`）→ 分页 |
| PATCH | `/api/admin/users/:id` | 改用户 `{status? , role?}`（启停 / 改角色）→ `{user}` |
| GET | `/api/admin/activities` | 活动管理列表（含 DRAFT/ARCHIVED，分页）→ 分页 |
| POST | `/api/admin/activities` | 新建活动 → `{activity}` |
| PATCH | `/api/admin/activities/:id` | 编辑活动 → `{activity}` |
| DELETE | `/api/admin/activities/:id` | 删除活动 → `null` |
| GET | `/api/admin/posts` | 资讯管理列表 → 分页 |
| POST | `/api/admin/posts` | 新建资讯 → `{post}` |
| PATCH | `/api/admin/posts/:id` | 编辑资讯 → `{post}` |
| DELETE | `/api/admin/posts/:id` | 删除资讯 → `null` |

> 所有 `/api/admin/**`：USER 访问一律 `403 / code=40300`；未登录 `401 / code=40100`。E2E 必须覆盖这两条越权路径。

## 4. 契约到代码的映射（并行不跑偏的关键）

- `packages/shared`：导出上述全部 DTO 的 TS 类型 + zod schema + `ErrorCode` 常量 + 角色枚举。**由后端工程师在 M1 落地**，前后端共用，禁止各写一份。
- 前端：按本契约 + `shared` 类型先做 `mock adapter`，`VITE_API_BASE_URL` 指向后端后即可切换；字段不符以本文件为准。
- 后端：Swagger(OpenAPI) 由 NestJS 注解生成，必须与本文件字段一致；`shared` 的 zod 与 class-validator 双向校验。
- 全栈：E2E/API 测试断言统一响应体 `code` 语义、分页结构与越权 403。

## 5. 里程碑对齐

- **M1（契约先行）**：后端交 `packages/shared` + Prisma schema/migration + Swagger 契约 + `docker-compose.yml`(PG16) + 种子脚本；前端同时并行启动（先 mock）。
- **M2**：前端官网+登录注册+控制台 ‖ 后端 Auth/RBAC/接口 并行实现。
- 契约变更一律走 PR → @项目组长 Review → 通过后通知全组并以新提交为基准。
