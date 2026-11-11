/**
 * 管理员种子脚本（仅 M1 基础设施）
 * - 仅使用环境变量 ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD 创建 ADMIN；
 * - 注册接口绝不产生 ADMIN（安全红线）；
 * - 密码经 bcrypt 哈希，绝不落明文、绝不打印到日志/响应；
 * - 若已存在同名邮箱管理员则跳过创建（可重复执行、幂等）。
 * 运行：ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... npx ts-node -r tsconfig-paths/register prisma/seed.ts
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      '缺少环境变量 ADMIN_SEED_EMAIL 或 ADMIN_SEED_PASSWORD，请在 .env 中按 .env.example 配置（切勿使用真实密钥）。',
    );
  }
  if (password.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD 长度至少为 8 位。');
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // 已存在：保证其角色为 ADMIN（注册链路无法创建 ADMIN，故此处安全）。
      if (existing.role !== Role.ADMIN) {
        await prisma.user.update({ where: { email }, data: { role: Role.ADMIN } });
        console.log(`[seed] 已存在用户 ${email}，已提升为 ADMIN。`);
      } else {
        console.log(`[seed] 管理员 ${email} 已存在，跳过创建。`);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, name: 'Administrator', role: Role.ADMIN },
    });
    console.log(`[seed] 已创建初始管理员：${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed] 创建管理员失败：', err instanceof Error ? err.message : err);
  process.exit(1);
});
