import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto.js';
import { SkillsService } from './skills.service.js';
import type { SkillSort } from './skills.service.js';

@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  list(
    @CurrentUser() user: { id: string },
    @Query('sort') sort?: SkillSort,
  ) {
    return this.skillsService.list(user.id, sort);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSkillDto) {
    return this.skillsService.create(user.id, dto);
  }

  @Get(':id')
  detail(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.skillsService.detail(user.id, id);
  }

  @Get(':id/logs')
  logs(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.skillsService.logs(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.skillsService.remove(user.id, id);
  }
} 