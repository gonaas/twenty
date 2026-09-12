import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_SYNCED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_SYNCED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinSyncedAt',
  type: FieldType.DATE_TIME,
  label: 'LinkedIn synced at',
  description: 'The last time the LinkedIn sync touched this person.',
  icon: 'IconClock',
  isNullable: true,
  isUIEditable: false,
});
