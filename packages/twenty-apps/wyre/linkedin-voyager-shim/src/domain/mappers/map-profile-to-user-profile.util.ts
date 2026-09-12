import { type UnipileUserProfile } from 'src/domain/unipile/unipile-user-profile.type';
import { extractProviderId } from 'src/domain/provider-id.util';
import {
  indexIncluded,
  listElements,
  readObject,
  readString,
  resolveReference,
} from 'src/linkedin/denormalize.util';
import { type VoyagerEntity, type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

const DISTANCE_TO_NETWORK_DISTANCE: Record<string, UnipileUserProfile['network_distance']> = {
  DISTANCE_1: 'FIRST_DEGREE',
  DISTANCE_2: 'SECOND_DEGREE',
  DISTANCE_3: 'THIRD_DEGREE',
  OUT_OF_NETWORK: 'OUT_OF_NETWORK',
};

export type ProfileIdentity = {
  providerId: string;
  publicIdentifier: string | null;
};

export const mapProfileIdentity = (response: VoyagerNormalizedResponse): ProfileIdentity | null => {
  const index = indexIncluded(response);
  const profile = listElements(index, response)[0] ?? null;
  const providerId = extractProviderId(profile?.entityUrn);

  if (profile === null || providerId === null) {
    return null;
  }

  return { providerId, publicIdentifier: readString(profile, 'publicIdentifier') };
};

// memberDistance arrived as a plain string on the live API and as { value }
// in older payloads; accept both.
const readDistance = (noConnection: VoyagerEntity | null): string | null =>
  readString(noConnection, 'memberDistance') ?? readString(readObject(noConnection, 'memberDistance'), 'value');

export const mapMemberRelationship = ({
  identity,
  response,
  ownProviderId,
}: {
  identity: ProfileIdentity;
  response: VoyagerNormalizedResponse;
  ownProviderId: string;
}): UnipileUserProfile => {
  const index = indexIncluded(response);
  const relationshipUnion = readObject(response.data, 'memberRelationshipUnion');
  const relationshipData = readObject(response.data, 'memberRelationshipData');
  const noConnection = readObject(relationshipUnion, 'noConnection');
  // The connection side of the union arrives inline or as a *connection URN
  // reference depending on the projection; either one means first degree.
  const isConnected = [relationshipUnion, relationshipData].some(
    (container) => container !== null && ('connection' in container || '*connection' in container),
  );

  if (isConnected) {
    return {
      provider_id: identity.providerId,
      public_identifier: identity.publicIdentifier,
      network_distance: 'FIRST_DEGREE',
      is_relationship: true,
      invitation: null,
    };
  }

  const distance = readDistance(noConnection);
  const invitationUnion = readObject(noConnection, 'invitationUnion');
  const pendingInvitation = resolveReference(index, invitationUnion ?? {}, 'invitation');
  const inviterUrn =
    readString(pendingInvitation, 'inviter') ??
    resolveReference(index, pendingInvitation ?? {}, 'inviter')?.entityUrn ??
    null;
  const inviterProviderId = extractProviderId(inviterUrn);

  return {
    provider_id: identity.providerId,
    public_identifier: identity.publicIdentifier,
    network_distance:
      (distance === null ? undefined : DISTANCE_TO_NETWORK_DISTANCE[distance]) ?? 'OUT_OF_NETWORK',
    is_relationship: false,
    invitation:
      pendingInvitation === null
        ? null
        : {
            type: inviterProviderId !== null && inviterProviderId !== ownProviderId ? 'RECEIVED' : 'SENT',
            status: 'PENDING',
          },
  };
};
