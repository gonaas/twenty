// LinkedIn identifies members with several URN flavours that all end in the
// same opaque id; Unipile exposes that tail as provider_id / member_id.
const PROFILE_URN_PATTERN = /^urn:li:(?:fsd_profile|fs_miniProfile|member|fs_profile):([A-Za-z0-9_-]+)$/;

export const extractProviderId = (urn: string | null | undefined): string | null => {
  if (typeof urn !== 'string') {
    return null;
  }

  const match = PROFILE_URN_PATTERN.exec(urn.trim());

  return match?.[1] ?? null;
};

export const extractUrnTail = (urn: string | null | undefined): string | null => {
  if (typeof urn !== 'string') {
    return null;
  }

  const separatorIndex = urn.lastIndexOf(':');

  if (separatorIndex === -1 || separatorIndex === urn.length - 1) {
    return null;
  }

  return urn.slice(separatorIndex + 1);
};
