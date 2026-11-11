import { Injectable } from '@nestjs/common';
import { UpdateProfileRequest } from '@campus-go/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/api-error';
import { toUserView } from '../common/views';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** 取当前登录用户资料（user 视图不含 passwordHash）。 */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiException.notFound('用户不存在');
    }
    return toUserView(user);
  }

  /** 改自己资料，仅允许 name（契约 §3.2 红线）。 */
  async updateMe(userId: string, dto: UpdateProfileRequest) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name },
    });
    return toUserView(user);
  }
}
