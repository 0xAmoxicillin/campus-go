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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@campus-go/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/**
 * 管理员后台端点（契约 §3.4，仅 ADMIN，全部需 Bearer + RolesGuard）。
 * 安全边界：@UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN')，
 * USER 访问 → 403 (code 40300)，未登录 → 401 (code 40100)。
 * M1 仅铺设 Swagger 契约骨架，业务实现放 M2。
 */
@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  @Get('users')
  @ApiOperation({ summary: '用户列表（分页，支持 ?role=&status=&q=）' })
  listUsers(@Query() _query: { page?: number; pageSize?: number; role?: string; status?: string; q?: string }) {
    return null;
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '改用户 {status?, role?}（启停 / 改角色）' })
  updateUser(@Param('id') _id: string, @Body() _body: { status?: string; role?: string }) {
    return null;
  }

  @Get('activities')
  @ApiOperation({ summary: '活动管理列表（含 DRAFT/ARCHIVED，分页）' })
  listActivities(@Query() _query: { page?: number; pageSize?: number }) {
    return null;
  }

  @Post('activities')
  @ApiOperation({ summary: '新建活动' })
  createActivity(@Body() _body: Record<string, unknown>) {
    return null;
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: '编辑活动' })
  updateActivity(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return null;
  }

  @Delete('activities/:id')
  @ApiOperation({ summary: '删除活动' })
  deleteActivity(@Param('id') _id: string) {
    return null;
  }

  @Get('posts')
  @ApiOperation({ summary: '资讯管理列表（分页）' })
  listPosts(@Query() _query: { page?: number; pageSize?: number }) {
    return null;
  }

  @Post('posts')
  @ApiOperation({ summary: '新建资讯' })
  createPost(@Body() _body: Record<string, unknown>) {
    return null;
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: '编辑资讯' })
  updatePost(@Param('id') _id: string, @Body() _body: Record<string, unknown>) {
    return null;
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: '删除资讯' })
  deletePost(@Param('id') _id: string) {
    return null;
  }
}
