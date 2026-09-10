import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getGreeting(): Promise<string> {
    return `Hello ${(await this.prisma.employee.findFirst())?.personName}!`;
  }
}
