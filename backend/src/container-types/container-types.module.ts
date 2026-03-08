import { Module } from '@nestjs/common';
import { ContainerTypesController } from './container-types.controller';
import { ContainerTypesService } from './container-types.service';

@Module({
  controllers: [ContainerTypesController],
  providers: [ContainerTypesService],
  exports: [ContainerTypesService],
})
export class ContainerTypesModule {}
