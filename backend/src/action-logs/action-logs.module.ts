import { Module } from '@nestjs/common';
import { ActionLogsController } from './action-logs.controller';
import { ActionLogsService } from './action-logs.service';

@Module({
  controllers: [ActionLogsController],
  providers: [ActionLogsService],
  exports: [ActionLogsService],
})
export class ActionLogsModule {}
