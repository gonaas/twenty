import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileCursorPage } from 'src/logic-functions/unipile-api/types/unipile-cursor-page.type';
import { type UnipileListedMessage } from 'src/logic-functions/unipile-api/types/unipile-listed-message.type';
import { unipileRequest } from 'src/logic-functions/unipile-api/unipile-request.util';

const MESSAGES_PAGE_SIZE = 250;

export const listUnipileMessages = async (
  config: UnipileConfig,
  { after, cursor }: { after?: string; cursor?: string },
): Promise<UnipileCursorPage<UnipileListedMessage>> =>
  unipileRequest<UnipileCursorPage<UnipileListedMessage>>({
    config,
    path: '/api/v1/messages',
    query: {
      account_id: config.accountId,
      after,
      limit: MESSAGES_PAGE_SIZE,
      cursor,
    },
  });
