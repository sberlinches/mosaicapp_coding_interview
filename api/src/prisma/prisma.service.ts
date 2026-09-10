/* v8 ignore file */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  #logger: Logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.get<string>('DATABASE_URL'),
      }),
    });
    this.#logger.log('Prisma instance created');
  }

  async onModuleInit() {
    await this.$connect();
    this.#logger.log('Prisma connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.#logger.log('Prisma disconnected successfully');
  }
}
