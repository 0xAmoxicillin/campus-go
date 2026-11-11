import { SetMetadata } from '@nestjs/common';
import { Role } from '@campus-go/shared';

// @Roles('ADMIN') / @Roles('USER','ADMIN') —— 与 RolesGuard 配合，接口级 RBAC 边界。
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
