import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ActivityView,
  AdminCreateActivityRequest,
  AdminCreatePostRequest,
  AdminUpdateActivityRequest,
  AdminUpdatePostRequest,
  AdminUpdateUserRequest,
  AdminUserListQuery,
  Paginated,
  PostView,
  UserView,
  adminUserListQuerySchema,
  adminUpdateUserRequestSchema,
  adminCreateActivityRequestSchema,
  adminUpdateActivityRequestSchema,
  adminCreatePostRequestSchema,
  adminUpdatePostRequestSchema,
} from '@campus-go/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

/**
 * 管理员后台端点（契约 §3.4，仅 ADMIN，全部需 Bearer + RolesGuard）。
 * 安全边界：@UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN')，
 * USER 访问 → 403 (code 40300)，未登录 → 401 (code 40100)。接口级 Guards 是唯一边界（红线）。
 */
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: '用户列表（分页，支持 ?role=&status=&q=）' })
  listUsers(
    @Query(new ZodValidationPipe(adminUserListQuerySchema)) query: AdminUserListQuery,
  ): Promise<Paginated<UserView>> {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '改用户 {status?, role?}（启停 / 改角色）' })
  updateUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateUserRequestSchema)) body: AdminUpdateUserRequest,
  ): Promise<UserView> {
    return this.adminService.updateUser(id, body);
  }

  @Get('activities')
  @ApiOperation({ summary: '活动管理列表（含 DRAFT/ARCHIVED，分页）' })
  listActivities(@Query() query: { page: number; pageSize: number }) {
    return this.adminService.listActivities(query);
  }

  @Post('activities')
  @ApiOperation({ summary: '新建活动' })
  createActivity(
    @Body(new ZodValidationPipe(adminCreateActivityRequestSchema)) body: AdminCreateActivityRequest,
  ): Promise<ActivityView> {
    return this.adminService.createActivity(body);
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: '编辑活动' })
  updateActivity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateActivityRequestSchema)) body: AdminUpdateActivityRequest,
  ): Promise<ActivityView> {
    return this.adminService.updateActivity(id, body);
  }

  @Delete('activities/:id')
  @ApiOperation({ summary: '删除活动' })
  deleteActivity(@Param('id') id: string): Promise<null> {
    return this.adminService.deleteActivity(id);
  }

  @Get('posts')
  @ApiOperation({ summary: '资讯管理列表（分页）' })
  listPosts(@Query() query: { page: number; pageSize: number }) {
    return this.adminService.listPosts(query);
  }

  @Post('posts')
  @ApiOperation({ summary: '新建资讯' })
  createPost(
    @Body(new ZodValidationPipe(adminCreatePostRequestSchema)) body: AdminCreatePostRequest,
  ): Promise<PostView> {
    return this.adminService.createPost(body);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: '编辑资讯' })
  updatePost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdatePostRequestSchema)) body: AdminUpdatePostRequest,
  ): Promise<PostView> {
    return this.adminService.updatePost(id, body);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '删除资讯' })
  deletePost(@Param('id') id: string): Promise<null> {
    return this.adminService.deletePost(id);
  }
}
