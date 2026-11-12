#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# CampusGo 独立分发包构建脚本
#
# 产出（全部落在 dist/，已被 .gitignore，绝不进 PR）：
#   dist/standalone/                              单一可分发目录
#   dist/campus-go-standalone-<version>.tar.gz  供 GitHub Release 使用的压缩包
#
# dist/standalone/ 目录内容：
#   bin/campus-go                一键启动器（start/stop/restart/status/logs）
#   bin/static-server.cjs       零依赖静态服务器 + /api 反向代理
#   apps/server/                NestJS 构建产物 + 自包含运行时依赖 + prisma/（migrations/seed）
#   apps/web/dist/              Vite 构建产物（VITE_API_BASE_URL=/api）
#   docker-compose.yml          仓库自带的 PG16 编排（启动器仅覆写端口/容器名）
#   .env.example                占位配置样例（不含真实密钥）
#   README.md                   分发包内的最短使用说明
#
# 用法： bash scripts/build-standalone.sh
# 前置：Node >= 20、pnpm >= 9、可联网安装依赖；构建期不要求 Docker。
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo 0.1.0)"
OUT="$REPO_ROOT/dist/standalone"
TARBALL="$REPO_ROOT/dist/campus-go-standalone-${VERSION}.tar.gz"

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "[build] 缺少命令：$1"; exit 1; }; }
need_cmd node
need_cmd pnpm
need_cmd tar

echo "===== [1/7] 安装依赖（--frozen-lockfile） ====="
pnpm install --frozen-lockfile

echo "===== [2/7] prisma generate（生成 Prisma Client） ====="
pnpm --filter @campus-go/server exec prisma generate

echo "===== [3/7] 构建 shared（server 依赖其 dist/） ====="
pnpm --filter @campus-go/shared run build

echo "===== [4/7] 构建 server（nest build → apps/server/dist） ====="
pnpm --filter @campus-go/server run build

echo "===== [5/7] 构建 web（vite build → apps/web/dist） ====="
# 前端与静态服务器同源，API 走 /api 反向代理，无需硬编码 server 端口。
VITE_API_BASE_URL=/api pnpm --filter @campus-go/web run build

echo "===== [6/7] 收敛成单一分发目录 $OUT ====="
rm -rf "$OUT"
mkdir -p "$OUT/bin" "$OUT/apps"

# 启动器、静态服务器与编排/配置样例
cp bin/campus-go "$OUT/bin/campus-go"
cp bin/static-server.cjs "$OUT/bin/static-server.cjs"
chmod +x "$OUT/bin/campus-go"
cp docker-compose.yml "$OUT/docker-compose.yml"
cp .env.example "$OUT/.env.example"
# 运行期产物（.run/ 含合并后的 .env、.logs/ 日志）在解压后的包里同样不入库/不外带。
cat > "$OUT/.gitignore" <<'EOF'
.run/
.logs/
.env
.env.local
node_modules/
EOF

# 前端静态产物（保持与仓库一致的 <root>/apps/web/dist 路径，供启动器读取）
mkdir -p "$OUT/apps/web"
cp -R apps/web/dist "$OUT/apps/web/dist"

# 后端：用 pnpm deploy 产出「自包含」运行时目录。
# 为什么不用简单 cp -R apps/server/node_modules：pnpm 的依赖是符号链接，
# 且 Prisma Client 生成在 .pnpm/ 里带哈希的目录中，直接拷贝会断链。
# pnpm deploy 会把 workspace 依赖（@campus-go/shared，含已构建的 dist/）与
# 全部运行时/构建期依赖摊平成真实文件；devDependencies 里的 prisma CLI、
# ts-node、tsconfig-paths 也随包分发，供首次 migrate/seed 使用。
pnpm --filter @campus-go/server deploy "$OUT/apps/server"

# deploy 目录内再 generate 一次：让 @prisma/client 的生成产物落在包内，
# 而不是依赖构建机的 pnpm store。
echo "----- 在分发包内重新生成 Prisma Client -----"
(cd "$OUT/apps/server" && ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma)

# 移除分发包不需要的源码与测试文件（业务代码不动，只删冗余）。
rm -rf "$OUT/apps/server/src" "$OUT/apps/server/dist/__tests__"

cat > "$OUT/README.md" <<'MD'
# CampusGo 独立分发包

解压后在本目录执行 `./bin/campus-go start` 即可。

前置依赖（必须满足，非「零依赖」）：
- Docker 已安装且守护进程正在运行；docker compose v2（Docker Desktop 自带）
- Node.js >= 20（server 与内置静态服务器都是 Node 进程）
- pnpm >= 9 ：仅重新构建分发包时需要，直接使用本包不需要
- 首次启动会自动拉取 PG16 镜像并联网

常用命令：
- `./bin/campus-go start`    拉起 PG16 → 迁移 → seed → server → web
- `./bin/campus-go status`   查看各组件状态
- `./bin/campus-go stop`     停止（保留数据卷，下次 start 数据不丢）
- `./bin/campus-go restart`  重启
- `./bin/campus-go logs`     查看日志

默认端口：PG 5432 / server 3001 / web 5173，全部可用 .env 覆盖。
访问：官网 http://localhost:5173/ · API http://localhost:5173/api · Swagger http://localhost:3001/docs

完整说明见仓库 docs/STANDALONE.md。
MD

echo "===== [7/7] 打包为 Release 附件压缩包 ====="
rm -f "$TARBALL"
tar -czf "$TARBALL" -C "$REPO_ROOT/dist" standalone

echo
echo "===== 构建完成 ====="
echo "分发包目录 : $OUT"
echo "压缩包     : $TARBALL"
du -sh "$OUT"
du -h "$TARBALL"
echo "目录清单（顶层）："
find "$OUT" -maxdepth 2 -mindepth 1 | sed "s|$OUT/||" | sort | head -30
echo "提示：dist/ 已在 .gitignore，构建产物不会进入仓库 / PR。"
