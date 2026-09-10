import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { DailyRecordsService } from '../daily-records/daily-records.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { getProgress, getStage } from '../common/stages.js';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(
    private readonly dailyRecords: DailyRecordsService,
    private readonly skills: SkillsService,
  ) {}

  @Get('overview')
  overview(@CurrentUser() user: { id: string }) {
    return this.dailyRecords.overview(user.id);
  }

  @Get('skill/:id')
  async skill(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const [detail, logs] = await Promise.all([
      this.skills.detail(user.id, id),
      this.skills.logs(user.id, id),
    ]);

    // 阶段变化趋势：按日期累计
    const trend: { date: string; hours: number; totalHours: number; stage: string }[] = [];
    let cumulative = 0;
    // logs 已是倒序，反转成升序累加
    const ascending = [...logs].reverse();
    for (const log of ascending) {
      cumulative += log.hours;
      trend.push({
        date: log.recordDate.toISOString().slice(0, 10),
        hours: log.hours,
        totalHours: cumulative,
        stage: getStage(cumulative).name,
      });
    }

    return {
      id: detail.id,
      name: detail.name,
      color: detail.color,
      description: detail.description,
      totalHours: detail.totalHours,
      stage: getStage(detail.totalHours).name,
      progress: getProgress(detail.totalHours),
      trend,
    };
  }
}