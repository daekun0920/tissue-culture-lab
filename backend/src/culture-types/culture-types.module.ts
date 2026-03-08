import { Module } from '@nestjs/common';
import { CultureTypesController } from './culture-types.controller';
import { CultureTypesService } from './culture-types.service';

@Module({
  controllers: [CultureTypesController],
  providers: [CultureTypesService],
  exports: [CultureTypesService],
})
export class CultureTypesModule {}
