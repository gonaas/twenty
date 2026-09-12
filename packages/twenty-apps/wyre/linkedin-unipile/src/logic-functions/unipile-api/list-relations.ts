import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileCursorPage } from 'src/logic-functions/unipile-api/types/unipile-cursor-page.type';
import { type UnipileRelation } from 'src/logic-functions/unipile-api/types/unipile-relation.type';
import { unipileRequest } from 'src/logic-functions/unipile-api/unipile-request.util';

const RELATIONS_PAGE_SIZE = 1000;

export const listUnipileRelations = async (
  config: UnipileConfig,
  cursor?: string,
): Promise<UnipileCursorPage<UnipileRelation>> =>
  unipileRequest<UnipileCursorPage<UnipileRelation>>({
    config,
    path: '/api/v1/users/relations',
    query: {
      account_id: config.accountId,
      limit: RELATIONS_PAGE_SIZE,
      cursor,
    },
  });
