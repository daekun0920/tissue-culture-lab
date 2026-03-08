import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('employee')
  getEmployeeReport(
    @Query('employeeId') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getEmployeeReport(employeeId, from, to);
  }

  @Get('system')
  getSystemReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSystemReport(from, to);
  }

  @Get('container-history/:qr')
  getContainerHistory(@Param('qr') qr: string) {
    return this.reportsService.getContainerHistory(qr);
  }
}
