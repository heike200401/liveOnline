import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { DailyRecordsModule } from './daily-records/daily-records.module.js';
import { TagsModule } from './tags/tags.module.js';
import { StatsModule } from './stats/stats.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UploadModule } from './upload/upload.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SkillsModule,
    DailyRecordsModule,
    TagsModule,
    StatsModule,
    TasksModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
