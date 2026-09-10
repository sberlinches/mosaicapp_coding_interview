import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { PlanRowDto } from './dtos/plan-row.dto.js';

/**
 * Provides persistence operations for the plan feature.
 */
@Injectable()
export class PlanRepository {
  /**
   * Loads the current editable plan.
   *
   * @param {PrismaClient} database - Database client.
   * @returns {Promise<Prisma.EmployeeModel[]>} Current plan rows.
   */
  async findCurrent(database: PrismaClient): Promise<Prisma.EmployeeModel[]> {
    return database.employee.findMany({ orderBy: { id: 'asc' } });
  }

  /**
   * Loads saved version metadata and row counts.
   *
   * @param {PrismaClient} database - Database client.
   * @returns {Promise<Prisma.PlanVersionGetPayload[]>} Version summaries.
   */
  async findVersions(database: PrismaClient) {
    return database.planVersion.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { _count: { select: { rows: true } } },
    });
  }

  /**
   * Replaces the current plan and creates its immutable version snapshot.
   *
   * @param {Prisma.TransactionClient} database - Transaction client.
   * @param {string} name - Version name.
   * @param {PlanRowDto[]} rows - Normalized plan rows.
   * @returns {Promise<Prisma.PlanVersionGetPayload>} Created version.
   */
  async saveVersion(
    database: Prisma.TransactionClient,
    name: string,
    rows: Array<PlanRowDto & { id: string }>,
  ) {
    const currentRows = await database.employee.findMany({
      select: { id: true },
    });
    const incomingIds = new Set(rows.map((row) => row.id));
    const deletedIds = currentRows
      .map((row) => row.id)
      .filter((id) => !incomingIds.has(id));

    if (deletedIds.length > 0) {
      await database.employee.deleteMany({ where: { id: { in: deletedIds } } });
    }

    for (const row of rows) {
      await database.employee.upsert({
        where: { id: row.id },
        create: this.toEmployeeData(row),
        update: this.toEmployeeData(row),
      });
    }

    return database.planVersion.create({
      data: {
        name,
        rows: {
          create: rows.map((row) => ({
            rowKey: row.id,
            personName: row.personName,
            role: row.role,
            team: row.team,
            allocationPct: row.allocationPct,
            startDate: new Date(row.startDate),
            endDate: new Date(row.endDate),
          })),
        },
      },
      include: { rows: true },
    });
  }

  /**
   * Loads a saved version and all of its snapshot rows.
   *
   * @param {PrismaClient} database - Database client.
   * @param {string} id - Version identifier.
   * @returns {Promise<Prisma.PlanVersionGetPayload>} Saved version.
   */
  async findVersion(database: PrismaClient, id: string) {
    return database.planVersion.findUnique({
      where: { id },
      include: { rows: { orderBy: { rowKey: 'asc' } } },
    });
  }

  /**
   * Maps an API row to Prisma employee fields.
   *
   * @param {PlanRowDto & { id: string }} row - Plan row.
   * @returns {Prisma.EmployeeUncheckedCreateInput} Database fields.
   */
  private toEmployeeData(
    row: PlanRowDto & { id: string },
  ): Prisma.EmployeeUncheckedCreateInput {
    return {
      id: row.id,
      personName: row.personName,
      role: row.role,
      team: row.team,
      allocationPct: row.allocationPct,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
    };
  }
}
