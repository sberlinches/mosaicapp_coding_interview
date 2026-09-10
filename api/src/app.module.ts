import { AppController } from './app.controller.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { PlanModule } from './plan/plan.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    PrismaModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
