import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DiffQueryDto } from './dtos/diff-query.dto.js';
import { SavePlanVersionDto } from './dtos/save-plan-version.dto.js';
import { PlanService } from './plan.service.js';

/**
 * Exposes current-plan, version, and diff endpoints.
 */
@Controller('plan')
export class PlanController {
  /**
   * Creates a plan controller.
   *
   * @param {PlanService} service - Plan service.
   */
  constructor(private readonly service: PlanService) {}

  /**
   * Gets the current editable plan.
   *
   * @returns {Promise<ReturnType<PlanService['getCurrent']>>} Current plan.
   */
  @Get()
  getCurrent() {
    return this.service.getCurrent();
  }

  /**
   * Lists saved versions.
   *
   * @returns {Promise<ReturnType<PlanService['getVersions']>>} Version list.
   */
  @Get('versions')
  getVersions() {
    return this.service.getVersions();
  }

  /**
   * Saves a named version of the current plan.
   *
   * @param {SavePlanVersionDto} request - Version request.
   * @returns {Promise<ReturnType<PlanService['saveVersion']>>} Created version.
   */
  @Post('versions')
  saveVersion(@Body() request: SavePlanVersionDto) {
    return this.service.saveVersion(request);
  }

  /**
   * Gets the diff between two saved versions.
   *
   * @param {DiffQueryDto} query - Earlier and later version IDs.
   * @returns {Promise<ReturnType<PlanService['getDiff']>>} Version diff.
   */
  @Get('versions/diff')
  getDiff(@Query() query: DiffQueryDto) {
    return this.service.getDiff(query.earlierId, query.laterId);
  }
}
