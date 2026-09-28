// Datapoints come back masked ("...@example.com", "+34 671...") unless the
// contact was revealed, and a masked value is indistinguishable from a real
// one by shape alone — only isMasked tells them apart.
export type LushaDatapoint = {
  value?: string | null;
  type?: string | null;
  isMasked?: boolean | null;
};

export type LushaEmailDatapoint = LushaDatapoint & {
  qualityScore?: number | null;
};

export type LushaPhoneDatapoint = LushaDatapoint & {
  countryCode?: number | null;
  doNotCall?: boolean | null;
};

export type LushaTableColumn = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  sourceType?: string | null;
  value?: unknown;
  status?:
    | 'not_run'
    | 'processing'
    | 'success'
    | 'no_data'
    | 'failed'
    | (string & {})
    | null;
};

// The published schema documents id and columns and states the rest of the
// row is owned by the Workspace service and "representative, not an
// exhaustive schema", so every field beyond id is optional here.
export type LushaTableEntity = {
  id?: string | null;
  type?: string | null;
  tableContactId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  columns?: LushaTableColumn[] | null;
  datapoints?: {
    emails?: LushaEmailDatapoint[] | null;
    phones?: LushaPhoneDatapoint[] | null;
  } | null;
  job?: {
    title?: string | null;
    seniority?: string | null;
    departments?: string[] | null;
  } | null;
  socialLinks?: {
    linkedin?: string | null;
  } | null;
};

export type LushaEntitiesPage = {
  data?: LushaTableEntity[] | null;
  pagination?: {
    page?: number | null;
    size?: number | null;
    total?: number | null;
  } | null;
  // V3Billing carries exactly these two properties; the v3 spec has no
  // low-balance signal on this route.
  billing?: {
    creditsCharged?: number | null;
    resultsReturned?: number | null;
  } | null;
};
