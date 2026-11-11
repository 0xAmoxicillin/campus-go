import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode, ErrorCodeValue } from '@campus-go/shared';
import { ApiException } from './api-error';

interface ErrorBody {
  code: ErrorCodeValue;
  message: string;
  data: null;
}

/**
 * 统一异常过滤器：把一切异常（业务异常 / 校验异常 / 未知异常）收敛为
 * { code, message, data: null }，并映射正确的 HTTP 状态码。
 * 与 docs/api-contract-v0.1.md §0 错误码表严格一致。
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = { code: ErrorCode.INTERNAL, message: '服务端内部错误', data: null };

    if (exception instanceof ApiException) {
      const res = exception.getResponse() as { code: ErrorCodeValue; message: string };
      status = exception.getStatus();
      body = { code: res.code, message: res.message, data: null };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      // class-validator / 内置异常：code 置为 40001（参数校验失败）或按 HTTP 近似。
      if (status === HttpStatus.BAD_REQUEST) {
        const msg = typeof res === 'string' ? res : (res as any)?.message;
        body = {
          code: ErrorCode.VALIDATION_FAILED,
          message: Array.isArray(msg) ? msg.join('; ') : '参数校验失败',
          data: null,
        };
      } else {
        const msg = typeof res === 'string' ? res : (res as any)?.message ?? '请求错误';
        body = { code: ErrorCode.BAD_REQUEST, message: String(msg), data: null };
      }
    } else {
      this.logger.error('未捕获异常:', exception as any);
    }

    // 未知异常（500）不向外泄露内部细节。
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      body = { code: ErrorCode.INTERNAL, message: '服务端内部错误', data: null };
    }

    response.status(status).json(body);
  }
}
