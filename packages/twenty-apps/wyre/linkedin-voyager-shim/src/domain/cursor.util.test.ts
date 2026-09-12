import {
  InvalidCursorError,
  decodeCursor,
  encodeCursor,
  nextCursor,
} from 'src/domain/cursor.util';

describe('cursor', () => {
  it('round-trips an offset', () => {
    expect(decodeCursor(encodeCursor(1250))).toBe(1250);
  });

  it('treats a missing cursor as offset zero', () => {
    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor('')).toBe(0);
  });

  it('rejects garbage and negative offsets', () => {
    expect(() => decodeCursor('not-base64-json')).toThrow(InvalidCursorError);
    expect(() =>
      decodeCursor(Buffer.from('{"offset":-1}').toString('base64url')),
    ).toThrow(InvalidCursorError);
  });

  it('returns null once the page reaches the end', () => {
    expect(nextCursor({ offset: 0, pageSize: 100, total: 250 })).toBe(encodeCursor(100));
    expect(nextCursor({ offset: 200, pageSize: 100, total: 250 })).toBeNull();
    expect(nextCursor({ offset: 0, pageSize: 100, total: 100 })).toBeNull();
  });
});
