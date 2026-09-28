import { isDefined } from 'twenty-sdk/utils';

import { LushaRequestError } from 'src/logic-functions/errors/lusha-request-error';
import { type LushaConfig } from 'src/logic-functions/lusha-api/get-lusha-config.util';
import { type LushaEntitiesPage } from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

// Every byte this app exchanges with Lusha goes through this file, so a
// change to the REST contract is a one-file correction. Verified against
// https://docs.lusha.com/apis/openapi/contacts-tables/getcontactstableentities
// (and the published spec at https://docs.lusha.com/_spec/apis/@v3/openapi.yaml)
// on 2026-09-28.
const LUSHA_API_BASE_URL = 'https://api.lusha.com';
const LUSHA_API_KEY_HEADER_NAME = 'api_key';

// The spec caps page at 100 and defaults size to 100; page is 0-based.
export const LUSHA_MAX_PAGE_SIZE = 100;

export const getLushaTableEntities = async ({
  config,
  page,
  size,
}: {
  config: LushaConfig;
  page: number;
  size: number;
}): Promise<LushaEntitiesPage> => {
  const url = new URL(
    `/v3/contacts/tables/${encodeURIComponent(config.tableId)}/entities`,
    LUSHA_API_BASE_URL,
  );

  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));

  // A GET carries no body, so Lusha takes the owner as a query parameter; it
  // scopes the ownership and visibility checks on the table.
  if (isDefined(config.ownerEmail)) {
    url.searchParams.set('email', config.ownerEmail);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { [LUSHA_API_KEY_HEADER_NAME]: config.apiKey },
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new LushaRequestError(
      `Lusha table entities request failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  return body as LushaEntitiesPage;
};
