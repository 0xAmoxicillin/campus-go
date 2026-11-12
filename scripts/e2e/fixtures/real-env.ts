// ---------------------------------------------------------------------------
// 真实服务 E2E 的环境配置（M2）
//
// 与 M1 的 page.route 拦截层不同，真实模式打的是运行中的 NestJS + PostgreSQL：
//   - ENTRY_URL  : Vite dev server（默认 http://localhost:5173）
//   - API_BASE   : NestJS /api 前缀（默认 http://localhost:3001/api）
//   - 管理员账号 : ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD（种子脚本创建）
//
// CI 中由 ci.yml 的 postgres service 容器与前置步骤提供 DATABASE_URL 和种子账号；
// 本地按 README「本地启动与验证」在 .env 配置后执行 `pnpm run test:e2e:real`。
//
// 安全说明：本文件及所有 E2E 代码**不含任何真实密钥**。测试口令是每次 CI 运行
// 由 workflow 用 openssl 生成的随机值，只经环境变量注入该次运行的容器；
// 本地口令来自用户自己的 .env（.gitignore 已忽略），绝不落进仓库。
// ---------------------------------------------------------------------------

export const API_BASE = (process.env.E2E_API_BASE ?? 'http://localhost:3001/api').replace(/\/$/, '');
export const ENTRY_URL = (process.env.E2E_ENTRY_URL ?? 'http://localhost:5173').replace(/\/$/, '');
export const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@campusgo.local';

/**
 * 管理员口令：必须来自环境变量（种子脚本用同一个值创建账号）。
 * 若缺失则为空串，真实用例会给出清晰的失败提示，不会伪装通过、也不会猜测口令。
 */
export const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? '';

/** 每次运行生成唯一邮箱，避免重复执行时 409 冲突（测试隔离）。 */
export function uniqueEmail(prefix: string): string {
  const tag = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${prefix}-${tag}@campusgo.local`;
}

/**
 * 符合注册密码规则的测试口令（≥8 位，含大小写与数字）。
 * 这是公开的、非机密的测试输入，仅用于新建随机邮箱的测试账号；不是任何人的凭据。
 */
export const TEST_PASSWORD = 'CampusGo2026Test';

/** 真实服务模式开关：只有显式 E2E_MODE=real 时运行真实服务用例。 */
export const REAL_MODE = (process.env.E2E_MODE ?? '').toLowerCase() === 'real';
