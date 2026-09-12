import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_MESSAGES_RECEIVED_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_MESSAGES_RECEIVED_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinMessagesReceived',
  type: FieldType.NUMBER,
  label: 'LinkedIn messages received',
  description: 'How many LinkedIn messages this person has sent to you, per Unipile.',
  icon: 'IconMessage',
  isNullable: true,
  isUIEditable: false,
});
