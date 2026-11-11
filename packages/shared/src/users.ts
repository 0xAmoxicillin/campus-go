import { z } from 'zod';

// PATCH /api/users/me 仅允许修改 name（email/role/status 不可在此改）。
export const updateProfileRequestSchema = z.object({
  name: z.string().min(1),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
