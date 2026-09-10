/**
 * A row in the current plan or a saved plan snapshot.
 */
export interface PlanRow {
  id: string;
  personName: string;
  role: string;
  team: string;
  allocationPct: number;
  startDate: string;
  endDate: string;
}

/**
 * A saved plan version without its snapshot rows.
 */
export interface PlanVersionSummary {
  id: string;
  name: string;
  createdAt: string;
  rowCount: number;
}

/**
 * A field-level change between two rows.
 */
export interface ChangedField {
  field: keyof Omit<PlanRow, 'id'>;
  oldValue: string | number;
  newValue: string | number;
}

/**
 * The complete diff between two saved plan versions.
 */
export interface PlanDiff {
  earlierVersion: PlanVersionSummary;
  laterVersion: PlanVersionSummary;
  added: PlanRow[];
  removed: PlanRow[];
  changed: Array<{ row: PlanRow; changes: ChangedField[] }>;
}
