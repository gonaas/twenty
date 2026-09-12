import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileChat } from 'src/logic-functions/unipile-api/types/unipile-chat.type';
import { unipileRequest } from 'src/logic-functions/unipile-api/unipile-request.util';

export const getUnipileChat = async (
  config: UnipileConfig,
  chatId: string,
): Promise<UnipileChat> =>
  unipileRequest<UnipileChat>({
    config,
    path: `/api/v1/chats/${encodeURIComponent(chatId)}`,
    query: { account_id: config.accountId },
  });
