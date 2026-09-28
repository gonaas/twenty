import { describe, expect, it } from 'vitest';

import {
  fetchLushaRows,
  type LushaTableEntitiesReader,
} from 'src/logic-functions/data/fetch-lusha-rows.util';
import { type LushaConfig } from 'src/logic-functions/lusha-api/get-lusha-config.util';
import { type LushaTableEntity } from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

const buildConfig = (rowsPerRun: number): LushaConfig => ({
  apiKey: 'test-api-key',
  tableId: 'test-table-id',
  ownerEmail: undefined,
  rowsPerRun,
  shouldCreateCompanies: false,
});

// Mirrors what Lusha does with the two query parameters: page is a 0-based
// index and the rows it answers with start at page * size. Every row carries a
// unique id so a window that slides backwards shows up as a repeat.
const buildFakeLushaServer = ({
  total,
  rowsReturnedPerPage,
}: {
  total: number;
  rowsReturnedPerPage?: number;
}): {
  read: LushaTableEntitiesReader;
  calls: { page: number; size: number }[];
} => {
  const calls: { page: number; size: number }[] = [];

  const read: LushaTableEntitiesReader = ({ page, size }) => {
    calls.push({ page, size });

    const offset = page * size;
    const rowCount = Math.max(
      0,
      Math.min(rowsReturnedPerPage ?? size, total - offset),
    );

    return Promise.resolve({
      data: Array.from({ length: rowCount }, (_unused, index) => ({
        id: `row-${offset + index}`,
      })),
      pagination: { page, size, total },
      billing: { creditsCharged: rowCount, resultsReturned: rowCount },
    });
  };

  return { read, calls };
};

const readRowIds = (rows: LushaTableEntity[]): (string | null | undefined)[] =>
  rows.map((row) => row.id);

describe('fetchLushaRows', () => {
  it('reads a budget that is an exact multiple of the page size in whole pages', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 1000 });

    const { rows } = await fetchLushaRows(buildConfig(200), read);

    expect(calls).toEqual([
      { page: 0, size: 100 },
      { page: 1, size: 100 },
    ]);
    expect(readRowIds(rows)).toEqual(
      Array.from({ length: 200 }, (_unused, index) => `row-${index}`),
    );
  });

  it('keeps the page size constant so a budget that is not a multiple reads distinct rows', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 1000 });

    const { rows } = await fetchLushaRows(buildConfig(150), read);

    expect(calls).toEqual([
      { page: 0, size: 100 },
      { page: 1, size: 100 },
    ]);
    expect(readRowIds(rows)).toEqual(
      Array.from({ length: 150 }, (_unused, index) => `row-${index}`),
    );
    expect(new Set(readRowIds(rows)).size).toBe(150);
  });

  it('reports the credits every page charged, not just the rows it kept', async () => {
    const { read } = buildFakeLushaServer({ total: 1000 });

    const { rows, creditsCharged } = await fetchLushaRows(
      buildConfig(150),
      read,
    );

    expect(rows).toHaveLength(150);
    expect(creditsCharged).toBe(200);
  });

  it('stops when the server returns fewer rows than asked for', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 40 });

    const { rows } = await fetchLushaRows(buildConfig(100), read);

    expect(calls).toEqual([{ page: 0, size: 100 }]);
    expect(rows).toHaveLength(40);
  });

  it('never keeps more rows than the budget when the server returns more than asked for', async () => {
    const { read, calls } = buildFakeLushaServer({
      total: 1000,
      rowsReturnedPerPage: 130,
    });

    const { rows } = await fetchLushaRows(buildConfig(100), read);

    expect(calls).toEqual([{ page: 0, size: 100 }]);
    expect(readRowIds(rows)).toEqual(
      Array.from({ length: 100 }, (_unused, index) => `row-${index}`),
    );
  });

  it('stops once the reported total has been read', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 200 });

    const { rows } = await fetchLushaRows(buildConfig(300), read);

    expect(calls).toEqual([
      { page: 0, size: 100 },
      { page: 1, size: 100 },
    ]);
    expect(rows).toHaveLength(200);
  });

  it('stops on an empty first page', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 0 });

    const { rows, creditsCharged } = await fetchLushaRows(
      buildConfig(100),
      read,
    );

    expect(calls).toEqual([{ page: 0, size: 100 }]);
    expect(rows).toEqual([]);
    expect(creditsCharged).toBe(0);
  });

  it('spends nothing when the budget is zero', async () => {
    const { read, calls } = buildFakeLushaServer({ total: 1000 });

    const { rows, creditsCharged } = await fetchLushaRows(buildConfig(0), read);

    expect(calls).toEqual([]);
    expect(rows).toEqual([]);
    expect(creditsCharged).toBe(0);
  });
});
