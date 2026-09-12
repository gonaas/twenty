// One item of GET /api/v1/users/relations.
export type UnipileRelation = {
  member_id: string;
  public_identifier: string | null;
  public_profile_url: string | null;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  created_at: string | number | null;
};
