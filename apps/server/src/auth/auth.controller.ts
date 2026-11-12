import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import {
  AuthTokens,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  UserView,
  registerRequestSchema,
  loginRequestSchema,
  refreshRequestSchema,
  logoutRequestSchema,
} from '@campus-go/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { LoginThrottlerGuard } from './login-throttler.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthUser } from './auth-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, LogoutDto } from './auth.swagger.dto';

export interface AuthResultView {
  user: UserView;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth 端点（契约 §3.1，公开）。M2 真实实现：bcrypt + JWT（access 15m/refresh 7d），
 * 注册硬编码 role=USER，刷新令牌轮换（旧 token 立即吊销），登出吊销。
 * 登录/刷新/注册 挂 LoginThrottlerGuard 做登录限流（42900）；logout 需鉴权但不限流。
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({
    summary: '注册（仅 USER；请求体即使带 role 也一律忽略，服务端硬编码 USER）',
  })
  @ApiBody({ type: RegisterDto })
  @SwaggerResponse({ status: 201, description: '成功，data={user,accessToken,refreshToken}' })
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
  ): Promise<AuthResultView> {
    // 红线：剥离请求体可能携带的 role/status 等越权字段，仅采信 email/password/name。
    const safeDto: RegisterRequest = {
      email: body.email,
      password: body.password,
      name: body.name,
    };
    return this.authService.register(safeDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ summary: '登录' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
  ): Promise<AuthResultView> {
    return this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @ApiOperation({ summary: '刷新（轮换）：旧 refresh token 立即失效' })
  @ApiBody({ type: RefreshDto })
  async refresh(
    @Body(new ZodValidationPipe(refreshRequestSchema)) body: RefreshRequest,
  ): Promise<AuthTokens> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登出（吊销 refresh token，需 Bearer）' })
  @ApiBody({ type: LogoutDto })
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body(new ZodValidationPipe(logoutRequestSchema)) body: LogoutRequest,
    @AuthUser() _user: { userId: string },
  ): Promise<null> {
    await this.authService.logout(body.refreshToken);
    return null;
  }
}
