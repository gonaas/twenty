// Flattened view of the Person fields this app reads before deciding whether
// a row is already in the CRM and which of its fields are still empty.
export type LushaPersonRecord = {
  id: string;
  lushaContactId: string | null;
  linkedinLinkUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  primaryEmail: string | null;
  primaryPhoneNumber: string | null;
  companyId: string | null;
};
