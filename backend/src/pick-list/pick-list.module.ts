import { Module } from '@nestjs/common';
import { PickListController } from './pick-list.controller';
import { PickListService } from './pick-list.service';

@Module({
  controllers: [PickListController],
  providers: [PickListService],
})
export class PickListModule {}
