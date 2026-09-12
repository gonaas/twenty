import { isNonEmptyString } from '@sniptt/guards';

import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';
import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { toIsoTimestamp } from 'src/logic-functions/domain/to-iso-timestamp';
import { applyLinkedinPersonPatch } from 'src/logic-functions/data/linkedin-working-set.util';
import { listUnipileSentInvitations } from 'src/logic-functions/unipile-api/list-sent-invitations';
import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';

export type SyncLinkedinSentInvitationsResult = { matched: number };

// GET /users/invite/sent lists pending outbound invitations; a match not
// already CONNECTED means an invitation is out, so the relationship is at
// least CONNECTED (this app's linkedinStatus value for "invited them").
export const syncLinkedinSentInvitations = async ({
  config,
  memberIdIndex,
  identifierIndex,
}: {
  config: UnipileConfig;
  memberIdIndex: Map<string, LinkedinWorkingPerson>;
  identifierIndex: Map<string, LinkedinWorkingPerson>;
}): Promise<SyncLinkedinSentInvitationsResult> => {
  let cursor: string | undefined;
  let matched = 0;

  do {
    const page = await listUnipileSentInvitations(config, cursor);

    for (const invitation of page.items) {
      const working =
        (isNonEmptyString(invitation.invited_user_id)
          ? memberIdIndex.get(invitation.invited_user_id)
          : undefined) ??
        (isNonEmptyString(invitation.invited_user_public_id)
          ? identifierIndex.get(
              normalizeLinkedinIdentifier(invitation.invited_user_public_id),
            )
          : undefined);

      if (working === undefined || working.linkedinConnection === 'CONNECTED') {
        continue;
      }

      const invitationSentAt =
        toIsoTimestamp(invitation.parsed_datetime) ??
        toIsoTimestamp(invitation.date);

      applyLinkedinPersonPatch(working, {
        linkedinConnection: 'INVITATION_SENT',
        ...(invitationSentAt !== null
          ? { linkedinInvitationSentAt: invitationSentAt }
          : {}),
        linkedinStatus: advanceLinkedinStatus(working.linkedinStatus, 'CONNECTED'),
      });

      matched += 1;
    }

    cursor = page.cursor ?? undefined;
  } while (isNonEmptyString(cursor));

  return { matched };
};
