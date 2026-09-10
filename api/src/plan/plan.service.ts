import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlanRepository } from './plan.repository.js';
import { SavePlanVersionDto } from './dtos/save-plan-version.dto.js';
import {
  ChangedField,
  PlanDiff,
  PlanRow,
  PlanVersionSummary,
} from './plan.types.js';

const planFields = [
  'personName',
  'role',
  'team',
  'allocationPct',
  'startDate',
  'endDate',
] as const;

/**
 * Implements plan persistence and version comparison behavior.
 */
@Injectable()
export class PlanService {
  /**
   * Creates a plan service.
   *
   * @param {PrismaService} prisma - Database service.
   * @param {PlanRepository} repository - Plan repository.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PlanRepository,
  ) {}

  /**
   * Returns the current plan in API format.
   *
   * @returns {Promise<PlanRow[]>} Current plan rows.
   */
  async getCurrent(): Promise<PlanRow[]> {
    const rows = await this.repository.findCurrent(this.prisma);
    return rows.map((row) => this.toPlanRow(row));
  }

  /**
   * Returns saved version metadata.
   *
   * @returns {Promise<PlanVersionSummary[]>} Saved versions.
   */
  async getVersions(): Promise<PlanVersionSummary[]> {
    const versions = await this.repository.findVersions(this.prisma);
    return versions.map((version) => ({
      id: version.id,
      name: version.name,
      createdAt: version.createdAt.toISOString(),
      rowCount: version._count.rows,
    }));
  }

  /**
   * Persists the current plan and creates a named snapshot atomically.
   *
   * @param {SavePlanVersionDto} request - Version name and plan rows.
   * @returns {Promise<PlanVersionSummary>} Created version metadata.
   */
  async saveVersion(request: SavePlanVersionDto): Promise<PlanVersionSummary> {
    const name = request.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Version name must not be empty');
    }

    const rows = request.rows.map((row) => ({
      ...row,
      id: row.id ?? randomUUID(),
    }));
    const ids = rows.map((row) => row.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Plan row IDs must be unique');
    }

    const version = await this.prisma.$transaction((database) =>
      this.repository.saveVersion(database, name, rows),
    );
    return {
      id: version.id,
      name: version.name,
      createdAt: version.createdAt.toISOString(),
      rowCount: version.rows.length,
    };
  }

  /**
   * Compares two saved versions by their stable row identifiers.
   *
   * @param {string} earlierId - Earlier version identifier.
   * @param {string} laterId - Later version identifier.
   * @returns {Promise<PlanDiff>} Added, removed, and changed rows.
   */
  async getDiff(earlierId: string, laterId: string): Promise<PlanDiff> {
    if (earlierId === laterId) {
      throw new BadRequestException('Versions must be different');
    }

    const [earlier, later] = await Promise.all([
      this.repository.findVersion(this.prisma, earlierId),
      this.repository.findVersion(this.prisma, laterId),
    ]);
    if (!earlier || !later) {
      throw new NotFoundException('One or both versions were not found');
    }

    const earlierRows = new Map(earlier.rows.map((row) => [row.rowKey, row]));
    const laterRows = new Map(later.rows.map((row) => [row.rowKey, row]));
    const added: PlanRow[] = [];
    const removed: PlanRow[] = [];
    const changed: Array<{ row: PlanRow; changes: ChangedField[] }> = [];

    for (const row of later.rows) {
      const oldRow = earlierRows.get(row.rowKey);
      if (!oldRow) {
        added.push(this.toPlanRow(row));
        continue;
      }

      const changes = planFields.flatMap((field) => {
        const oldValue = this.fieldValue(oldRow, field);
        const newValue = this.fieldValue(row, field);
        return oldValue === newValue ? [] : [{ field, oldValue, newValue }];
      });
      if (changes.length > 0) {
        changed.push({ row: this.toPlanRow(row), changes });
      }
    }

    for (const row of earlier.rows) {
      if (!laterRows.has(row.rowKey)) {
        removed.push(this.toPlanRow(row));
      }
    }

    return {
      earlierVersion: this.toVersionSummary(earlier, earlier.rows.length),
      laterVersion: this.toVersionSummary(later, later.rows.length),
      added,
      removed,
      changed,
    };
  }

  /**
   * Converts a database row to the public API representation.
   *
   * @param {object} row - Database plan row.
   * @returns {PlanRow} Public plan row.
   */
  private toPlanRow(row: {
    id?: string;
    rowKey?: string;
    personName: string;
    role: string;
    team: string;
    allocationPct: number;
    startDate: Date;
    endDate: Date;
  }): PlanRow {
    return {
      id: row.rowKey ?? row.id!,
      personName: row.personName,
      role: row.role,
      team: row.team,
      allocationPct: row.allocationPct,
      startDate: this.toDateString(row.startDate),
      endDate: this.toDateString(row.endDate),
    };
  }

  /**
   * Returns a stable date-only representation for comparisons and clients.
   *
   * @param {Date} value - Database date.
   * @returns {string} ISO date.
   */
  private toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  /**
   * Reads one comparable field from a snapshot row.
   *
   * @param {object} row - Snapshot row.
   * @param {keyof Omit<PlanRow, 'id'>} field - Field name.
   * @returns {string | number} Comparable value.
   */
  private fieldValue(
    row: {
      personName: string;
      role: string;
      team: string;
      allocationPct: number;
      startDate: Date;
      endDate: Date;
    },
    field: keyof Omit<PlanRow, 'id'>,
  ): string | number {
    if (field === 'startDate' || field === 'endDate') {
      return this.toDateString(row[field]);
    }
    return row[field];
  }

  /**
   * Converts version data to the public summary shape.
   *
   * @param {object} version - Saved version.
   * @param {number} rowCount - Number of rows in the snapshot.
   * @returns {PlanVersionSummary} Version summary.
   */
  private toVersionSummary(
    version: { id: string; name: string; createdAt: Date },
    rowCount: number,
  ): PlanVersionSummary {
    return {
      id: version.id,
      name: version.name,
      createdAt: version.createdAt.toISOString(),
      rowCount,
    };
  }
}
