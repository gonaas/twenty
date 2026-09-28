import { type CoreApiClient } from 'twenty-client-sdk/core';

import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

const PEOPLE_PAGE_SIZE = 200;

type LushaPersonNode = {
  id: string;
  name: { firstName: string | null; lastName: string | null } | null;
  linkedinLink: { primaryLinkUrl: string | null } | null;
  jobTitle: string | null;
  emails: { primaryEmail: string | null } | null;
  phones: { primaryPhoneNumber: string | null } | null;
  companyId: string | null;
  lushaContactId: string | null;
};

type LushaPeopleConnection = {
  edges: Array<{ node: LushaPersonNode }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

// The generated client is typed against whichever workspace it was built
// from, which does not know about this app's lushaContactId. This is the one
// place the selection and the result get cast; everything else works on the
// typed LushaPersonRecord below.
const LUSHA_PERSON_SELECTION: Record<string, unknown> = {
  id: true,
  name: { firstName: true, lastName: true },
  linkedinLink: { primaryLinkUrl: true },
  jobTitle: true,
  emails: { primaryEmail: true },
  phones: { primaryPhoneNumber: true },
  companyId: true,
  lushaContactId: true,
};

const toLushaPersonRecord = (node: LushaPersonNode): LushaPersonRecord => ({
  id: node.id,
  lushaContactId: node.lushaContactId,
  linkedinLinkUrl: node.linkedinLink?.primaryLinkUrl ?? null,
  firstName: node.name?.firstName ?? null,
  lastName: node.name?.lastName ?? null,
  jobTitle: node.jobTitle,
  primaryEmail: node.emails?.primaryEmail ?? null,
  primaryPhoneNumber: node.phones?.primaryPhoneNumber ?? null,
  companyId: node.companyId,
});

// Loads every Person once per run. Deduplication has to consider people this
// app never created — a human or the LinkedIn (Unipile) app may already hold
// the same profile — and the workspace is small enough (tens to low hundreds)
// to index in memory rather than issue one lookup per Lusha row.
export const fetchLushaPeople = async (
  client: CoreApiClient,
): Promise<LushaPersonRecord[]> => {
  const records: LushaPersonRecord[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await client.query({
      people: {
        __args: { first: PEOPLE_PAGE_SIZE, after },
        edges: { node: LUSHA_PERSON_SELECTION },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    });

    const connection = result.people as unknown as LushaPeopleConnection;

    for (const edge of connection.edges) {
      records.push(toLushaPersonRecord(edge.node));
    }

    hasNextPage = connection.pageInfo.hasNextPage === true;
    after = connection.pageInfo.endCursor ?? undefined;
  }

  return records;
};
