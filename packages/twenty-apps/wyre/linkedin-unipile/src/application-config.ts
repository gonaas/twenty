import { defineApplication, FieldType } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN,
  LINKEDIN_PROFILE_LOOKUPS_PER_RUN_ENV_VAR_NAME,
  UNIPILE_ACCOUNT_ID_ENV_VAR_NAME,
  UNIPILE_API_KEY_ENV_VAR_NAME,
  UNIPILE_DSN_ENV_VAR_NAME,
  UNIPILE_WEBHOOK_SECRET_ENV_VAR_NAME,
} from 'src/constants/server-variables';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'LinkedIn (Unipile)',
  description:
    'Syncs each Person LinkedIn relationship (connection, invitations, messages) from Unipile and advances Linkedin Status automatically.',
  author: 'Wyre',
  category: 'Sales',
  serverVariables: {
    [UNIPILE_DSN_ENV_VAR_NAME]: {
      description: 'Base URL of the Unipile API, e.g. https://api1.unipile.com:12345',
      isSecret: false,
      isRequired: true,
    },
    [UNIPILE_API_KEY_ENV_VAR_NAME]: {
      description: 'Unipile API key, sent as the X-API-KEY header.',
      isSecret: true,
      isRequired: true,
    },
    [UNIPILE_ACCOUNT_ID_ENV_VAR_NAME]: {
      description: 'The Unipile account id for the connected LinkedIn session.',
      isSecret: false,
      isRequired: true,
    },
    [UNIPILE_WEBHOOK_SECRET_ENV_VAR_NAME]: {
      description:
        'Shared secret Unipile sends back in the Unipile-Auth header on every webhook delivery.',
      isSecret: true,
      isRequired: true,
    },
    [LINKEDIN_PROFILE_LOOKUPS_PER_RUN_ENV_VAR_NAME]: {
      description: `How many unresolved profile lookups (GET /users/{identifier}) a single reconcile run may perform. Defaults to ${DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN} when unset.`,
      isSecret: false,
      type: FieldType.NUMBER,
    },
  },
});
