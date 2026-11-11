import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodeValue, HTTP_STATUS_BY_ERROR_CODE } from '@campus-go/shared';

/** 业务异常：携带统一业务码（ErrorCode），HTTP 状态码随之映射。 */
export class ApiException extends HttpException {
  readonly code: ErrorCodeValue;
  readonly causeDetail?: string;

  constructor(code: ErrorCodeValue, message: string, causeDetail?: string) {
    const httpStatus =
      HTTP_STATUS_BY_ERROR_CODE[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    super({ code, message, data: null }, httpStatus);
    this.code = code;
    this.causeDetail = causeDetail;
  }

  static badRequest(message = '通用参数错误') {
    return new ApiException(ErrorCode.BAD_REQUEST, message);
  }
  static validationFailed(message = '参数校验失败') {
    return new ApiException(ErrorCode.VALIDATION_FAILED, message);
  }
  static unauthorized(message = '未登录或 token 无效') {
    return new ApiException(ErrorCode.UNAUTHORIZED, message);
  }
  static tokenExpired(message = 'token 已过期') {
    return new ApiException(ErrorCode.TOKEN_EXPIRED, message);
  }
  static invalidCredentials(message = '账号或密码错误') {
    return new ApiException(ErrorCode.INVALID_CREDENTIALS, message);
  }
  static forbidden(message = '权限不足') {
    return new ApiException(ErrorCode.FORBIDDEN, message);
  }
  static notFound(message = '资源不存在') {
    return new ApiException(ErrorCode.NOT_FOUND, message);
  }
  static conflict(message = '资源冲突') {
    return new ApiException(ErrorCode.CONFLICT, message);
  }
  static tooManyRequests(message = '请求过于频繁') {
    return new ApiException(ErrorCode.TOO_MANY_REQUESTS, message);
  }
  static internal(message = '服务端内部错误') {
    return new ApiException(ErrorCode.INTERNAL, message);
  }
}
