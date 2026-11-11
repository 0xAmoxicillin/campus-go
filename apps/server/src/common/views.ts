import { Activity, Enrollment, Post, User } from '@prisma/client';
import {
  ActivityView,
  EnrollmentView,
  PostView,
  UserView,
} from '@campus-go/shared';

/**
 * 用户视图映射：契约 §3.1 安全红线 —— user 视图绝不返回 passwordHash。
 */
export function toUserView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toActivityView(a: Activity): ActivityView {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    content: a.content,
    coverUrl: a.coverUrl,
    location: a.location,
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    capacity: a.capacity,
    status: a.status,
    createdById: a.createdById,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function toPostView(p: Post): PostView {
  return {
    id: p.id,
    title: p.title,
    summary: p.summary,
    content: p.content,
    coverUrl: p.coverUrl,
    status: p.status,
    createdById: p.createdById,
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  };
}

export function toEnrollmentView(e: Enrollment): EnrollmentView {
  return {
    id: e.id,
    userId: e.userId,
    activityId: e.activityId,
    createdAt: e.createdAt.toISOString(),
  };
}
