# 校园行 CampusGo · 协作与 PR 规范 v0.1（项目组长定稿）

> 适用：三位工程师各自私有桌面 clone 同一远程仓；**远程 git 仓库是唯一代码来源**（沿用团队既定方案）。
> 本文件与 `docs/design-v0.1.md`、`docs/api-contract-v0.1.md` 一起，构成 `v0.1-baseline` 基准提交的一部分。

## 0. 唯一基准

- 仓库：`https://github.com/0xAmoxicillin/campus-go.git`（**Private**）
- 基准提交 tag：`v0.1-baseline`。**三方一律从此同一提交取码**，禁止跨桌面贴代码 / 传文件。
- 开工前各自确认：`git rev-parse HEAD` 与基准一致；每日 `git fetch && git rebase origin/develop`，避免版本分叉。
- 全栈与测试工程师负责在联调阶段做**版本一致性校验**（三方 HEAD 指向同一提交才放行）。

## 1. 分支模型

| 分支 | 用途 | 谁可合入 |
|---|---|---|
| `main` | 受保护，仅放已验收可交付状态 | 仅项目组长（经 PR + Review 批准） |
| `develop` | 集成主线，所有 feature 合到这里 | 仅项目组长（经 PR + Review 批准） |
| `feature/<scope>-<short>` | 各人开发分支，如 `feature/server-auth`、`feature/web-home` | 本人 |
| `fix/<short>` | 修复分支 | 本人 |

## 2. 流程门禁（重要：替代平台分支保护）

> ⚠️ 本仓为**私有仓 + 免费套餐**，GitHub 的 Branch Protection 与 Rulesets API 均返回 403（要求升级 Pro 或改公开仓）。改公开仓违背用户的「私有」要求，故**不启用平台强制**，改由以下流程强制，效果等价。

1. **禁止**任何人直接 `git push origin main` 或 `origin develop`。
2. 所有改动在自己的 `feature/*` / `fix/*` 分支提交，推送本人 feature 分支。
3. 对 **`develop`** 开 Pull Request（PR 模板已就位），并在 PR 里逐条勾选验收标准。
4. **合并前置条件（缺一不可）**：
   - CI（GitHub Actions）全绿；
   - 项目组长**逐行 Review** 并批准；发现问题打回，本人修复后重新走审；
   - 涉及接口字段变更的，必须同步更新 `packages/shared` + `docs/api-contract-v0.1.md` + Swagger；
   - 无未解决的 Review 会话。
5. 由**项目组长**执行合并（squash/merge），其他人不得自行合并。
6. `main` 仅在里程碑验收通过后，由项目组长从 `develop` 开 PR 合入并打新 tag。

## 3. 提交与代码规范

- 约定式提交：`feat:` / `fix:` / `chore:` / `docs:` / `test:` / `refactor:`，例：`feat(server): 接入 JWT 刷新轮换`。
- 提交信息结尾附：`Co-Authored-By: Claude Code <noreply@anthropic.com>`。
- PR 描述结尾附：`🤖 Generated with [Claude Code](https://claude.com/claude-code)`。
- ESLint + Prettier + 类型检查必须通过；新接口必须有对应测试。

## 4. 三条红线（Review 一票否决）

1. **安全**：注册接口硬编码 `role=USER`，请求体带 role 一律忽略；初始管理员只由种子脚本产生；密码 bcrypt 哈希；接口级 Guards 兜底越权（USER 访问 `/api/admin/**` 必须 403）。
2. **契约**：统一响应体 / 错误码 / 字段命名以 `docs/api-contract-v0.1.md` 为准，禁止私自改字段；契约变更走 PR 通知全组。
3. **版本**：不贴代码、不跨桌面传文件，一切以远程仓同一提交为准。

## 5. 并行协作时序（契约先行）

```
M1  后端：packages/shared + Prisma schema/migration + Swagger 契约 + docker-compose + 种子脚本  (PR#1)
    前端：并行启动，按契约 + shared 类型做 mock adapter、设计系统、官网静态页             (PR#2)
    全栈：一键环境、CI 加真实门禁、E2E 骨架、版本一致性校验脚本                          (PR#3)
        └─ 三者互不依赖，可同时开；均对 develop 开 PR → CI 绿 → 项目组长逐行 Review
M2  前端按 Swagger 实接后端 ‖ 后端实现 Auth/RBAC/Admin 接口（各自 PR）
M3  全栈联调 + E2E（注册/登录/权限分流/越权/官网）跑通
M4  安全 / 性能 / 3D 视觉打磨
M5  项目组长逐行审 → 打回修复 → 达标合并 → 给用户汇总结论
```

## 6. 本地一键启动（交付形态：本地可复现，暂不上线）

```bash
cp .env.example .env      # 按注释替换占位符
docker compose up         # PostgreSQL + server + web
```
`.env` 已在 `.gitignore` 中，**绝不提交真实密钥**。
