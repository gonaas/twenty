import { describe, expect, it } from 'vitest';

import { selectUnmaskedDatapoints } from 'src/logic-functions/domain/select-unmasked-datapoints';

describe('selectUnmaskedDatapoints', () => {
  it('drops a masked datapoint', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [
          { value: '...@kronosig.com', type: 'work', isMasked: true },
        ],
        rowType: 'SHOWN',
      }),
    ).toEqual([]);
  });

  it('keeps an unmasked datapoint', () => {
    const real = { value: 'oscar@kronosig.com', type: 'work', isMasked: false };

    expect(
      selectUnmaskedDatapoints({ datapoints: [real], rowType: 'SHOWN' }),
    ).toEqual([real]);
  });

  it('keeps only the unmasked datapoints of a mixed list', () => {
    const real = { value: 'oscar@kronosig.com', isMasked: false };

    expect(
      selectUnmaskedDatapoints({
        datapoints: [
          { value: '...@kronosig.com', isMasked: true },
          real,
          { value: '...@example.com', isMasked: true },
        ],
        rowType: 'SHOWN',
      }),
    ).toEqual([real]);
  });

  it('preserves the order of the unmasked datapoints', () => {
    const first = { value: 'first@kronosig.com', isMasked: false };
    const second = { value: 'second@kronosig.com', isMasked: false };

    expect(
      selectUnmaskedDatapoints({
        datapoints: [
          first,
          { value: '...@kronosig.com', isMasked: true },
          second,
        ],
        rowType: 'SHOWN',
      }),
    ).toEqual([first, second]);
  });

  it('drops a masked phone datapoint', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [
          {
            value: '+34 671...',
            countryCode: 34,
            type: 'mobile',
            isMasked: true,
          },
        ],
        rowType: 'SHOWN',
      }),
    ).toEqual([]);
  });

  it('returns an empty list for an empty array', () => {
    expect(
      selectUnmaskedDatapoints({ datapoints: [], rowType: 'SHOWN' }),
    ).toEqual([]);
  });

  it('returns an empty list for undefined', () => {
    expect(
      selectUnmaskedDatapoints({ datapoints: undefined, rowType: 'SHOWN' }),
    ).toEqual([]);
  });

  it('returns an empty list for null', () => {
    expect(
      selectUnmaskedDatapoints({ datapoints: null, rowType: 'SHOWN' }),
    ).toEqual([]);
  });

  it('drops a datapoint with no value even when it is not masked', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [
          { value: null, isMasked: false },
          { value: '   ', isMasked: false },
          { isMasked: false },
        ],
        rowType: 'SHOWN',
      }),
    ).toEqual([]);
  });

  it('rejects a datapoint that carries no isMasked flag', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com' }],
        rowType: 'SHOWN',
      }),
    ).toEqual([]);
  });

  it('rejects a datapoint whose isMasked is null', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com', isMasked: null }],
        rowType: 'SHOWN',
      }),
    ).toEqual([]);
  });

  it('rejects every datapoint of a row that was never shown', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com', isMasked: false }],
        rowType: 'UNSHOWN',
      }),
    ).toEqual([]);
  });

  it('rejects every datapoint of a row with no type at all', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com', isMasked: false }],
        rowType: undefined,
      }),
    ).toEqual([]);
  });

  it('rejects every datapoint of a row whose type is null', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com', isMasked: false }],
        rowType: null,
      }),
    ).toEqual([]);
  });

  it('does not treat a lowercase shown as revealed', () => {
    expect(
      selectUnmaskedDatapoints({
        datapoints: [{ value: 'oscar@kronosig.com', isMasked: false }],
        rowType: 'shown',
      }),
    ).toEqual([]);
  });
});
