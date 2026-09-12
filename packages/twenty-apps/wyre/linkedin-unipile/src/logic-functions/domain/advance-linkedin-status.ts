import {
  LINKEDIN_STATUS_ORDER,
  type LinkedinStatus,
} from 'src/constants/linkedin-status-order';

export const advanceLinkedinStatus = (
  current: LinkedinStatus | null,
  candidate: LinkedinStatus,
): LinkedinStatus => {
  if (current === null) {
    return candidate;
  }

  return LINKEDIN_STATUS_ORDER[candidate] > LINKEDIN_STATUS_ORDER[current]
    ? candidate
    : current;
};
