import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_INVITATION_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_INVITATION_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinInvitationSentAt',
  type: FieldType.DATE_TIME,
  label: 'LinkedIn invitation sent at',
  description: 'When a LinkedIn connection invitation was sent, per Unipile.',
  icon: 'IconClock',
  isNullable: true,
  isUIEditable: false,
});
