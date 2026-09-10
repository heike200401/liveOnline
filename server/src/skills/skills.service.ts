import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { getProgress, getStage } from '../common/stages.js';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto.js';

export type SkillSort = 'created' | 'hours' | 'recent';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, sort: SkillSort = 'created') {
    const skills = await this.prisma.skill.findMany({
      where: { userId },
      include: {
        skillLogs: {
          select: {
            id: true,
            dailyRecordId: true,
            hours: true,
            dailyRecord: { select: { recordDate: true } },
          },
        },
      },
    });

    const decorated = skills.map((s) => {
      const { skillLogs, ...rest } = s;
      const lastStudy = skillLogs.reduce<Date | null>(
        (max, l) =>
          !max || l.dailyRecord.recordDate > max ? l.dailyRecord.recordDate : max,
        null,
      );
      return {
        ...rest,
        stage: getStage(rest.totalHours).name,
        progress: getProgress(rest.totalHours),
        lastStudyDate: lastStudy,
      };
    });

    return this.sortSkills(decorated, sort);
  }

  private sortSkills<T extends { createdAt: Date; totalHours: number; lastStudyDate: Date | null }>(
    skills: T[],
    sort: SkillSort,
  ): T[] {
    switch (sort) {
      case 'hours':
        return [...skills].sort((a, b) => b.totalHours - a.totalHours);
      case 'recent':
        return [...skills].sort((a, b) => {
          const ta = a.lastStudyDate?.getTime() ?? 0;
          const tb = b.lastStudyDate?.getTime() ?? 0;
          return tb - ta;
        });
      case 'created':
      default:
        return [...skills].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
  }

  async create(userId: string, dto: CreateSkillDto) {
    const exists = await this.prisma.skill.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (exists) {
      throw new ConflictException('技能名称已存在');
    }

    const skill = await this.prisma.skill.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? '#0071e3',
      },
    });

    return this.decorate(skill);
  }

  async detail(userId: string, id: string) {
    const skill = await this.prisma.skill.findFirst({
      where: { id, userId },
      include: {
        skillLogs: {
          include: {
            dailyRecord: { select: { recordDate: true } },
          },
        },
      },
    });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }

    const { skillLogs, ...rest } = skill;
    return {
      ...rest,
      stage: getStage(rest.totalHours).name,
      progress: getProgress(rest.totalHours),
    };
  }

  async logs(userId: string, id: string) {
    const skill = await this.prisma.skill.findFirst({ where: { id, userId } });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }

    const logs = await this.prisma.dailySkillLog.findMany({
      where: { skillId: id, dailyRecord: { userId } },
      include: {
        dailyRecord: { select: { recordDate: true } },
      },
      orderBy: { dailyRecord: { recordDate: 'desc' } },
    });

    return logs.map((l) => ({
      id: l.id,
      hours: l.hours,
      recordDate: l.dailyRecord.recordDate,
    }));
  }

  async update(userId: string, id: string, dto: UpdateSkillDto) {
    await this.ensureOwned(userId, id);

    if (dto.name) {
      const dup = await this.prisma.skill.findFirst({
        where: { userId, name: dto.name, id: { not: id } },
      });
      if (dup) {
        throw new ConflictException('技能名称已存在');
      }
    }

    const skill = await this.prisma.skill.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
      },
    });

    return this.decorate(skill);
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.skill.delete({ where: { id } });
    return { success: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const skill = await this.prisma.skill.findFirst({ where: { id, userId } });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }
    return skill;
  }

  private decorate(skill: { totalHours: number }) {
    return {
      ...skill,
      stage: getStage(skill.totalHours).name,
      progress: getProgress(skill.totalHours),
    };
  }
}