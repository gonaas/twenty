import { extractProviderId } from 'src/domain/provider-id.util';
import { indexIncluded, readString, resolveReference } from 'src/linkedin/denormalize.util';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

export const mapMeToProviderId = (response: VoyagerNormalizedResponse): string | null => {
  const index = indexIncluded(response);
  const miniProfile = resolveReference(index, response.data, 'miniProfile');

  return (
    extractProviderId(miniProfile?.entityUrn) ??
    extractProviderId(readString(response.data, 'miniProfile')) ??
    extractProviderId(readString(response.data, 'entityUrn'))
  );
};
