import { type LinkedinConnection } from 'src/constants/linkedin-connection-options';

export type UnipileNetworkDistance =
  | 'FIRST_DEGREE'
  | 'SECOND_DEGREE'
  | 'THIRD_DEGREE'
  | 'OUT_OF_NETWORK';

export type UnipileProfileInvitation = {
  type: 'SENT' | 'RECEIVED';
  status: 'PENDING' | 'IGNORED' | 'WITHDRAWN';
};

export type UnipileProfileLookupResult = {
  networkDistance: UnipileNetworkDistance;
  invitation: UnipileProfileInvitation | null;
};

export const mapProfileToConnection = (
  profile: UnipileProfileLookupResult,
): LinkedinConnection => {
  if (profile.networkDistance === 'FIRST_DEGREE') {
    return 'CONNECTED';
  }

  if (
    profile.invitation?.type === 'SENT' &&
    profile.invitation.status === 'PENDING'
  ) {
    return 'INVITATION_SENT';
  }

  if (
    profile.invitation?.type === 'RECEIVED' &&
    profile.invitation.status === 'PENDING'
  ) {
    return 'INVITATION_RECEIVED';
  }

  return 'NOT_CONNECTED';
};
