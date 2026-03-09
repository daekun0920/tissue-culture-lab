import { Controller, Get, Query } from '@nestjs/common';
import { PickListService } from './pick-list.service';

@Controller('pick-list')
export class PickListController {
  constructor(private readonly pickListService: PickListService) {}

  @Get()
  getPickList(@Query('date') date?: string) {
    return this.pickListService.getPickList(date);
  }

  @Get('summary')
  getSummary() {
    return this.pickListService.getSummary();
  }
}
