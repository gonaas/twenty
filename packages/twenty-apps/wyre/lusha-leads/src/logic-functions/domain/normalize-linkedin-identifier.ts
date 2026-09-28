const decodeIfPercentEncoded = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// Copied from the LinkedIn (Unipile) app rather than imported: the two apps
// deploy and version independently, so a cross-app import would couple them.
// Both must agree on the slug, because that slug is how a Person ingested
// here is recognised there.
//
// Accepts a full LinkedIn profile URL (percent-encoded or not), with or
// without www./a trailing slash, or a bare vanity slug, and returns the
// lowercase slug so different representations of the same profile match.
export const normalizeLinkedinIdentifier = (value: string): string => {
  const decoded = decodeIfPercentEncoded(value.trim());
  const withoutQuery = decoded.split(/[?#]/)[0];
  const withoutProtocol = withoutQuery.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const withoutWww = withoutProtocol.replace(/^www\./i, '');
  const withoutTrailingSlash = withoutWww.replace(/\/+$/, '');
  const inPathMatch = withoutTrailingSlash.match(/\/in\/([^/]+)/i);
  const slug = inPathMatch?.[1] ?? withoutTrailingSlash.split('/').pop();

  return (slug ?? withoutTrailingSlash).toLowerCase();
};
