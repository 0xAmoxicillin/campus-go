import { z } from 'zod';
import { ActivityStatus, PostStatus } from '@/contracts/api-contract';

/** ISO 字符串 → datetime-local 输入值（'YYYY-MM-DDTHH:mm'，本地时区）。 */
export function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** datetime-local 输入值 → ISO 8601（带 Z，与契约一致）。空值返回空串。 */
export function datetimeLocalToIso(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

/** 活动表单校验（字段对齐契约 §3.4：title/summary/content/coverUrl/location/startAt/endAt/capacity/status）。 */
export const activitySchema = z.object({
  title: z.string().min(1, '请输入标题').max(80, '标题过长'),
  summary: z.string().min(1, '请输入摘要').max(160, '摘要过长'),
  content: z.string().min(1, '请输入正文'),
  coverUrl: z.string().url('封面需为合法 URL'),
  location: z.string().min(1, '请输入地点'),
  startAt: z.string().min(1, '请选择开始时间'),
  endAt: z.string().min(1, '请选择结束时间'),
  capacity: z
    .number({ invalid_type_error: '请输入容量' })
    .int('容量需为整数')
    .min(1, '容量至少为 1')
    .max(100000, '容量过大'),
  status: z.nativeEnum(ActivityStatus),
});
export type ActivityFormValues = z.infer<typeof activitySchema>;

/** 资讯表单校验（字段对齐契约 §3.4：title/summary/content/coverUrl/status）。 */
export const postSchema = z.object({
  title: z.string().min(1, '请输入标题').max(80, '标题过长'),
  summary: z.string().min(1, '请输入摘要').max(160, '摘要过长'),
  content: z.string().min(1, '请输入正文'),
  coverUrl: z.string().url('封面需为合法 URL'),
  status: z.nativeEnum(PostStatus),
});
export type PostFormValues = z.infer<typeof postSchema>;

/** 活动状态 → 展示标签。 */
export const activityStatusLabel: Record<ActivityStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};

/** 资讯状态 → 展示标签。 */
export const postStatusLabel: Record<PostStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
};
