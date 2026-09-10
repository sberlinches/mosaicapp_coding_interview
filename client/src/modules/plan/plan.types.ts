export interface PlanRow {
  id: string;
  personName: string;
  role: string;
  team: string;
  allocationPct: number;
  startDate: string;
  endDate: string;
}

export type EditablePlanRow = Omit<PlanRow, 'id'> & { id?: string };

export interface PlanVersion {
  id: string;
  name: string;
  createdAt: string;
  rowCount: number;
}

export type ChangedField = {
  field: keyof Omit<PlanRow, 'id'>;
  oldValue: string | number;
  newValue: string | number;
};

export interface PlanDiff {
  earlierVersion: PlanVersion;
  laterVersion: PlanVersion;
  added: PlanRow[];
  removed: PlanRow[];
  changed: Array<{ row: PlanRow; changes: ChangedField[] }>;
}
