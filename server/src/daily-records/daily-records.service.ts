import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { DAILY_HOURS_LIMIT, HOURS_STEP } from '../common/stages.js';
import {
  currentCheckinDate,
  dateStringToUtc,
  isCheckinWindow,
} from '../common/time.js';
import { SaveDailyRecordDto } from './dto/daily-record.dto.js';

export type DailyRecordStatus = 'draft' | 'submitted';

@Injectable()
export class DailyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取今日（或指定日期）打卡状态
   * 返回：无记录 / draft / submitted
   */
  async today(userId: string) {
    const dateStr = currentCheckinDate();
    const record = await this.prisma.dailyRecord.findUnique({
      where: { userId_recordDate: { userId, recordDate: dateStringToUtc(dateStr) } },
      include: this.recordInclude(),
    });

    if (!record) {
      return {
        recordDate: dateStr,
        status: 'none',
        isCheckinWindow: isCheckinWindow(),
        record: null,
      };
    }

    return {
      recordDate: dateStr,
      status: record.status as 'none' | DailyRecordStatus,
      isCheckinWindow: isCheckinWindow(),
      record: this.decorate(record),
    };
  }

  /**
   * 保存草稿（任意时间可调用）
   */
  async saveDraft(userId: string, dto: SaveDailyRecordDto) {
    return this.save(userId, dto, 'draft');
  }

  /**
   * 提交打卡（正式打卡时段；也可强制提交）
   */
  async submit(userId: string, dto: SaveDailyRecordDto) {
    const record = await this.save(userId, dto, 'submitted');
    return record;
  }

  /**
   * 修改已提交/草稿记录（不限次数）
   */
  async update(userId: string, id: string, dto: SaveDailyRecordDto) {
    const existing = await this.prisma.dailyRecord.findFirst({
      where: { id, userId },
      include: { skillLogs: true },
    });
    if (!existing) {
      throw new NotFoundException('记录不存在');
    }

    // 校验数据
    this.validateHours(dto);

    // 计算时长差异，同步增减各技能累计小时数
    await this.applySkillHoursDiff(userId, existing.skillLogs, dto.skillHours);

    // 更新记录
    const record = await this.prisma.$transaction(async (tx) => {
      // 删除旧的明细与图片、标签关联
      await tx.dailySkillLog.deleteMany({ where: { dailyRecordId: id } });
      await tx.recordImage.deleteMany({ where: { dailyRecordId: id } });
      await tx.recordTag.deleteMany({ where: { dailyRecordId: id } });

      return tx.dailyRecord.update({
        where: { id },
        data: {
          totalHours: this.totalOf(dto.skillHours),
          textContent: dto.textContent,
          skillLogs: {
            create: dto.skillHours
              .filter((s) => s.hours > 0)
              .map((s) => ({ skillId: s.skillId, hours: s.hours })),
          },
          images: { create: dto.imageUrls.map((url) => ({ url })) },
          recordTags: {
            create: dto.tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: this.recordInclude(),
      });
    });

    return this.decorate(record);
  }

  /**
   * 获取单条收获详情
   */
  async detail(userId: string, id: string) {
    const record = await this.prisma.dailyRecord.findFirst({
      where: { id, userId },
      include: this.recordInclude(),
    });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    return this.decorate(record);
  }

  /**
   * 按视图获取收获列表（支持标签筛选）
   */
  async listByView(
    userId: string,
    view: 'day' | 'week' | 'month',
    date: string,
    tagIds: string[] = [],
  ) {
    const recordFilters = await this.buildRecordWhere(userId, view, date, tagIds);

    const records = await this.prisma.dailyRecord.findMany({
      where: recordFilters.where,
      include: this.recordInclude(),
      orderBy: { recordDate: 'desc' },
    });

    const decorated = records.map((r) => this.decorate(r));

    if (view === 'day') {
      return { view, date, records: decorated };
    }

    if (view === 'week') {
      return this.aggregateWeek(decorated, date);
    }

    return this.aggregateMonth(decorated, date);
  }

  /**
   * 统计概览（周/月）
   */
  async stats(userId: string, period: 'week' | 'month') {
    const now = new Date();
    const today = currentCheckinDate();
    const start = this.periodStart(today, period);

    const records = await this.prisma.dailyRecord.findMany({
      where: {
        userId,
        status: 'submitted',
        recordDate: { gte: dateStringToUtc(start) },
      },
      include: {
        skillLogs: { include: { skill: { select: { name: true } } } },
      },
    });

    const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);
    const skillBreakdown: Record<string, number> = {};
    for (const r of records) {
      for (const log of r.skillLogs) {
        skillBreakdown[log.skill.name] =
          (skillBreakdown[log.skill.name] ?? 0) + log.hours;
      }
    }

    return {
      period,
      startDate: start,
      endDate: today,
      checkinDays: records.length,
      totalHours,
      skillBreakdown,
    };
  }

  /**
   * 全局总览统计
   */
  async overview(userId: string) {
    const [skillCount, totalHours, records, tagsCount] = await Promise.all([
      this.prisma.skill.count({ where: { userId } }),
      this.prisma.skill.aggregate({
        where: { userId },
        _sum: { totalHours: true },
      }),
      this.prisma.dailyRecord.findMany({
        where: { userId, status: 'submitted' },
        select: { recordDate: true, totalHours: true },
        orderBy: { recordDate: 'desc' },
      }),
      this.prisma.tag.count({ where: { userId } }),
    ]);

    const uniqueDays = new Set(
      records.map((r) => r.recordDate.toISOString().slice(0, 10)),
    );

    return {
      skillCount,
      totalHours: totalHours._sum.totalHours ?? 0,
      checkinDays: uniqueDays.size,
      totalRecords: records.length,
      tagsCount,
    };
  }

  // ---------- 私有辅助 ----------

  private recordInclude() {
    return {
      skillLogs: {
        include: { skill: { select: { id: true, name: true, color: true } } },
      },
      images: { select: { id: true, url: true } },
      recordTags: { include: { tag: true } },
    } as const;
  }

  private decorate(record: {
    skillLogs: any[];
    images: any[];
    recordTags: any[];
    totalHours: number;
    status: string;
    [k: string]: any;
  }) {
    return {
      id: record.id,
      recordDate: record.recordDate,
      totalHours: record.totalHours,
      textContent: record.textContent,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      skills: record.skillLogs.map((l) => ({
        skillId: l.skill.id,
        name: l.skill.name,
        color: l.skill.color,
        hours: l.hours,
      })),
      images: record.images.map((i) => ({ id: i.id, url: i.url })),
      tags: record.recordTags.map((rt) => ({
        id: rt.tag.id,
        name: rt.tag.name,
        color: rt.tag.color,
      })),
    };
  }

  private async save(
    userId: string,
    dto: SaveDailyRecordDto,
    status: DailyRecordStatus,
  ) {
    this.validateHours(dto);

    const dateStr = dto.recordDate ?? currentCheckinDate();

    // 校验标签归属
    if (dto.tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: dto.tagIds }, userId },
      });
      if (tags.length !== dto.tagIds.length) {
        throw new BadRequestException('包含无效的标签');
      }
    }

    // 校验技能归属
    const skillIds = dto.skillHours.map((s) => s.skillId);
    if (skillIds.length > 0) {
      const skills = await this.prisma.skill.findMany({
        where: { id: { in: skillIds }, userId },
      });
      if (skills.length !== skillIds.length) {
        throw new BadRequestException('包含无效的技能');
      }
    }

    const recordDate = dateStringToUtc(dateStr);
    const existing = await this.prisma.dailyRecord.findUnique({
      where: { userId_recordDate: { userId, recordDate } },
      include: { skillLogs: true },
    });

    if (existing && existing.status === 'submitted' && status === 'draft') {
      throw new BadRequestException('该日期已提交打卡，不能覆盖为草稿');
    }

    // 若存在记录，复用更新逻辑
    if (existing) {
      return this.update(userId, existing.id, dto);
    }

    // 提交时同步技能累计小时数
    const skillHoursToApply =
      status === 'submitted'
        ? dto.skillHours.filter((s) => s.hours > 0)
        : [];

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dailyRecord.create({
        data: {
          userId,
          recordDate,
          totalHours: this.totalOf(dto.skillHours),
          textContent: dto.textContent,
          status,
          skillLogs: {
            create: skillHoursToApply.map((s) => ({
              skillId: s.skillId,
              hours: s.hours,
            })),
          },
          images: { create: dto.imageUrls.map((url) => ({ url })) },
          recordTags: {
            create: dto.tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: this.recordInclude(),
      });

      // 同步技能累计时长
      for (const s of skillHoursToApply) {
        await tx.skill.update({
          where: { id: s.skillId },
          data: { totalHours: { increment: s.hours } },
        });
      }

      return created;
    });

    return this.decorate(record);
  }

  private async applySkillHoursDiff(
    userId: string,
    previousLogs: { skillId: string; hours: number }[],
    nextSkillHours: { skillId: string; hours: number }[],
  ) {
    const prevMap = new Map(previousLogs.map((l) => [l.skillId, l.hours]));
    const nextMap = new Map(nextSkillHours.map((s) => [s.skillId, s.hours]));

    const allSkillIds = new Set([...prevMap.keys(), ...nextMap.keys()]);
    for (const skillId of allSkillIds) {
      const prev = prevMap.get(skillId) ?? 0;
      const next = nextMap.get(skillId) ?? 0;
      const diff = next - prev;
      if (diff !== 0) {
        const skill = await this.prisma.skill.findFirst({
          where: { id: skillId, userId },
        });
        if (!skill) continue;
        const newTotal = Math.max(0, skill.totalHours + diff);
        await this.prisma.skill.update({
          where: { id: skillId },
          data: { totalHours: newTotal },
        });
      }
    }
  }

  private validateHours(dto: SaveDailyRecordDto) {
    const total = this.totalOf(dto.skillHours);

    if (total > DAILY_HOURS_LIMIT) {
      throw new BadRequestException(
        `今日学习总时长不可超过 ${DAILY_HOURS_LIMIT} 小时`,
      );
    }

    for (const s of dto.skillHours) {
      if (s.hours < 0) {
        throw new BadRequestException('学习时长不能为负数');
      }
      // 精度校验：0.5 的整数倍
      if (Math.round(s.hours * 2) !== s.hours * 2) {
        throw new BadRequestException(`学习时长最小精度为 ${HOURS_STEP} 小时`);
      }
    }
  }

  private totalOf(skillHours: { hours: number }[]): number {
    return skillHours.reduce((sum, s) => sum + s.hours, 0);
  }

  private async buildRecordWhere(
    userId: string,
    view: 'day' | 'week' | 'month',
    date: string,
    tagIds: string[],
  ) {
    const where: any = { userId };

    if (view === 'day') {
      where.recordDate = dateStringToUtc(date);
    } else if (view === 'week') {
      const start = this.weekStart(date);
      const end = this.weekEnd(start);
      where.recordDate = {
        gte: dateStringToUtc(start),
        lte: dateStringToUtc(end),
      };
    } else {
      const start = `${date.slice(0, 7)}-01`;
      const end = this.monthEnd(date.slice(0, 7));
      where.recordDate = {
        gte: dateStringToUtc(start),
        lte: dateStringToUtc(end),
      };
    }

    // AND 标签筛选：记录需同时包含所有指定标签
    if (tagIds.length > 0) {
      where.recordTags = {
        some: {
          AND: tagIds.map((tagId) => ({ tagId, tag: { userId } })),
        },
      };
    }

    return { where };
  }

  private weekStart(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0=周日
    const diff = day === 0 ? 6 : day - 1; // 周一为起始
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  }

  private weekEnd(weekStartStr: string): string {
    const d = new Date(weekStartStr + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }

  private monthEnd(monthStr: string): string {
    const [y, m] = monthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  }

  private periodStart(today: string, period: 'week' | 'month'): string {
    if (period === 'week') return this.weekStart(today);
    return `${today.slice(0, 7)}-01`;
  }

  private aggregateWeek(records: any[], date: string) {
    const weekStart = this.weekStart(date);
    const weekEnd = this.weekEnd(weekStart);
    const skillBreakdown: Record<string, number> = {};
    let totalHours = 0;

    for (const r of records) {
      totalHours += r.totalHours;
      for (const s of r.skills) {
        skillBreakdown[s.name] = (skillBreakdown[s.name] ?? 0) + s.hours;
      }
    }

    return {
      view: 'week',
      date,
      weekStart,
      weekEnd,
      checkinDays: records.length,
      totalHours,
      skillBreakdown,
      records,
    };
  }

  private aggregateMonth(records: any[], date: string) {
    const month = date.slice(0, 7);
    const skillBreakdown: Record<string, number> = {};
    let totalHours = 0;
    const calendar: Record<string, number> = {};

    for (const r of records) {
      totalHours += r.totalHours;
      const day = r.recordDate.toISOString().slice(0, 10);
      calendar[day] = r.totalHours;
      for (const s of r.skills) {
        skillBreakdown[s.name] = (skillBreakdown[s.name] ?? 0) + s.hours;
      }
    }

    return {
      view: 'month',
      date,
      month,
      checkinDays: records.length,
      totalHours,
      skillBreakdown,
      calendar,
      records,
    };
  }
}