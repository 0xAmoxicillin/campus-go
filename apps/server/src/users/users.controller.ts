import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 用户自助端点（契约 §3.2，需登录）。M1 仅铺设 Swagger 契约骨架 + 接口级鉴权骨架。
 * 业务实现（当前用户资料、PATCH 仅允许 name）放 M2。
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: '取当前用户资料（需登录）' })
  getMe() {
    return null;
  }

  @Patch('me')
  @ApiOperation({ summary: '改自己资料，仅允许 {name}（需登录）' })
  updateMe(@Body() _body: { name: string }) {
    return null;
  }
}
