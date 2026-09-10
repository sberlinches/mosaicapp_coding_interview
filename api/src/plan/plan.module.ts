import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller.js';
import { PlanRepository } from './plan.repository.js';
import { PlanService } from './plan.service.js';

/**
 * Groups the plan API dependencies.
 */
@Module({
  controllers: [PlanController],
  providers: [PlanRepository, PlanService],
})
export class PlanModule {}
