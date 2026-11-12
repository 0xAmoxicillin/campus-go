# CampusGo 独立分发包 / 一键启动（Standalone）

把 `apps/server`（NestJS 构建产物）、`apps/web`（Vite 静态产物）与 PostgreSQL 16
收敛成一个可挂到 GitHub Release 的分发目录 / 压缩包，用一条命令拉起整套本地环境。

**本方案不改任何业务逻辑**（auth / CRUD / 路由 / 响应形状、前后端源码均零改动）。
前端静态托管与 `/api` 反向代理由随包分发的零依赖 Node HTTP server 完成，因此
不需要给 server 增加静态托管模块，也不改 `ci.yml` 或任何 CI 产物配置。

## 1. 前置条件（如实说明，不是「零依赖 / 双击即跑」）

| 依赖 | 要求 | 用途 | 是否必须 |
| --- | --- | --- | --- |
| Docker Desktop | 已安装**且守护进程正在运行** | 运行 PostgreSQL 16 容器 | 必须 |
| `docker compose` | v2（Docker Desktop 自带） | 编排 PG 服务 | 必须 |
| Node.js | **>= 20** | 运行 NestJS server 与内置静态服务器 | 必须 |
| pnpm | **>= 9** | **仅重新构建分发包时需要**；直接用现成分发包不需要 | 构建时需要 |
| 网络 | 首次需联网 `pnpm install`、拉取 `postgres:16-alpine` 镜像 | 安装依赖 / 拉镜像 | 首次需要 |

- 运行期**仍需要 Node.js**：server 与 web 静态服务器都是 Node 进程，并没有被编译成单个可执行二进制。
- 数据库跑在 Docker 里，所以 **Docker 是硬性前置**。
- `.env.example` 里的 `CHANGE_ME_*` 都是占位值，仅供本地演示；部署前必须替换
  `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `POSTGRES_PASSWORD` / `ADMIN_SEED_PASSWORD`，且绝不提交 `.env`。

## 2. 构建分发包

在仓库根目录：

```bash
bash scripts/build-standalone.sh
```

脚本依次执行：`pnpm install --frozen-lockfile` → `prisma generate` → 构建 shared →
构建 server（`nest build`）→ 构建 web（`vite build`，`VITE_API_BASE_URL=/api`）→
`pnpm deploy` 收敛成单一目录 → 打 `.tar.gz`。

产出（都在 `dist/`，已被 `.gitignore`，**不进 PR**）：

```
dist/standalone/                              单一可分发目录
dist/campus-go-standalone-0.1.0.tar.gz        供 GitHub Release 附件使用
```

`dist/standalone/` 内含：启动器 `bin/campus-go`、静态服务器 `bin/static-server.cjs`、
自包含后端运行时 `apps/server/`（含已构建的 `dist/`、`prisma/` migrations + seed、
`node_modules/`，Prisma Client 已在包内重新生成）、前端静态产物 `apps/web/dist/`、
`docker-compose.yml`、`.env.example`、包内 `README.md`。

> 为什么用 `pnpm deploy`：pnpm 的依赖是符号链接，且 Prisma Client 生成在 `.pnpm/`
> 里带哈希的目录中，直接 `cp -R node_modules` 会断链。`pnpm deploy` 会把 workspace
> 依赖与全部运行时依赖摊平成真实文件；devDependencies 里的 `prisma` CLI、`ts-node`、
> `tsconfig-paths` 也随包分发，供首次迁移与 seed 使用。

## 3. 一条命令启动

解压分发包后，在包根目录（或直接在仓库根目录）执行：

```bash
./bin/campus-go start
```

`start` 依次完成（首次运行自动建库 + seed）：

1. `docker compose up -d postgres` —— 拉起 PG16（项目名 / 容器名按分发目录路径
   生成稳定后缀 `campusgo-<hash>`，同一目录复用同一容器与数据卷，多个解压副本互不干扰）；
2. 等待 PG healthcheck 变为 `healthy`；
3. `prisma migrate deploy` —— 建表 / 迁移（幂等，可重复执行）；
4. `prisma/seed.ts` —— 用 `.env` 的 `ADMIN_SEED_*` 种子初始管理员（幂等）；
5. 启动 `apps/server/dist/main.js`（`SERVER_PORT`，默认 3001）；
6. 启动内置静态 server 托管 `apps/web/dist`（`WEB_PORT`，默认 5173），并把
   `/api`、`/docs`、`/health` 反向代理到 server。

启动成功后打印访问地址：

| 入口 | 地址 |
| --- | --- |
| 官网首页 | <http://localhost:5173/> |
| 后端 API（同源代理） | <http://localhost:5173/api> |
| 后端 API（直连） | <http://localhost:3001/api> |
| Swagger | <http://localhost:3001/docs> |

前端构建时固定 `VITE_API_BASE_URL=/api`，浏览器只与 web 同源通信，因此无需
在前端硬编码 server 端口，也不依赖 CORS 白名单。

## 4. 停止 / 重启 / 状态 / 日志

```bash
./bin/campus-go stop        # 停 server / web 进程 + 停 PG 容器（保留数据卷）
./bin/campus-go start       # 再次启动，数据不丢（migrate/seed 幂等）
./bin/campus-go restart     # 等价于 stop + start
./bin/campus-go status      # 打印 PG / server / web 状态与端口
./bin/campus-go logs 80     # 查看 server / web 最近 80 行日志
```

`start` 是幂等的：若检测到本启动器之前拉起的进程，会先停掉再重新拉起。
`stop` **保留** `postgres-data` 数据卷，所以 stop → start 后用户、活动、资讯数据仍在。

## 5. 端口与配置

全部变量可用仓库根目录的 `.env`（或 `.env.local`，优先级更高）覆盖；
启动器会把合并后的运行期配置写到 `.run/campus-go.env`（已被 `.gitignore`），
并在 `.run/compose.override.yml` 里仅覆写宿主端口与容器名，不改动仓库自带
`docker-compose.yml`。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `POSTGRES_PORT` | `5432` | PG 宿主端口；被占用时改这里 |
| `SERVER_PORT` | `3001` | NestJS 端口 |
| `WEB_PORT` | `5173` | 静态托管端口 |
| `POSTGRES_USER` / `POSTGRES_DB` | `campusgo` | 库名 / 用户 |
| `POSTGRES_PASSWORD` | 见 `.env.example` | 占位值，部署前替换 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | 见 `.env.example` | 占位值，部署前替换 |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | `admin@campusgo.local` / 见 `.env.example` | 初始管理员，仅 seed 使用 |
| `CORS_ORIGINS` | 自动设为 `http://localhost:${WEB_PORT}` | 由启动器按实际 web 端口生成 |
| `VITE_API_BASE_URL` | `/api`（构建期） | 前端走同源反向代理 |

## 6. 数据持久化

PG 数据落在 compose 命名卷 `postgres-data`（项目名 `campusgo-<hash>`，见本包
`.run/campus-go.env` 同级的 `compose.override.yml`）。`stop` 只停止容器、不删卷；
需要彻底清空时才在本包目录执行 `docker compose --project-name <项目名> down -v`
（会**删除所有数据**，谨慎；项目名可用 `./bin/campus-go status` 的配置行或
`docker ps --format '{{.Names}}'` 查看）。

## 7. 常见故障

| 现象 | 原因 / 处理 |
| --- | --- |
| `Docker 守护进程未运行` | 启动 Docker Desktop，`docker info` 能通再执行 start |
| `端口 xxxx 已被其他进程占用` | 在 `.env` / `.env.local` 改 `POSTGRES_PORT` / `SERVER_PORT` / `WEB_PORT` 后重试；启动器不会抢占他人服务 |
| PG 60s 未 healthy | `./bin/campus-go logs` + `docker ps --format '{{.Names}}'` 找到本包容器后 `docker logs <容器名>` 排查（常见：卷里旧密码与现 `.env` 不一致） |
| `缺少 apps/server/node_modules/.bin/prisma` | 先跑 `bash scripts/build-standalone.sh` 生成分发包 |
| `缺少 apps/web/dist/index.html` | 同上；或在仓库内执行 `VITE_API_BASE_URL=/api pnpm --filter @campus-go/web run build` |
| 首页 200 但接口 502 | server 未就绪或端口不符：看 `server.log`、`status` 里的 API 探测结果 |
| 改了 `.env` 的 PG 密码后连不上旧卷 | 卷内密码不会变：要么沿用旧密码，要么 `down -v` 重建（会清数据） |

## 8. 验证命令（实跑输出见 PR 报回）

```bash
# 首页
curl -i http://localhost:5173/                      # 期望 200，返回 index.html
# 公开 API（经同源代理）
curl -i http://localhost:5173/api/activities        # 期望 200，{"code":0,...}
# 公开 API（直连 server）
curl -i http://localhost:3001/api/activities        # 期望 200
# 登录接口可达（用 seed 管理员；密码取本次 .env）
curl -i -X POST http://localhost:5173/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@campusgo.local","password":"<ADMIN_SEED_PASSWORD>"}'
# Swagger
curl -i http://localhost:3001/docs                  # 期望 200
# 重复启动
./bin/campus-go stop && ./bin/campus-go start && curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/
# 状态
./bin/campus-go status
```

> 仓库内没有 `/health` 路由（server 只把 `health` 从全局前缀里排除，并未注册该 controller），
> 因此用契约里的公开端点 `GET /api/activities` 作为 API 可达性探针——与 CI 的
> `e2e-real` job 一致。登录接口用 `POST /api/auth/login` 验证鉴权链路。
