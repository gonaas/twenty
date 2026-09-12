import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileUserProfile } from 'src/logic-functions/unipile-api/types/unipile-user-profile.type';
import { unipileRequest } from 'src/logic-functions/unipile-api/unipile-request.util';

export const getUnipileUser = async (
  config: UnipileConfig,
  identifier: string,
): Promise<UnipileUserProfile> =>
  unipileRequest<UnipileUserProfile>({
    config,
    path: `/api/v1/users/${encodeURIComponent(identifier)}`,
    query: { account_id: config.accountId },
  });
