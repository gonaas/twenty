export class InvalidCursorError extends Error {
  constructor() {
    super('Invalid cursor');
    this.name = 'InvalidCursorError';
  }
}

export const encodeCursor = (offset: number): string =>
  Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64url');

export const decodeCursor = (cursor: string | undefined): number => {
  if (cursor === undefined || cursor === '') {
    return 0;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new InvalidCursorError();
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('offset' in parsed) ||
    typeof parsed.offset !== 'number' ||
    !Number.isInteger(parsed.offset) ||
    parsed.offset < 0
  ) {
    throw new InvalidCursorError();
  }

  return parsed.offset;
};

export const nextCursor = ({
  offset,
  pageSize,
  total,
}: {
  offset: number;
  pageSize: number;
  total: number;
}): string | null => {
  const nextOffset = offset + pageSize;

  return nextOffset < total ? encodeCursor(nextOffset) : null;
};
