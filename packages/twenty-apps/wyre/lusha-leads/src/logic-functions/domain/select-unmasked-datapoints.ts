import { isNonEmptyString } from '@sniptt/guards';

import { type LushaDatapoint } from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

// The row-level type Lusha sets once a contact has been revealed; any other
// value means every datapoint on that row is still masked.
export const LUSHA_SHOWN_ROW_TYPE = 'SHOWN';

// Lusha masks emails and phones until the contact is revealed, and a masked
// value ("...@kronosig.com", "+34 671...") still parses as a plausible email
// or phone number, so nothing but these two flags tells it apart from a real
// one. Both must say "unmasked" explicitly: an absent or null isMasked would
// otherwise let a masked value through and poison search, filters and any
// future outreach with an address nobody can be reached at. Revealing costs
// credits and is out of this app's scope.
export const selectUnmaskedDatapoints = <TDatapoint extends LushaDatapoint>({
  datapoints,
  rowType,
}: {
  datapoints: TDatapoint[] | null | undefined;
  rowType: string | null | undefined;
}): TDatapoint[] =>
  rowType === LUSHA_SHOWN_ROW_TYPE
    ? (datapoints ?? []).filter(
        (datapoint) =>
          datapoint.isMasked === false &&
          isNonEmptyString(datapoint.value?.trim()),
      )
    : [];
