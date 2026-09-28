import { defineApplication, FieldType } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  DEFAULT_LUSHA_ROWS_PER_RUN,
  LUSHA_API_KEY_ENV_VAR_NAME,
  LUSHA_CREATE_COMPANIES_ENV_VAR_NAME,
  LUSHA_OWNER_EMAIL_ENV_VAR_NAME,
  LUSHA_ROWS_PER_RUN_ENV_VAR_NAME,
  LUSHA_TABLE_ID_ENV_VAR_NAME,
} from 'src/constants/server-variables';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Lusha Leads',
  description:
    'Ingests a Lusha Workspace contacts table into People with their LinkedIn URL set, so the LinkedIn (Unipile) app can take the relationship over from there.',
  author: 'Wyre',
  category: 'Sales',
  serverVariables: {
    [LUSHA_API_KEY_ENV_VAR_NAME]: {
      description: 'Lusha API key, sent as the api_key header.',
      isSecret: true,
      isRequired: true,
    },
    [LUSHA_TABLE_ID_ENV_VAR_NAME]: {
      description:
        'Id of the Lusha Workspace contacts table to ingest, from the table URL in the Lusha app.',
      isSecret: false,
      isRequired: true,
    },
    [LUSHA_ROWS_PER_RUN_ENV_VAR_NAME]: {
      description: `Hard cap on how many table rows a single run reads. Reading rows charges Lusha credits, so this is the spend ceiling per run. Defaults to ${DEFAULT_LUSHA_ROWS_PER_RUN} when unset.`,
      isSecret: false,
      isRequired: false,
      type: FieldType.NUMBER,
    },
    [LUSHA_CREATE_COMPANIES_ENV_VAR_NAME]: {
      description:
        'When true, a company_name with no exact Company match is created. Off by default so unmatched names never fragment the Company list.',
      isSecret: false,
      isRequired: false,
      type: FieldType.BOOLEAN,
    },
    [LUSHA_OWNER_EMAIL_ENV_VAR_NAME]: {
      description:
        'Lusha user the read is attributed to, sent as the email query parameter. Lusha scopes table ownership and visibility by it; set it to the account that owns the table.',
      isSecret: false,
      isRequired: false,
    },
  },
});
