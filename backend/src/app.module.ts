import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ContainersModule } from './containers/containers.module';
import { ContainerTypesModule } from './container-types/container-types.module';
import { MediaRecipesModule } from './media-recipes/media-recipes.module';
import { MediaBatchesModule } from './media-batches/media-batches.module';
import { CultureTypesModule } from './culture-types/culture-types.module';
import { EmployeesModule } from './employees/employees.module';
import { ActionLogsModule } from './action-logs/action-logs.module';
import { ReportsModule } from './reports/reports.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { LocationsModule } from './locations/locations.module';
import { PickListModule } from './pick-list/pick-list.module';

@Module({
  imports: [
    PrismaModule,
    ContainersModule,
    ContainerTypesModule,
    MediaRecipesModule,
    MediaBatchesModule,
    CultureTypesModule,
    EmployeesModule,
    ActionLogsModule,
    ReportsModule,
    ExperimentsModule,
    LocationsModule,
    PickListModule,
  ],
})
export class AppModule {}
