import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { ErrorCode, RegisterRequest } from '@campus-go/shared';
import { LoginThrottlerGuard } from './login-throttler.guard';
import { ApiException } from '../common/api-error';

/**
 * Auth 端点（契约 §3.1，公开）。M1 仅铺设 Swagger 契约骨架，业务实现（bcrypt+JWT、注册硬编码 role=USER）放 M2。
 * 所有端点均挂 LoginThrottlerGuard 做登录限流（42900）。
 */
@ApiTags('Auth')
@Controller('auth')
@UseGuards(LoginThrottlerGuard)
export class AuthController {
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '注册（仅 USER，role 由服务端硬编码，忽略请求体中的 role）' })
  @SwaggerResponse({ status: 201, description: '成功，data={user,accessToken,refreshToken}' })
  register(@Body() _body: RegisterRequest) {
    throw ApiException.internal('M1 未实现：register 业务在 M2 实现');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登录' })
  login() {
    throw ApiException.internal('M1 未实现：login 业务在 M2 实现');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新（轮换）' })
  refresh() {
    throw ApiException.internal('M1 未实现：refresh 业务在 M2 实现');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登出（吊销 refresh）' })
  logout() {
    throw ApiException.internal('M1 未实现：logout 业务在 M2 实现');
  }
}

// 引用以避免未使用告警（错误码常量在 M2 实现时使用）。
void ErrorCode;
