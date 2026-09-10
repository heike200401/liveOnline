import { Module } from '@nestjs/common';
import { DecayTasksService } from './decay.tasks.service.js';

@Module({
  providers: [DecayTasksService],
})
export class TasksModule {}