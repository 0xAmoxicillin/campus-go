/**
 * 种子脚本（M1 基础设施 + 示例演示内容）
 *
 * 1) 管理员种子（仅 M1 基础设施）
 *    - 仅使用环境变量 ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD 创建 ADMIN；
 *    - 注册接口绝不产生 ADMIN（安全红线）；
 *    - 密码经 bcrypt 哈希，绝不落明文、绝不打印到日志/响应；
 *    - 若已存在同名邮箱管理员则跳过创建（可重复执行、幂等）。
 *
 * 2) 示例 / 演示内容（校园行官方展示模板）
 *    - 在 ADMIN 就绪后，幂等地写入若干示例活动与资讯，
 *      让本地真实服务起服务即有内容、有封面、有 CRUD 可演示；
 *    - 文案均为「示例 / 演示数据」，不冒充真实业务记录；
 *    - coverUrl 统一使用本地相对路径 /covers/<name>.webp，
 *      运行时零外部 http(s) 请求，守住离线 / 私有仓红线；
 *    - 按唯一字段 title 判重，重复执行 seed 不重复插入、不破坏已有数据。
 *
 * 3) 跨端命名锁定清单（前后端唯一约定，任一方不得单方面改名）
 *    - 本文件 DEMO 数据共 13 条 coverUrl，与前端 `apps/web/public/covers/` 一一对应，
 *      是该目录下「seed 负责部分」的唯一命名来源（前端另有其自有的 12 个 campus-*.webp）；
 *    - 锁定的 13 个文件名（均带 /covers/ 前缀，运行时零 http(s) 外链）：
 *        lab-tour.webp / ginkgo-ride.webp / hack-night.webp / newyear-concert.webp /
 *        signup-guide.webp / behind-scenes.webp / city-orienteering.webp /
 *        post-signup.webp / post-behind.webp / post-ginkgo.webp /
 *        post-lab-review.webp / post-hack-preview.webp / post-volunteer.webp
 *    - 任一侧改文件名都必须同步另一侧，禁止各用一套命名（否则本地真实模式封面 404）。
 *    - 全部为本地相对路径 `/covers/<name>.webp`，运行时零外部 http(s) 请求。
 *
 * 运行：ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... npx ts-node -r tsconfig-paths/register prisma/seed.ts
 */
import { PrismaClient, Role, ActivityStatus, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
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
}

/**
 * 示例活动数据。coverUrl 均为本地相对路径，绝不指向外部 http(s)。
 * 时间为本地时区（UTC+08:00）的 ISO 字符串，覆盖不同状态与日期。
 *
 * ⚠️ 跨端命名锁定：以下 7 个 coverUrl 为本 seed 锁定的 13 个文件名之一，
 * 与 `apps/web/public/covers/` 一一对应，任一侧改名字都必须同步另一侧（见文件顶部约定）。
 */
const DEMO_ACTIVITIES: {
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  location: string | null;
  startAt: string;
  endAt: string;
  capacity: number | null;
  status: ActivityStatus;
}[] = [
  {
    title: '实验室漫游：探秘 AI 与机器人',
    summary: '走进校园重点实验室，近距离观察 AI 训练与机械臂协作，听研究员讲幕后故事。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n我们将在理科楼集合，依次参观自然语言处理实验室、机器人实验室与可视化中心，每站约 40 分钟，含现场演示与问答。',
    coverUrl: '/covers/lab-tour.webp',
    location: '理科楼 B 座 · 一楼大厅',
    startAt: '2026-11-20T14:00:00+08:00',
    endAt: '2026-11-20T17:00:00+08:00',
    capacity: 30,
    status: ActivityStatus.PUBLISHED,
  },
  {
    title: '银杏骑行：校园秋日环线',
    summary: '沿校园最美银杏道骑行一圈，途经湖畔与老图书馆，全程约 8 公里，轻松休闲。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n南门集合，沿银杏大道—湖畔绿道—老图书馆环线骑行，中途设两个打卡点。自备单车或现场租赁均可，需佩戴头盔。',
    coverUrl: '/covers/ginkgo-ride.webp',
    location: '南门广场 · 单车驿站',
    startAt: '2026-11-15T09:00:00+08:00',
    endAt: '2026-11-15T11:30:00+08:00',
    capacity: 50,
    status: ActivityStatus.PUBLISHED,
  },
  {
    title: 'Hack Night：通宵代码马拉松',
    summary: '12 小时限时开发，组队把创意变成可运行的原型，现场导师全程陪伴。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n创客空间开放过夜，提供电源、零食与咖啡。主题不限，次日晨间进行 3 分钟 Demo 路演，优胜队伍获校园行周边礼包。',
    coverUrl: '/covers/hack-night.webp',
    location: '创客空间 · 309 室',
    startAt: '2026-12-05T19:00:00+08:00',
    endAt: '2026-12-06T07:00:00+08:00',
    capacity: 80,
    status: ActivityStatus.PUBLISHED,
  },
  {
    title: '跨年音乐会：校园行之夜',
    summary: '学生乐团与合唱队联袂献演，从民谣到管弦，陪你倒数迎接新年。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n大礼堂开场，设前区站票与二层坐席。演出含新年倒计时环节，结束后有露天小酒会与合影。',
    coverUrl: '/covers/newyear-concert.webp',
    location: '大礼堂',
    startAt: '2026-12-31T19:30:00+08:00',
    endAt: '2027-01-01T00:30:00+08:00',
    capacity: 500,
    status: ActivityStatus.PUBLISHED,
  },
  {
    title: '报名指南：如何玩转校园行',
    summary: '一份给新同学的报名说明书，从注册、选活动到现场签到一次讲清。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n将演示账号注册、活动报名、容量与候补规则、现场二维码签到等流程，欢迎带着问题来。',
    coverUrl: '/covers/signup-guide.webp',
    location: '线上 · 直播链接报名后可见',
    startAt: '2027-01-10T20:00:00+08:00',
    endAt: '2027-01-10T21:00:00+08:00',
    capacity: null,
    status: ActivityStatus.DRAFT,
  },
  {
    title: '幕后故事：活动筹备日记',
    summary: '翻开校园行团队的笔记本，看看一场活动从想法到落地经历了什么。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n已归档的筹备复盘：选址踩点、志愿者排班、应急预案与那些临时改期的深夜。',
    coverUrl: '/covers/behind-scenes.webp',
    location: '学生活动中心 · 会议室 A',
    startAt: '2026-09-01T15:00:00+08:00',
    endAt: '2026-09-01T16:30:00+08:00',
    capacity: 20,
    status: ActivityStatus.ARCHIVED,
  },
  {
    title: '城市定向越野：解锁校园周边',
    summary: '以校园为圆心向周边展开的城市探索，组队解谜打卡，集齐印章兑换徽章。',
    content:
      '【校园行 · 示例 / 演示数据】本活动为本地部署预览用的示例内容，不代表真实业务记录。\n\n西门出发，沿老街区任务点完成拍照与问答，最终回到校园广场兑换纪念徽章，全程约 5 公里。',
    coverUrl: '/covers/city-orienteering.webp',
    location: '西门 · 城市驿站',
    startAt: '2027-02-14T13:00:00+08:00',
    endAt: '2027-02-14T17:00:00+08:00',
    capacity: 100,
    status: ActivityStatus.DRAFT,
  },
];

/**
 * 示例资讯数据。coverUrl 均为本地相对路径，绝不指向外部 http(s)。
 *
 * ⚠️ 跨端命名锁定：以下 6 个 coverUrl 为本 seed 锁定的 13 个文件名之一，
 * 与 `apps/web/public/covers/` 一一对应，任一侧改名字都必须同步另一侧（见文件顶部约定）。
 */
const DEMO_POSTS: {
  title: string;
  summary: string;
  content: string;
  coverUrl: string;
  status: PostStatus;
  publishedAt: string | null;
}[] = [
  {
    title: '报名指南：2026 校园行全攻略',
    summary: '从注册到现场，一篇看懂校园行的玩法与报名要点。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n校园行是面向全校的开放活动集合：实验室开放日、骑行、音乐会与黑客松都在其中。本文带你了解如何注册账号、浏览活动、完成报名与现场签到。',
    coverUrl: '/covers/post-signup.webp',
    status: PostStatus.PUBLISHED,
    publishedAt: '2026-11-10T10:00:00+08:00',
  },
  {
    title: '幕后故事：一支活动团队的自白',
    summary: '我们如何把一场场活动从 Slack 里的表情包变成现实。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n从第一次脑暴到最后一盏灯熄灭，校园行背后是一群自愿熬夜的同学。这篇随笔记录那些没有被写进日程表的小事。',
    coverUrl: '/covers/post-behind.webp',
    status: PostStatus.PUBLISHED,
    publishedAt: '2026-11-08T18:30:00+08:00',
  },
  {
    title: '银杏季：秋日校园拍照打卡点',
    summary: '十处金黄取景地，附带最佳光线时间与构图建议。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n每年十一月，校园变成金色长廊。我们整理了十处出片率最高的点位，并标注了上午与黄昏的光影差异，方便你安排拍摄路线。',
    coverUrl: '/covers/post-ginkgo.webp',
    status: PostStatus.PUBLISHED,
    publishedAt: '2026-11-05T12:00:00+08:00',
  },
  {
    title: '实验室漫游回顾：我们看到了什么',
    summary: '上一次实验室开放日的现场速写与大家最关心的问题。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n本期回顾已归档：机械臂如何抓取不规则物体、大模型推理需要怎样的算力，以及同学们在问答环节抛出的犀利问题。',
    coverUrl: '/covers/post-lab-review.webp',
    status: PostStatus.ARCHIVED,
    publishedAt: '2026-09-15T09:00:00+08:00',
  },
  {
    title: 'Hack Night 预告：准备好你的 idea 了吗',
    summary: '通宵黑客松倒计时，主题征集与组队通道现已开放。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n距离 Hack Night 还有两周，本文介绍赛制、评审维度与奖品，并开放主题征集。草稿状态，发布前还会更新场地细节。',
    coverUrl: '/covers/post-hack-preview.webp',
    status: PostStatus.DRAFT,
    publishedAt: null,
  },
  {
    title: '跨年音乐会志愿者招募',
    summary: '舞台、票务、餐饮三组数据员，和我们一起把除夕夜办好。',
    content:
      '【校园行 · 示例 / 演示数据】本文为本地部署预览用的示例内容，不代表真实业务记录。\n\n跨年音乐会在即，现招募现场志愿者，负责入场引导、票务核验与后台餐饮协调，提供工时证明与纪念周边。',
    coverUrl: '/covers/post-volunteer.webp',
    status: PostStatus.PUBLISHED,
    publishedAt: '2026-12-10T11:00:00+08:00',
  },
];

async function seedDemoContent() {
  // 用已就绪的 ADMIN 作为示例内容的创建者，便于后台演示「谁创建的」。
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const createdById = admin?.id ?? null;

  let activityCreated = 0;
  for (const a of DEMO_ACTIVITIES) {
    const existing = await prisma.activity.findFirst({ where: { title: a.title } });
    if (existing) {
      console.log(`[seed] 示例活动已存在，跳过：${a.title}`);
      continue;
    }
    await prisma.activity.create({
      data: {
        title: a.title,
        summary: a.summary,
        content: a.content,
        coverUrl: a.coverUrl,
        location: a.location,
        startAt: new Date(a.startAt),
        endAt: new Date(a.endAt),
        capacity: a.capacity,
        status: a.status,
        createdById,
      },
    });
    activityCreated += 1;
    console.log(`[seed] 已创建示例活动：${a.title}（${a.status}）`);
  }

  let postCreated = 0;
  for (const p of DEMO_POSTS) {
    const existing = await prisma.post.findFirst({ where: { title: p.title } });
    if (existing) {
      console.log(`[seed] 示例资讯已存在，跳过：${p.title}`);
      continue;
    }
    await prisma.post.create({
      data: {
        title: p.title,
        summary: p.summary,
        content: p.content,
        coverUrl: p.coverUrl,
        status: p.status,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        createdById,
      },
    });
    postCreated += 1;
    console.log(`[seed] 已创建示例资讯：${p.title}（${p.status}）`);
  }

  console.log(`[seed] 示例内容完成：新增活动 ${activityCreated} 条、新增资讯 ${postCreated} 条。`);
}

async function main() {
  try {
    await seedAdmin();
    await seedDemoContent();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed] 种子执行失败：', err instanceof Error ? err.message : err);
  process.exit(1);
});
