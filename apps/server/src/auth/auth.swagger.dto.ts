import { ApiProperty } from '@nestjs/swagger';

/**
 * Swagger 请求体 DTO（仅用于 OpenAPI 文档与 @ApiBody 标注）。
 * 真实字段校验由 packages/shared 的 zod schema 在 controller 入参类型上完成，
 * 与 docs/api-contract-v0.1.md §3.1 严格一致。
 */

export class RegisterDto {
  @ApiProperty({ example: 'student@campus.edu' })
  email!: string;
  @ApiProperty({ example: 'Passw0rd' })
  password!: string;
  @ApiProperty({ example: '小明' })
  name!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'student@campus.edu' })
  email!: string;
  @ApiProperty({ example: 'Passw0rd' })
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'refresh token' })
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'refresh token' })
  refreshToken!: string;
}
