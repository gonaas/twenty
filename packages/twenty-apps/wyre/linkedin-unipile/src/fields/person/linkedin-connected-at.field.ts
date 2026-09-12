import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_CONNECTED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_CONNECTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinConnectedAt',
  type: FieldType.DATE_TIME,
  label: 'LinkedIn connected at',
  description: 'When the LinkedIn relation was created, per Unipile.',
  icon: 'IconClock',
  isNullable: true,
  isUIEditable: false,
});
