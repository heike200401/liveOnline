import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { DECAY_HOURS } from '../common/stages.js';
import { beijingDateString, dateStringToUtc } from '../common/time.js';

@Injectable()
export class DecayTasksService {
  private readonly logger = new Logger(DecayTasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 每日凌晨 01:00（北京时间）执行：
   * 1. 草稿自动提交（校验必填项，完整则提交，不完整则作废）
   * 2. 前一日无 submitted 记录的用户，全体技能扣除 6 小时
   *
   * Cron 表达式以服务器时区为准；此处用 UTC 时解析为北京时间 01:00 = UTC 17:00（前一日）。
   * 使用 @nestjs/schedule 的 timeZone 选项按 Asia/Shanghai 计算。
   */
  @Cron('0 1 * * *', { timeZone: 'Asia/Shanghai' })
  async runDailyDecay() {
    this.logger.log('开始执行每日衰减任务');

    const yesterday = this.yesterdayBeijing();

    // 1. 草稿自动提交
    await this.autoSubmitDrafts(yesterday);

    // 2. 衰减检查
    await this.applyDecay(yesterday);

    this.logger.log('每日衰减任务执行完成');
  }

  private yesterdayBeijing(): string {
    const bj = new Date(Date.now() + 8 * 60 * 60 * 1000);
    bj.setDate(bj.getDate() - 1);
    return bj.toISOString().slice(0, 10);
  }

  /**
   * 草稿自动提交：前一日 status=draft 的记录，
   * 若必填项（文字/图片/标签）完整 → 提交 + 同步技能时长；
   * 否则草稿作废（视为当日未打卡）。
   */
  private async autoSubmitDrafts(dateStr: string) {
    const recordDate = dateStringToUtc(dateStr);
    const drafts = await this.prisma.dailyRecord.findMany({
      where: { status: 'draft', recordDate },
      include: {
        skillLogs: true,
        images: true,
        recordTags: true,
      },
    });

    for (const draft of drafts) {
      const complete =
        draft.textContent.trim().length > 0 &&
        draft.images.length >= 1 &&
        draft.recordTags.length >= 1;

      if (!complete) {
        // 草稿作废：删除该草稿（视为未打卡）
        await this.prisma.dailyRecord.delete({ where: { id: draft.id } });
        this.logger.log(
          `草稿 ${draft.id} 必填项不完整，已作废（用户 ${draft.userId}）`,
        );
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.dailyRecord.update({
          where: { id: draft.id },
          data: { status: 'submitted' },
        });
        // 同步技能累计时长
        for (const log of draft.skillLogs) {
          if (log.hours > 0) {
            await tx.skill.update({
              where: { id: log.skillId },
              data: { totalHours: { increment: log.hours } },
            });
          }
        }
      });
      this.logger.log(`草稿 ${draft.id} 已自动提交（用户 ${draft.userId}）`);
    }
  }

  /**
   * 前一日无 submitted 记录 → 全体技能扣除 6 小时
   */
  private async applyDecay(dateStr: string) {
    const recordDate = dateStringToUtc(dateStr);
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      const hasRecord = await this.prisma.dailyRecord.findFirst({
        where: { userId: user.id, recordDate, status: 'submitted' },
      });
      if (hasRecord) continue;

      const skills = await this.prisma.skill.findMany({
        where: { userId: user.id },
      });

      if (skills.length === 0) continue;

      const affected = [];
      for (const skill of skills) {
        const deducted = Math.min(DECAY_HOURS, skill.totalHours);
        if (deducted <= 0) continue;
        const newTotal = Math.max(0, skill.totalHours - DECAY_HOURS);
        await this.prisma.skill.update({
          where: { id: skill.id },
          data: { totalHours: newTotal },
        });
        affected.push({
          skillId: skill.id,
          name: skill.name,
          before: skill.totalHours,
          after: newTotal,
          deducted,
        });
      }

      await this.prisma.decayLog.create({
        data: {
          userId: user.id,
          decayDate: recordDate,
          skillsAffected: affected,
        },
      });

      if (affected.length > 0) {
        this.logger.log(
          `用户 ${user.id} 前一日未打卡，${affected.length} 个技能各扣除 ${DECAY_HOURS} 小时`,
        );
      }
    }
  }
}