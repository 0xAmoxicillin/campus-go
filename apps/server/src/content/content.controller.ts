import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 官网公开内容端点（契约 §3.3）。
 * - 列表/详情（activities / posts）无需登录，M1 仅铺设 Swagger 契约骨架；
 * - POST /activities/:id/join 需登录（USER/ADMIN），挂 JwtAuthGuard（M2 实现容量/重复校验与 409）。
 */
@ApiTags('Content')
@Controller()
export class ContentController {
  @Get('activities')
  @ApiOperation({ summary: '活动列表（仅 PUBLISHED，分页，支持 ?q=）' })
  listActivities(@Query() _query: { page?: number; pageSize?: number; q?: string }) {
    return null;
  }

  @Get('activities/:id')
  @ApiOperation({ summary: '活动详情（仅 PUBLISHED）' })
  getActivity(@Param('id') _id: string) {
    return null;
  }

  @Post('activities/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '报名活动（需登录；容量已满/重复报名返回 409）' })
  joinActivity(@Param('id') _id: string) {
    return null;
  }

  @Get('posts')
  @ApiOperation({ summary: '资讯列表（仅 PUBLISHED，分页）' })
  listPosts(@Query() _query: { page?: number; pageSize?: number; q?: string }) {
    return null;
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '资讯详情（仅 PUBLISHED）' })
  getPost(@Param('id') _id: string) {
    return null;
  }
}
