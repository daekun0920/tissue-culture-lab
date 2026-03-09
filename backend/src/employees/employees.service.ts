import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { logs: true } } },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employee.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const [logs, experiments, entries] = await Promise.all([
      this.prisma.actionLog.count({ where: { performedBy: id } }),
      this.prisma.experiment.count({ where: { createdBy: id } }),
      this.prisma.experimentEntry.count({ where: { createdBy: id } }),
    ]);
    if (logs > 0 || experiments > 0 || entries > 0) {
      throw new BadRequestException(
        `Cannot delete: employee has ${logs} action log(s), ${experiments} experiment(s), ${entries} entry(ies)`,
      );
    }
    return this.prisma.employee.delete({ where: { id } });
  }
}
