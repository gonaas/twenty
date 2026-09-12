// GET /api/v1/users/{identifier}.
export type UnipileUserProfile = {
  provider_id: string;
  public_identifier: string | null;
  network_distance:
    | 'FIRST_DEGREE'
    | 'SECOND_DEGREE'
    | 'THIRD_DEGREE'
    | 'OUT_OF_NETWORK';
  is_relationship: boolean;
  invitation: {
    type: 'SENT' | 'RECEIVED';
    status: 'PENDING' | 'IGNORED' | 'WITHDRAWN';
  } | null;
};
