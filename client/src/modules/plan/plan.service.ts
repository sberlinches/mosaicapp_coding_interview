import type {
  EditablePlanRow,
  PlanDiff,
  PlanRow,
  PlanVersion,
} from './plan.types.ts';

const baseUrl = import.meta.env.VITE_API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  const data: unknown = await response.json();
  // The endpoint response is typed by each feature method at this boundary.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return data as T;
}

export function fetchPlan(): Promise<PlanRow[]> {
  return request<PlanRow[]>('/plan');
}

export function fetchVersions(): Promise<PlanVersion[]> {
  return request<PlanVersion[]>('/plan/versions');
}

export function saveVersion(
  name: string,
  rows: EditablePlanRow[],
): Promise<PlanVersion> {
  return request<PlanVersion>('/plan/versions', {
    method: 'POST',
    body: JSON.stringify({ name, rows }),
  });
}

export function fetchDiff(
  earlierId: string,
  laterId: string,
): Promise<PlanDiff> {
  const query = new URLSearchParams({ earlierId, laterId });
  return request<PlanDiff>(`/plan/versions/diff?${query.toString()}`);
}
