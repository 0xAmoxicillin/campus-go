import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@campus-go/shared';

/**
 * 用 packages/shared 的 zod schema 校验并转换入参（query/body）。
 * 与 docs/api-contract-v0.1.md 的 DTO 单向对齐；校验失败 → 400 / code=40001。
 * 注意：请仅作为「参数级」管道使用，例如 @Body(new ZodValidationPipe(schema))，
 * 不要作为方法级 @UsePipes 使用（否则会对所有参数——含 @Param/@Query——重复执行）。
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: { safeParse: (v: unknown) => any }) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.') || '字段'} ${i.message}`)
        .join('; ');
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: message || '参数校验失败',
        data: null,
      });
    }
    return result.data;
  }
}
