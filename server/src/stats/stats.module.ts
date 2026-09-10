import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DailyRecordsModule } from '../daily-records/daily-records.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { StatsController } from './stats.controller.js';

@Module({
  imports: [AuthModule, SkillsModule, DailyRecordsModule],
  controllers: [StatsController],
})
export class StatsModule {}