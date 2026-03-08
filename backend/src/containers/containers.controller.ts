import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ContainerStatus } from '@prisma/client';
import { ContainersService } from './containers.service';
import { BatchActionDto } from './dto/batch-action.dto';
import { ContainerQueryDto } from './dto/container-query.dto';

@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.containersService.getDashboardStats();
  }

  @Get('lookup')
  lookup(@Query() query: ContainerQueryDto) {
    return this.containersService.lookup(query.q ?? '');
  }

  @Get('validate-action')
  validateAction(
    @Query('action') action: string,
    @Query('qrCodes') qrCodesStr: string,
  ) {
    const qrCodes = qrCodesStr ? qrCodesStr.split(',') : [];
    return this.containersService.validateAction(action, qrCodes);
  }

  @Get()
  findAll(@Query('status') status?: ContainerStatus) {
    return this.containersService.findAll(status);
  }

  @Get(':qr')
  findByQr(@Param('qr') qr: string) {
    return this.containersService.findByQr(qr);
  }

  @Post('batch-action')
  batchAction(@Body() dto: BatchActionDto) {
    return this.containersService.batchAction(dto);
  }

  @Post('register')
  registerContainers(
    @Body()
    body: {
      qrCodes: string[];
      containerTypeId?: string;
      notes?: string;
    },
  ) {
    return this.containersService.registerContainers(
      body.qrCodes,
      body.containerTypeId,
      body.notes,
    );
  }
}
