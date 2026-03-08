import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';

@Controller('action-logs')
export class ActionLogsController {
  constructor(private readonly actionLogsService: ActionLogsService) {}

  @Get()
  findAll(@Query('containerQr') containerQr?: string) {
    return this.actionLogsService.findAll(containerQr);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionLogsService.findOne(id);
  }
}
