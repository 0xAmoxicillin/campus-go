import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  ContentListQuery,
  EnrollmentView,
  contentListQuerySchema,
} from '@campus-go/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentService } from './content.service';
import { AuthUser } from '../auth/auth-user.decorator';

/**
 * 官网公开内容端点（契约 §3.3）。
 * - 列表/详情（activities / posts）无需登录，仅返回 PUBLISHED；
 * - POST /activities/:id/join 需登录（USER/ADMIN），挂 JwtAuthGuard（容量/重复校验与 409 由 service 负责）。
 * query 使用 shared 的 contentListQuerySchema 经 ZodValidationPipe 校验+coerce（page/pageSize 转 number）。
 */
@ApiTags('Content')
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('activities')
  @ApiOperation({ summary: '活动列表（仅 PUBLISHED，分页，支持 ?q=）' })
  listActivities(
    @Query(new ZodValidationPipe(contentListQuerySchema)) query: ContentListQuery,
  ) {
    return this.contentService.listActivities(query);
  }

  @Get('activities/:id')
  @ApiOperation({ summary: '活动详情（仅 PUBLISHED，否则 404）' })
  getActivity(@Param('id') id: string) {
    return this.contentService.getActivity(id);
  }

  @Post('activities/:id/join')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '报名活动（需登录；容量已满/重复报名返回 409）' })
  async joinActivity(
    @Param('id') id: string,
    @AuthUser() user: { userId: string },
  ): Promise<{ enrollment: EnrollmentView }> {
    const enrollment = await this.contentService.joinActivity(id, user.userId);
    return { enrollment };
  }

  @Get('posts')
  @ApiOperation({ summary: '资讯列表（仅 PUBLISHED，分页，支持 ?q=）' })
  listPosts(
    @Query(new ZodValidationPipe(contentListQuerySchema)) query: ContentListQuery,
  ) {
    return this.contentService.listPosts(query);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: '资讯详情（仅 PUBLISHED，否则 404）' })
  getPost(@Param('id') id: string) {
    return this.contentService.getPost(id);
  }
}
