import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinLastMessageAt',
  type: FieldType.DATE_TIME,
  label: 'LinkedIn last message at',
  description: 'When the most recent LinkedIn message with this person was sent or received.',
  icon: 'IconClock',
  isNullable: true,
  isUIEditable: false,
});
