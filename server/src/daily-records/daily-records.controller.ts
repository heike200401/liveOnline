import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { isCheckinWindow } from '../common/time.js';
import { DailyRecordsService } from './daily-records.service.js';
import { SaveDailyRecordDto } from './dto/daily-record.dto.js';

@Controller('daily-records')
@UseGuards(JwtAuthGuard)
export class DailyRecordsController {
  constructor(private readonly dailyRecordsService: DailyRecordsService) {}

  @Get('today')
  today(@CurrentUser() user: { id: string }) {
    return this.dailyRecordsService.today(user.id);
  }

  @Get('stats')
  stats(
    @CurrentUser() user: { id: string },
    @Query('period') period?: string,
  ) {
    const p = period === 'month' ? 'month' : 'week';
    return this.dailyRecordsService.stats(user.id, p);
  }

  @Post('draft')
  saveDraft(
    @CurrentUser() user: { id: string },
    @Body() dto: SaveDailyRecordDto,
  ) {
    return this.dailyRecordsService.saveDraft(user.id, dto);
  }

  @Post()
  submit(
    @CurrentUser() user: { id: string },
    @Body() dto: SaveDailyRecordDto,
  ) {
    // 非正式打卡时段禁止提交（草稿自动提交由定时任务处理）
    if (!isCheckinWindow()) {
      throw new BadRequestException(
        '当前为草稿编辑模式，正式打卡时间为每晚 23:00 - 次日 01:00',
      );
    }
    return this.dailyRecordsService.submit(user.id, dto);
  }

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query('view') view?: string,
    @Query('date') date?: string,
    @Query('tag_id') tagId?: string,
  ) {
    const v = view === 'week' || view === 'month' ? view : 'day';
    const targetDate = date ?? this.todayString();
    const tagIds = tagId ? tagId.split(',').filter(Boolean) : [];
    return this.dailyRecordsService.listByView(user.id, v, targetDate, tagIds);
  }

  @Get(':id')
  detail(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.dailyRecordsService.detail(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: SaveDailyRecordDto,
  ) {
    return this.dailyRecordsService.update(user.id, id, dto);
  }

  private todayString(): string {
    const bj = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return bj.toISOString().slice(0, 10);
  }
}