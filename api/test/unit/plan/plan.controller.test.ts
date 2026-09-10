import { describe, expect, it, vi } from 'vitest';
import { DiffQueryDto } from '../../../src/plan/dtos/diff-query.dto.js';
import { SavePlanVersionDto } from '../../../src/plan/dtos/save-plan-version.dto.js';
import { PlanController } from '../../../src/plan/plan.controller.js';
import { PlanService } from '../../../src/plan/plan.service.js';

describe('PlanController (unit)', () => {
  it('should delegate current plan and version requests', async () => {
    const service = {
      getCurrent: vi.fn().mockResolvedValue([]),
      getVersions: vi.fn().mockResolvedValue([]),
    } as unknown as PlanService;
    const controller = new PlanController(service);

    await expect(controller.getCurrent()).resolves.toStrictEqual([]);
    await expect(controller.getVersions()).resolves.toStrictEqual([]);
    expect(service.getCurrent).toHaveBeenCalledTimes(1);
    expect(service.getVersions).toHaveBeenCalledTimes(1);
  });

  it('should delegate save and diff requests', async () => {
    const service = {
      saveVersion: vi.fn().mockResolvedValue({ id: 'version-1' }),
      getDiff: vi
        .fn()
        .mockResolvedValue({ added: [], removed: [], changed: [] }),
    } as unknown as PlanService;
    const controller = new PlanController(service);
    const saveRequest = { name: 'Baseline', rows: [] } as SavePlanVersionDto;
    const diffQuery = {
      earlierId: 'earlier',
      laterId: 'later',
    } as DiffQueryDto;

    await expect(controller.saveVersion(saveRequest)).resolves.toStrictEqual({
      id: 'version-1',
    });
    await expect(controller.getDiff(diffQuery)).resolves.toStrictEqual({
      added: [],
      removed: [],
      changed: [],
    });
    expect(service.saveVersion).toHaveBeenCalledWith(saveRequest);
    expect(service.getDiff).toHaveBeenCalledWith('earlier', 'later');
  });
});
