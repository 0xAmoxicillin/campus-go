import { Injectable } from '@nestjs/common';
import {
  AdminCreateActivityRequest,
  AdminCreatePostRequest,
  AdminUpdateActivityRequest,
  AdminUpdatePostRequest,
  AdminUpdateUserRequest,
  AdminUserListQuery,
  Paginated,
  UserView,
} from '@campus-go/shared';
import { Prisma, Role, UserStatus, ActivityStatus, PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/api-error';
import { toUserView, toActivityView, toPostView } from '../common/views';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** 用户列表：分页 + ?role=&status=&q=。 */
  async listUsers(query: AdminUserListQuery): Promise<Paginated<UserView>> {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role as Role;
    if (query.status) where.status = query.status as UserStatus;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q } },
        { name: { contains: query.q } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map(toUserView), total, page: query.page, pageSize: query.pageSize };
  }

  /** 改用户：{status?, role?}（至少其一由 caller 保证；此处仅应用提供字段）。 */
  async updateUser(id: string, dto: AdminUpdateUserRequest) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw ApiException.notFound('用户不存在');
    }
    const data: Prisma.UserUpdateInput = {};
    if (dto.status) data.status = dto.status as UserStatus;
    if (dto.role) data.role = dto.role as Role;
    if (Object.keys(data).length === 0) {
      throw ApiException.badRequest('至少需要提供 status 或 role 之一');
    }
    if (dto.role === 'ADMIN' && user.role !== 'ADMIN') {
      // 安全约束：避免通过后台把普通用户批量升 ADMIN 而无审计——此处仅接受明确角色变更。
    }
    const updated = await this.prisma.user.update({ where: { id }, data });
    return toUserView(updated);
  }

  async listActivities(query: { page: number; pageSize: number }) {
    const { page, pageSize } = query;
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activity.count(),
    ]);
    return { items: items.map(toActivityView), total, page, pageSize };
  }

  async createActivity(dto: AdminCreateActivityRequest) {
    const activity = await this.prisma.activity.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        coverUrl: dto.coverUrl ?? null,
        location: dto.location ?? null,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        capacity: dto.capacity ?? null,
        status: dto.status as ActivityStatus,
      },
    });
    return toActivityView(activity);
  }

  async updateActivity(id: string, dto: AdminUpdateActivityRequest) {
    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      throw ApiException.notFound('活动不存在');
    }
    const data: Prisma.ActivityUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.startAt !== undefined) data.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) data.endAt = new Date(dto.endAt);
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.status !== undefined) data.status = dto.status as ActivityStatus;
    const updated = await this.prisma.activity.update({ where: { id }, data });
    return toActivityView(updated);
  }

  async deleteActivity(id: string) {
    const existing = await this.prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      throw ApiException.notFound('活动不存在');
    }
    await this.prisma.activity.delete({ where: { id } });
    return null;
  }

  async listPosts(query: { page: number; pageSize: number }) {
    const { page, pageSize } = query;
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.post.count(),
    ]);
    return { items: items.map(toPostView), total, page, pageSize };
  }

  async createPost(dto: AdminCreatePostRequest) {
    const now = new Date();
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        coverUrl: dto.coverUrl ?? null,
        status: dto.status as PostStatus,
        publishedAt: dto.status === 'PUBLISHED' ? (dto.publishedAt ? new Date(dto.publishedAt) : now) : null,
      },
    });
    return toPostView(post);
  }

  async updatePost(id: string, dto: AdminUpdatePostRequest) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw ApiException.notFound('资讯不存在');
    }
    const data: Prisma.PostUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.status !== undefined) {
      data.status = dto.status as PostStatus;
      // 状态变更时同步 publishedAt：发布则置为发布时间，非发布则清空。
      if (dto.status === 'PUBLISHED') {
        data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : existing.publishedAt ?? new Date();
      } else {
        data.publishedAt = null;
      }
    }
    const updated = await this.prisma.post.update({ where: { id }, data });
    return toPostView(updated);
  }

  async deletePost(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw ApiException.notFound('资讯不存在');
    }
    await this.prisma.post.delete({ where: { id } });
    return null;
  }
}
