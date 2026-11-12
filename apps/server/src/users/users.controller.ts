import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserView, UpdateProfileRequest, updateProfileRequestSchema } from '@campus-go/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { AuthUser } from '../auth/auth-user.decorator';

/**
 * 用户自助端点（契约 §3.2，需登录）。GET/PATCH /users/me，
 * PATCH 仅允许 {name}（email/role/status 不可在此改）。
 */
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '取当前用户资料（需登录）' })
  async getMe(@AuthUser() user: { userId: string }): Promise<{ user: UserView }> {
    const result = await this.usersService.getMe(user.userId);
    return { user: result };
  }

  @Patch('me')
  @ApiOperation({ summary: '改自己资料，仅允许 {name}（需登录）' })
  async updateMe(
    @AuthUser() user: { userId: string },
    @Body(new ZodValidationPipe(updateProfileRequestSchema)) body: UpdateProfileRequest,
  ): Promise<{ user: UserView }> {
    const result = await this.usersService.updateMe(user.userId, body);
    return { user: result };
  }
}
