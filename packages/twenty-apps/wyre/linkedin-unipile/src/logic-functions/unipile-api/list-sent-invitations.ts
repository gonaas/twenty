import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileCursorPage } from 'src/logic-functions/unipile-api/types/unipile-cursor-page.type';
import { type UnipileSentInvitation } from 'src/logic-functions/unipile-api/types/unipile-sent-invitation.type';
import { unipileRequest } from 'src/logic-functions/unipile-api/unipile-request.util';

// The live API caps this endpoint at 100 even though the docs say 250.
const SENT_INVITATIONS_PAGE_SIZE = 100;

export const listUnipileSentInvitations = async (
  config: UnipileConfig,
  cursor?: string,
): Promise<UnipileCursorPage<UnipileSentInvitation>> =>
  unipileRequest<UnipileCursorPage<UnipileSentInvitation>>({
    config,
    path: '/api/v1/users/invite/sent',
    query: {
      account_id: config.accountId,
      limit: SENT_INVITATIONS_PAGE_SIZE,
      cursor,
    },
  });
