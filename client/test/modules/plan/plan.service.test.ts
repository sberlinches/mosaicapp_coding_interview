import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDiff,
  fetchPlan,
  fetchVersions,
  saveVersion,
} from '../../../src/modules/plan/plan.service.ts';

describe('plan service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the current plan', async () => {
    const response = new Response(JSON.stringify([{ id: 'row-1' }]), {
      status: 200,
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await expect(fetchPlan()).resolves.toStrictEqual([{ id: 'row-1' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/plan'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('should fetch versions and a diff with encoded query parameters', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ added: [] }), { status: 200 }),
      );

    await expect(fetchVersions()).resolves.toStrictEqual([]);
    await expect(fetchDiff('earlier id', 'later id')).resolves.toStrictEqual({
      added: [],
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('earlierId=earlier+id&laterId=later+id'),
      expect.anything(),
    );
  });

  it('should post a named version and its rows', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'version-1' }), { status: 200 }),
      );
    const rows = [
      {
        personName: 'Priya Sharma',
        role: 'Engineer',
        team: 'Web',
        allocationPct: 50,
        startDate: '2026-01-05',
        endDate: '2026-06-30',
      },
    ];

    await expect(saveVersion('Baseline', rows)).resolves.toStrictEqual({
      id: 'version-1',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/plan/versions'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Baseline', rows }),
      }),
    );
  });

  it('should throw the API message for failed requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Database unavailable', { status: 503 }),
    );

    await expect(fetchPlan()).rejects.toThrow('Database unavailable');
  });

  it('should throw a status message when a failed request has no body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 500 }),
    );

    await expect(fetchPlan()).rejects.toThrow('Request failed with status 500');
  });
});
