import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DailyRecordsController } from './daily-records.controller.js';
import { DailyRecordsService } from './daily-records.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DailyRecordsController],
  providers: [DailyRecordsService],
  exports: [DailyRecordsService],
})
export class DailyRecordsModule {}