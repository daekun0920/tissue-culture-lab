import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';

@Controller('action-logs')
export class ActionLogsController {
  constructor(private readonly actionLogsService: ActionLogsService) {}

  @Get()
  findAll(
    @Query('containerQr') containerQr?: string,
    @Query('action') action?: string,
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.actionLogsService.findAll({
      containerQr,
      action,
      employeeId,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionLogsService.findOne(id);
  }
}
