import { describe, expect, it, vi } from 'vitest';
import { PlanRepository } from '../../../src/plan/plan.repository.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

const row = {
  id: '00000000-0000-0000-0000-000000000001',
  personName: 'Priya Sharma',
  role: 'Engineer',
  team: 'Web',
  allocationPct: 50,
  startDate: '2026-01-05',
  endDate: '2026-06-30',
};

describe('PlanRepository (unit)', () => {
  it('should query current rows and version summaries', async () => {
    const database = {
      employee: { findMany: vi.fn().mockResolvedValue([row]) },
      planVersion: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient;
    const repository = new PlanRepository();

    await expect(repository.findCurrent(database)).resolves.toStrictEqual([
      row,
    ]);
    await expect(repository.findVersions(database)).resolves.toStrictEqual([]);
    expect(database.employee.findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
    });
    expect(database.planVersion.findMany).toHaveBeenCalledWith({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { _count: { select: { rows: true } } },
    });
  });

  it('should replace current rows and create a snapshot', async () => {
    const database = {
      employee: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: '00000000-0000-0000-0000-000000000099' }]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        upsert: vi.fn().mockResolvedValue(row),
      },
      planVersion: {
        create: vi.fn().mockResolvedValue({ id: 'version-1', rows: [row] }),
      },
    } as unknown as PrismaClient;
    const repository = new PlanRepository();
    const normalizedRow = {
      ...row,
      startDate: '2026-01-05',
      endDate: '2026-06-30',
    };

    await expect(
      repository.saveVersion(database as never, 'Baseline', [normalizedRow]),
    ).resolves.toStrictEqual({ id: 'version-1', rows: [row] });
    expect(database.employee.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['00000000-0000-0000-0000-000000000099'] } },
    });
    expect(database.employee.upsert).toHaveBeenCalledTimes(1);
    expect(database.planVersion.create).toHaveBeenCalledTimes(1);
    expect(database.planVersion.create).toHaveBeenCalledWith({
      data: {
        name: 'Baseline',
        rows: {
          create: [
            expect.objectContaining({
              rowKey: row.id,
              personName: row.personName,
            }),
          ],
        },
      },
      include: { rows: true },
    });
    expect(
      vi.mocked(database.planVersion.create).mock.calls[0][0].data.rows?.create,
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: row.id })]),
    );
  });

  it('should keep existing rows when none are removed and load a version', async () => {
    const database = {
      employee: {
        findMany: vi.fn().mockResolvedValue([{ id: row.id }]),
        deleteMany: vi.fn(),
        upsert: vi.fn().mockResolvedValue(row),
      },
      planVersion: {
        create: vi.fn().mockResolvedValue({ id: 'version-1', rows: [] }),
        findUnique: vi.fn().mockResolvedValue({ id: 'version-1', rows: [] }),
      },
    } as unknown as PrismaClient;
    const repository = new PlanRepository();

    await repository.saveVersion(database as never, 'Baseline', [
      { ...row, startDate: '2026-01-05', endDate: '2026-06-30' },
    ]);
    await expect(
      repository.findVersion(database, 'version-1'),
    ).resolves.toStrictEqual({
      id: 'version-1',
      rows: [],
    });
    expect(database.employee.deleteMany).not.toHaveBeenCalled();
    expect(database.planVersion.findUnique).toHaveBeenCalledWith({
      where: { id: 'version-1' },
      include: { rows: { orderBy: { rowKey: 'asc' } } },
    });
  });
});
