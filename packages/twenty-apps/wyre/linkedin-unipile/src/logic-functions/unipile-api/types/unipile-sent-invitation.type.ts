// One item of GET /api/v1/users/invite/sent.
export type UnipileSentInvitation = {
  id: string;
  invited_user: string | null;
  invited_user_id: string | null;
  invited_user_public_id: string | null;
  date: string;
  parsed_datetime: string | null;
  invitation_text: string | null;
};
