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
  PageQuery,
  Paginated,
  PostView,
  UserView,
  adminUserListQuerySchema,
  pageQuerySchema,
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
  async updateUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateUserRequestSchema)) body: AdminUpdateUserRequest,
  ): Promise<{ user: UserView }> {
    const user = await this.adminService.updateUser(id, body);
    return { user };
  }

  @Get('activities')
  @ApiOperation({ summary: '活动管理列表（含 DRAFT/ARCHIVED，分页）' })
  listActivities(@Query(new ZodValidationPipe(pageQuerySchema)) query: PageQuery) {
    return this.adminService.listActivities(query);
  }

  @Post('activities')
  @ApiOperation({ summary: '新建活动' })
  async createActivity(
    @Body(new ZodValidationPipe(adminCreateActivityRequestSchema)) body: AdminCreateActivityRequest,
  ): Promise<{ activity: ActivityView }> {
    const activity = await this.adminService.createActivity(body);
    return { activity };
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: '编辑活动' })
  async updateActivity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateActivityRequestSchema)) body: AdminUpdateActivityRequest,
  ): Promise<{ activity: ActivityView }> {
    const activity = await this.adminService.updateActivity(id, body);
    return { activity };
  }

  @Delete('activities/:id')
  @ApiOperation({ summary: '删除活动' })
  deleteActivity(@Param('id') id: string): Promise<null> {
    return this.adminService.deleteActivity(id);
  }

  @Get('posts')
  @ApiOperation({ summary: '资讯管理列表（分页）' })
  listPosts(@Query(new ZodValidationPipe(pageQuerySchema)) query: PageQuery) {
    return this.adminService.listPosts(query);
  }

  @Post('posts')
  @ApiOperation({ summary: '新建资讯' })
  async createPost(
    @Body(new ZodValidationPipe(adminCreatePostRequestSchema)) body: AdminCreatePostRequest,
  ): Promise<{ post: PostView }> {
    const post = await this.adminService.createPost(body);
    return { post };
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: '编辑资讯' })
  async updatePost(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdatePostRequestSchema)) body: AdminUpdatePostRequest,
  ): Promise<{ post: PostView }> {
    const post = await this.adminService.updatePost(id, body);
    return { post };
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '删除资讯' })
  deletePost(@Param('id') id: string): Promise<null> {
    return this.adminService.deletePost(id);
  }
}
