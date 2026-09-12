import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';
import { extractProviderId } from 'src/domain/provider-id.util';
import {
  indexIncluded,
  listElements,
  readNumber,
  readString,
  resolveReference,
} from 'src/linkedin/denormalize.util';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

const buildProfileUrl = (publicIdentifier: string | null): string | null =>
  publicIdentifier === null ? null : `https://www.linkedin.com/in/${publicIdentifier}/`;

export const mapConnectionsToRelations = (
  response: VoyagerNormalizedResponse,
): UnipileRelation[] => {
  const index = indexIncluded(response);
  const relations: UnipileRelation[] = [];

  for (const connection of listElements(index, response)) {
    const profile = resolveReference(index, connection, 'connectedMember');
    const memberId =
      extractProviderId(profile?.entityUrn) ??
      extractProviderId(readString(connection, 'connectedMember')) ??
      extractProviderId(readString(connection, '*connectedMemberResolutionResult'));

    if (memberId === null) {
      continue;
    }

    const publicIdentifier = readString(profile, 'publicIdentifier');

    relations.push({
      member_id: memberId,
      public_identifier: publicIdentifier,
      public_profile_url: buildProfileUrl(publicIdentifier),
      first_name: readString(profile, 'firstName'),
      last_name: readString(profile, 'lastName'),
      headline: readString(profile, 'headline'),
      created_at: readNumber(connection, 'createdAt'),
    });
  }

  return relations;
};
