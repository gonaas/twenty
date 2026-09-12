import { type UnipileSentInvitation } from 'src/domain/unipile/unipile-sent-invitation.type';
import { extractProviderId, extractUrnTail } from 'src/domain/provider-id.util';
import {
  indexIncluded,
  listElements,
  readNumber,
  readString,
  resolveReference,
} from 'src/linkedin/denormalize.util';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

const buildFullName = (firstName: string | null, lastName: string | null): string | null => {
  const fullName = [firstName, lastName].filter((part) => part !== null).join(' ');

  return fullName === '' ? null : fullName;
};

export const mapSentInvitations = (
  response: VoyagerNormalizedResponse,
): UnipileSentInvitation[] => {
  const index = indexIncluded(response);
  const invitations: UnipileSentInvitation[] = [];

  for (const view of listElements(index, response)) {
    const invitation = resolveReference(index, view, 'invitation') ?? view;
    const id = extractUrnTail(invitation.entityUrn);

    if (id === null) {
      continue;
    }

    const invitee = resolveReference(index, invitation, 'toMember');
    const sentTime = readNumber(invitation, 'sentTime');
    const parsedDatetime = sentTime === null ? null : new Date(sentTime).toISOString();

    invitations.push({
      id,
      invited_user: buildFullName(readString(invitee, 'firstName'), readString(invitee, 'lastName')),
      invited_user_id: extractProviderId(invitee?.entityUrn),
      invited_user_public_id: readString(invitee, 'publicIdentifier'),
      date: parsedDatetime ?? '',
      parsed_datetime: parsedDatetime,
      invitation_text: readString(invitation, 'message'),
    });
  }

  return invitations;
};
