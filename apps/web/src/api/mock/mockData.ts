import {
  ActivityStatus,
  PostStatus,
  Role,
  UserStatus,
  type ActivityView,
  type PostView,
  type UserView,
} from '@/contracts/api-contract';

// M1 mock 用：生成 cuid 风格的字符串 ID（仅演示，真实后端使用 cuid）。
export function mockCuid(prefix = 'c'): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let s = prefix;
  for (let i = 0; i < 24; i += 1) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

export interface MockUserRecord extends UserView {
  // M1 mock 内部校验用：以 `mock$` 前缀明文保存「演示专用」密码，绝不对外返回（user 视图已剔除）。
  // 这些不是真实密钥，仅用于本地演示登录；真实后端使用 bcrypt 哈希且永不返回。
  passwordHash: string;
}

// M1 演示专用账号（非真实凭证，仅本地 mock 可登录）。
// 演示密码统一为 DEMO_PASSWORD（满足契约 §3.1：≥8 位含大小写与数字）。
// 注意：这是 mock 演示密码（明文存储于 mock 内存，仅供本地演示），
// 真实后端使用 bcrypt 哈希且永不返回 passwordHash。
export const DEMO_PASSWORD = 'CampusGo2026';

export const seedUsers: MockUserRecord[] = [
  {
    id: 'ck_admin_seed_001',
    email: 'admin@campusgo.local',
    name: '校园行管理员',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: '2026-09-01T08:00:00.000Z',
    passwordHash: `mock$${DEMO_PASSWORD}`,
  },
  {
    id: 'ck_user_seed_001',
    email: 'alice@campusgo.local',
    name: 'Alice 同学',
    role: Role.USER,
    status: UserStatus.ACTIVE,
    createdAt: '2026-09-10T08:00:00.000Z',
    passwordHash: `mock$${DEMO_PASSWORD}`,
  },
  {
    id: 'ck_user_seed_002',
    email: 'bob@campusgo.local',
    name: 'Bob 同学',
    role: Role.USER,
    status: UserStatus.ACTIVE,
    createdAt: '2026-09-12T08:00:00.000Z',
    passwordHash: `mock$${DEMO_PASSWORD}`,
  },
];

export const seedActivities: ActivityView[] = [
  {
    id: 'ck_act_seed_001',
    title: '校园开放日 · 实验室漫游',
    summary: '走进六大重点实验室，与学长学姐面对面，解锁科研初体验。',
    content:
      '活动安排：09:00 签到 · 09:30 实验室分组漫游 · 11:30 学长学姐茶话会 · 14:00 自由交流。\n适合大一到大三对科研感兴趣的同学，名额有限，先到先得。',
    coverUrl: '/covers/campus-open-day.webp',
    location: '校本部 · 理工楼',
    startAt: '2026-11-22T01:00:00.000Z',
    endAt: '2026-11-22T06:00:00.000Z',
    capacity: 120,
    status: ActivityStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-01T03:00:00.000Z',
    updatedAt: '2026-10-01T03:00:00.000Z',
  },
  {
    id: 'ck_act_seed_002',
    title: '城市骑行 · 银杏秋日线',
    summary: '15 公里轻量级骑行，穿过银杏大道与老城巷弄，随手拍都是大片。',
    content:
      '集合点：西门地铁站。提供基础补给与医疗保障；自带自行车或现场租赁。\n路线平缓，适合新手，配速友好。',
    coverUrl: '/covers/campus-ride.webp',
    location: '西门 · 银杏大道',
    startAt: '2026-11-29T02:00:00.000Z',
    endAt: '2026-11-29T05:30:00.000Z',
    capacity: 40,
    status: ActivityStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-05T03:00:00.000Z',
    updatedAt: '2026-10-05T03:00:00.000Z',
  },
  {
    id: 'ck_act_seed_003',
    title: '深夜代码营 · Hack Night',
    summary: '通宵组队黑客松，咖啡因管够，凌晨产出你的第一个小作品。',
    content:
      '19:00 开场命题 · 20:00 自由组队 · 次日凌晨 04:00 Demo。\n提供披萨、咖啡与白板；自带电脑。最佳 Demo 有小惊喜。',
    coverUrl: '/covers/campus-hack.webp',
    location: '创客空间 · 三楼',
    startAt: '2026-12-06T11:00:00.000Z',
    endAt: '2026-12-07T20:00:00.000Z',
    capacity: 60,
    status: ActivityStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-08T03:00:00.000Z',
    updatedAt: '2026-10-08T03:00:00.000Z',
  },
  {
    id: 'ck_act_seed_004',
    title: '新年音乐会 · 跨年专场',
    summary: '学生乐团年度专场，从民乐到爵士，陪你跨过这一年。',
    content:
      '19:30 开场 · 21:30 跨年倒数。\n票务在校内窗口与官网同步；校外亲友凭邀请码入场。',
    coverUrl: '/covers/campus-music.webp',
    location: '大学生活动中心',
    startAt: '2026-12-31T11:30:00.000Z',
    endAt: '2027-01-01T01:00:00.000Z',
    capacity: 300,
    status: ActivityStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-10T03:00:00.000Z',
    updatedAt: '2026-10-10T03:00:00.000Z',
  },
];

export const seedPosts: PostView[] = [
  {
    id: 'ck_post_seed_001',
    title: '校园行上线啦：把每一次出发都变成故事',
    summary: '我们为什么做校园行，以及它想陪你走过的那些路。',
    content:
      '校园行是一个面向在校学生的活动与资讯平台：发现好玩的活动、报名同行、记录你的校园轨迹。\n这一期我们聚焦「轻量、真实、可参与」。',
    coverUrl: '/covers/campus-launch.webp',
    status: PostStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-20T03:00:00.000Z',
    publishedAt: '2026-10-20T03:00:00.000Z',
  },
  {
    id: 'ck_post_seed_002',
    title: '报名指南：三步搞定你的第一次活动',
    summary: '注册、登录、一键报名，手把手带你走完流程。',
    content:
      '第一步：用学校邮箱注册（密码需 ≥8 位且含大小写字母与数字）。\n第二步：登录后进入活动详情页。\n第三步：点击「立即报名」，名额报满会提示冲突。',
    coverUrl: '/covers/campus-guide.webp',
    status: PostStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-22T03:00:00.000Z',
    publishedAt: '2026-10-22T03:00:00.000Z',
  },
  {
    id: 'ck_post_seed_003',
    title: '幕后故事：一次骑行活动是怎么长出来的',
    summary: '从一条微信群消息，到 40 人的银杏秋日线。',
    content:
      '从踩点、线路评估到保险与补给，我们复盘了骑行活动的完整筹备过程，希望对你组织自己的活动有帮助。',
    coverUrl: '/covers/campus-story.webp',
    status: PostStatus.PUBLISHED,
    createdById: 'ck_admin_seed_001',
    createdAt: '2026-10-25T03:00:00.000Z',
    publishedAt: '2026-10-25T03:00:00.000Z',
  },
];
