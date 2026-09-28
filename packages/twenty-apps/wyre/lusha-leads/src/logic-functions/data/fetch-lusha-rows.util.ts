import { type LushaConfig } from 'src/logic-functions/lusha-api/get-lusha-config.util';
import {
  getLushaTableEntities,
  LUSHA_MAX_PAGE_SIZE,
} from 'src/logic-functions/lusha-api/get-lusha-table-entities';
import {
  type LushaEntitiesPage,
  type LushaTableEntity,
} from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

export type LushaRowsPage = {
  rows: LushaTableEntity[];
  creditsCharged: number;
};

// Injected so the pagination arithmetic can be tested without spending
// credits: nothing in this repository may call the live Lusha API.
export type LushaTableEntitiesReader = (args: {
  config: LushaConfig;
  page: number;
  size: number;
}) => Promise<LushaEntitiesPage>;

// page is a 0-based index and Lusha derives the offset from page * size, so
// size has to stay constant for the whole run. Narrowing the last page to the
// remaining budget would slide the window backwards over rows already read and
// paid for, and leave the rows past it unread; the budget is enforced by
// trimming locally instead.
export const fetchLushaRows = async (
  config: LushaConfig,
  readTableEntities: LushaTableEntitiesReader = getLushaTableEntities,
): Promise<LushaRowsPage> => {
  const rows: LushaTableEntity[] = [];
  const size = Math.min(config.rowsPerRun, LUSHA_MAX_PAGE_SIZE);
  let creditsCharged = 0;
  let page = 0;

  while (rows.length < config.rowsPerRun) {
    const response = await readTableEntities({ config, page, size });
    const pageRows = response.data ?? [];

    // rowsPerRun is a spend ceiling, so a server that ignores size must not be
    // able to carry the run past it.
    rows.push(...pageRows.slice(0, config.rowsPerRun - rows.length));
    creditsCharged += response.billing?.creditsCharged ?? 0;

    const total = response.pagination?.total;

    if (
      pageRows.length === 0 ||
      pageRows.length < size ||
      (typeof total === 'number' && rows.length >= total)
    ) {
      break;
    }

    page += 1;
  }

  return { rows, creditsCharged };
};
