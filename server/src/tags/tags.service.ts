import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, dto: CreateTagDto) {
    const exists = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (exists) {
      throw new ConflictException('标签名称已存在');
    }

    return this.prisma.tag.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color ?? '#ff9500',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTagDto) {
    await this.ensureOwned(userId, id);

    if (dto.name) {
      const dup = await this.prisma.tag.findFirst({
        where: { userId, name: dto.name, id: { not: id } },
      });
      if (dup) {
        throw new ConflictException('标签名称已存在');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name, color: dto.color },
    });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.tag.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }
    return tag;
  }
}