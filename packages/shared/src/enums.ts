// 角色与状态枚举 —— 前后端共用契约单一来源（禁止各写一份）。
// 与 docs/api-contract-v0.1.md §1 / §2 严格一致。

export const ROLE_VALUES = ['USER', 'ADMIN'] as const;
export type Role = (typeof ROLE_VALUES)[number];

export const USER_STATUS_VALUES = ['ACTIVE', 'DISABLED'] as const;
export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const ACTIVITY_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUS_VALUES)[number];

export const POST_STATUS_VALUES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type PostStatus = (typeof POST_STATUS_VALUES)[number];
