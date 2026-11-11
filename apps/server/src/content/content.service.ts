import { Injectable } from '@nestjs/common';
import { ContentListQuery } from '@campus-go/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/api-error';
import { toActivityView, toPostView, toEnrollmentView } from '../common/views';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** 公开活动列表：仅 PUBLISHED，分页 + ?q= 搜索（契约 §3.3）。 */
  async listActivities(query: ContentListQuery) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(query.q
        ? { OR: [{ title: { contains: query.q } }, { summary: { contains: query.q } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { startAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { items: items.map(toActivityView), total, page: query.page, pageSize: query.pageSize };
  }

  /** 公开活动详情：仅 PUBLISHED，否则 404。 */
  async getActivity(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity || activity.status !== 'PUBLISHED') {
      throw ApiException.notFound('活动不存在');
    }
    return toActivityView(activity);
  }

  /** 公开资讯列表：仅 PUBLISHED，分页 + ?q= 搜索。 */
  async listPosts(query: ContentListQuery) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(query.q
        ? { OR: [{ title: { contains: query.q } }, { summary: { contains: query.q } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);
    return { items: items.map(toPostView), total, page: query.page, pageSize: query.pageSize };
  }

  /** 公开资讯详情：仅 PUBLISHED，否则 404。 */
  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status !== 'PUBLISHED') {
      throw ApiException.notFound('资讯不存在');
    }
    return toPostView(post);
  }

  /** 报名活动：需登录。容量已满 / 重复报名 → 409（Enrollment 唯一约束）。 */
  async joinActivity(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity || activity.status !== 'PUBLISHED') {
      throw ApiException.notFound('活动不存在');
    }
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });
    if (existing) {
      throw ApiException.conflict('已报名该活动');
    }
    if (activity.capacity != null) {
      const enrolled = await this.prisma.enrollment.count({ where: { activityId } });
      if (enrolled >= activity.capacity) {
        throw ApiException.conflict('活动名额已满');
      }
    }
    const enrollment = await this.prisma.enrollment.create({
      data: { userId, activityId },
    });
    return toEnrollmentView(enrollment);
  }
}
