import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@campus-go/shared';

/**
 * 统一响应包装拦截器：把所有控制器返回值包成 { code, message, data }。
 * 与 docs/api-contract-v0.1.md §0 一致；异常由 ApiExceptionFilter 统一处理。
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'ok',
        data: (data === undefined ? null : data) as T,
      })),
    );
  }
}
