import { isNonEmptyString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { isDefined } from 'twenty-sdk/utils';

import { INGEST_LUSHA_LEADS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { fetchLushaPeople } from 'src/logic-functions/data/fetch-lusha-people.util';
import { fetchLushaRows } from 'src/logic-functions/data/fetch-lusha-rows.util';
import {
  type CompanyIdCache,
  resolveCompanyId,
} from 'src/logic-functions/data/resolve-company-id.util';
import {
  createLushaPerson,
  updateLushaPerson,
} from 'src/logic-functions/data/write-lusha-person.util';
import { buildPersonCreateInput } from 'src/logic-functions/domain/build-person-create-input';
import {
  applyPersonUpdateInput,
  buildPersonUpdateInput,
} from 'src/logic-functions/domain/build-person-update-input';
import { mapLushaRowToPerson } from 'src/logic-functions/domain/map-lusha-row-to-person';
import {
  addPersonToIndex,
  buildExistingPersonIndex,
  resolveExistingPerson,
} from 'src/logic-functions/domain/resolve-existing-person';
import { getLushaConfig } from 'src/logic-functions/lusha-api/get-lusha-config.util';
import { type LushaTableEntity } from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';
import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

type IngestLushaLeadsSummary = {
  rowsRead: number;
  created: number;
  updated: number;
  unchanged: number;
  skippedWithoutLinkedinUrl: number;
  failed: number;
  creditsCharged: number;
};

const describeLushaRow = (row: LushaTableEntity): string =>
  row.tableContactId ?? row.id ?? '(row with no id)';

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const ingestLushaLeadsHandler =
  async (): Promise<IngestLushaLeadsSummary> => {
    const config = getLushaConfig();
    const client = new CoreApiClient();

    const { rows, creditsCharged } = await fetchLushaRows(config);
    const index = buildExistingPersonIndex(await fetchLushaPeople(client));
    const companyIdCache: CompanyIdCache = new Map();

    const resolveCompanyIdForRow = async (
      companyName: string | null,
    ): Promise<string | undefined> =>
      isNonEmptyString(companyName)
        ? resolveCompanyId({
            client,
            companyName,
            shouldCreateCompanies: config.shouldCreateCompanies,
            cache: companyIdCache,
          })
        : undefined;

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let skippedWithoutLinkedinUrl = 0;
    let failed = 0;

    for (const row of rows) {
      // Every row on the page is already billed by the time the first write
      // runs, so one record Twenty rejects is counted and stepped over rather
      // than allowed to abort the rest of the run and lose the summary.
      try {
        const mapping = mapLushaRowToPerson(row);

        if (mapping.status === 'skipped') {
          skippedWithoutLinkedinUrl += 1;
          continue;
        }

        const { person } = mapping;
        const match = resolveExistingPerson({
          index,
          lushaContactId: person.lushaContactId,
          normalizedLinkedinIdentifier: person.normalizedLinkedinIdentifier,
        });

        if (isDefined(match)) {
          // Resolving a company costs a query and, with LUSHA_CREATE_COMPANIES
          // on, creates one, so it only runs when the update would actually
          // attach it — a Person already linked keeps the company it has.
          const companyId = isNonEmptyString(match.person.companyId)
            ? undefined
            : await resolveCompanyIdForRow(person.companyName);
          const data = buildPersonUpdateInput({
            existing: match.person,
            person,
            companyId,
          });

          if (Object.keys(data).length === 0) {
            unchanged += 1;
            continue;
          }

          await updateLushaPerson({ client, personId: match.person.id, data });

          addPersonToIndex(
            index,
            applyPersonUpdateInput({
              existing: match.person,
              person,
              input: data,
            }),
          );
          updated += 1;
          continue;
        }

        const companyId = await resolveCompanyIdForRow(person.companyName);
        const personId = await createLushaPerson({
          client,
          data: buildPersonCreateInput({ person, companyId }),
        });
        const createdRecord: LushaPersonRecord = {
          id: personId,
          lushaContactId: person.lushaContactId,
          linkedinLinkUrl: person.linkedinUrl,
          firstName: person.firstName,
          lastName: person.lastName,
          jobTitle: person.jobTitle,
          primaryEmail: person.primaryEmail,
          primaryPhoneNumber: person.primaryPhoneNumber,
          companyId: companyId ?? null,
        };

        addPersonToIndex(index, createdRecord);
        created += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `[lusha-leads] Row ${describeLushaRow(row)} failed: ${describeError(error)}`,
        );
      }
    }

    return {
      rowsRead: rows.length,
      created,
      updated,
      unchanged,
      skippedWithoutLinkedinUrl,
      failed,
      creditsCharged,
    };
  };

export default defineLogicFunction({
  universalIdentifier: INGEST_LUSHA_LEADS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'ingest-lusha-leads',
  description:
    'Reads the Lusha Workspace contacts table and creates or fills in the matching People with their LinkedIn URL.',
  timeoutSeconds: 600,
  handler: ingestLushaLeadsHandler,
  // Daily is enough: the table is small and curated by hand, and every run
  // spends Lusha credits per row it reads.
  cronTriggerSettings: {
    pattern: '0 6 * * *',
  },
});
