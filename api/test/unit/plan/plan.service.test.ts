import { describe, expect, it, vi } from 'vitest';
import { PlanRepository } from '../../../src/plan/plan.repository.js';
import { PlanService } from '../../../src/plan/plan.service.js';
import { PrismaService } from '../../../src/prisma/prisma.service.js';

const firstRow = {
  id: '00000000-0000-0000-0000-000000000001',
  personName: 'Priya Sharma',
  role: 'Engineer',
  team: 'Web',
  allocationPct: 50,
  startDate: new Date('2026-01-05T00:00:00.000Z'),
  endDate: new Date('2026-06-30T00:00:00.000Z'),
};

const secondRow = {
  id: '00000000-0000-0000-0000-000000000002',
  personName: 'Alex Chen',
  role: 'Engineer',
  team: 'Platform',
  allocationPct: 100,
  startDate: new Date('2026-01-05T00:00:00.000Z'),
  endDate: new Date('2026-12-18T00:00:00.000Z'),
};

function createService() {
  const repository = {
    findCurrent: vi.fn(),
    findVersions: vi.fn(),
    findVersion: vi.fn(),
    saveVersion: vi.fn(),
  } as unknown as PlanRepository;
  const prisma = {
    $transaction: vi.fn(),
  } as unknown as PrismaService;
  return { repository, prisma, service: new PlanService(prisma, repository) };
}

describe('PlanService (unit)', () => {
  it('should return the current plan with date-only values', async () => {
    const { repository, service } = createService();
    vi.mocked(repository.findCurrent).mockResolvedValue([firstRow]);

    await expect(service.getCurrent()).resolves.toStrictEqual([
      {
        ...firstRow,
        startDate: '2026-01-05',
        endDate: '2026-06-30',
      },
    ]);
  });

  it('should return version metadata and row counts', async () => {
    const { repository, service } = createService();
    const createdAt = new Date('2026-06-01T10:00:00.000Z');
    vi.mocked(repository.findVersions).mockResolvedValue([
      { id: 'version-1', name: 'Baseline', createdAt, _count: { rows: 2 } },
    ] as never);

    await expect(service.getVersions()).resolves.toStrictEqual([
      {
        id: 'version-1',
        name: 'Baseline',
        createdAt: '2026-06-01T10:00:00.000Z',
        rowCount: 2,
      },
    ]);
  });

  it('should generate IDs and save the current plan and snapshot in a transaction', async () => {
    const { repository, prisma, service } = createService();
    const version = {
      id: 'version-1',
      name: 'Baseline',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      rows: [firstRow],
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
    vi.mocked(repository.saveVersion).mockResolvedValue(version as never);

    await expect(
      service.saveVersion({
        name: ' Baseline ',
        rows: [
          {
            personName: firstRow.personName,
            role: firstRow.role,
            team: firstRow.team,
            allocationPct: firstRow.allocationPct,
            startDate: '2026-01-05',
            endDate: '2026-06-30',
          },
        ],
      }),
    ).resolves.toStrictEqual({
      id: 'version-1',
      name: 'Baseline',
      createdAt: '2026-06-01T10:00:00.000Z',
      rowCount: 1,
    });
    expect(repository.saveVersion).toHaveBeenCalledWith(
      expect.anything(),
      'Baseline',
      [expect.objectContaining({ id: expect.any(String) })],
    );
  });

  it('should reject duplicate row IDs when saving', async () => {
    const { service } = createService();
    const duplicateRows = [
      { ...firstRow, startDate: '2026-01-05', endDate: '2026-06-30' },
      { ...firstRow, startDate: '2026-01-05', endDate: '2026-06-30' },
    ];

    await expect(
      service.saveVersion({ name: 'Invalid', rows: duplicateRows }),
    ).rejects.toThrow('Plan row IDs must be unique');
  });

  it('should reject a version name containing only whitespace', async () => {
    const { service } = createService();

    await expect(
      service.saveVersion({ name: '   ', rows: [] }),
    ).rejects.toThrow('Version name must not be empty');
  });

  it('should report added, removed, and changed rows', async () => {
    const { repository, service } = createService();
    const versionData = (id: string, name: string, rows: object[]) => ({
      id,
      name,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      rows: rows.map((row) => ({
        ...row,
        rowKey: (row as typeof firstRow).id,
      })),
    });
    vi.mocked(repository.findVersion)
      .mockResolvedValueOnce(
        versionData('earlier', 'Earlier', [firstRow, secondRow]) as never,
      )
      .mockResolvedValueOnce(
        versionData('later', 'Later', [
          { ...firstRow, allocationPct: 75 },
          {
            ...secondRow,
            id: '00000000-0000-0000-0000-000000000003',
          },
        ]) as never,
      );

    await expect(service.getDiff('earlier', 'later')).resolves.toMatchObject({
      added: [
        expect.objectContaining({ id: '00000000-0000-0000-0000-000000000003' }),
      ],
      removed: [expect.objectContaining({ id: secondRow.id })],
      changed: [
        {
          row: expect.objectContaining({ id: firstRow.id }),
          changes: [{ field: 'allocationPct', oldValue: 50, newValue: 75 }],
        },
      ],
    });
  });

  it('should omit unchanged rows from the changed collection', async () => {
    const { repository, service } = createService();
    const version = {
      id: 'version-1',
      name: 'Version',
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      rows: [{ ...firstRow, rowKey: firstRow.id }],
    };
    vi.mocked(repository.findVersion)
      .mockResolvedValueOnce(version as never)
      .mockResolvedValueOnce(version as never);

    await expect(service.getDiff('earlier', 'later')).resolves.toMatchObject({
      added: [],
      removed: [],
      changed: [],
    });
  });

  it('should reject identical or missing versions', async () => {
    const { repository, service } = createService();
    await expect(service.getDiff('same', 'same')).rejects.toThrow(
      'Versions must be different',
    );
    vi.mocked(repository.findVersion).mockResolvedValue(null);
    await expect(service.getDiff('earlier', 'later')).rejects.toThrow(
      'One or both versions were not found',
    );
  });
});
