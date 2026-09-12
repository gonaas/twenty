const EPOCH_SECONDS_UPPER_BOUND = 1_000_000_000_000;

// Unipile mixes formats: messages and chats carry ISO strings, relations carry
// epoch milliseconds, and invitations may only carry a human label like
// "2 weeks ago". Anything that does not parse becomes null so it never reaches
// a DATE_TIME field.
export const toIsoTimestamp = (
  value: string | number | null | undefined,
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = typeof value === 'string' ? value.trim() : value;

  if (trimmed === '') {
    return null;
  }

  const numeric =
    typeof trimmed === 'number'
      ? trimmed
      : /^\d+$/.test(trimmed)
        ? Number(trimmed)
        : null;

  const date =
    numeric !== null
      ? new Date(
          numeric < EPOCH_SECONDS_UPPER_BOUND ? numeric * 1000 : numeric,
        )
      : new Date(trimmed);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
