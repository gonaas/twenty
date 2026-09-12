import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_CHAT_ID_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_CHAT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinChatId',
  type: FieldType.TEXT,
  label: 'LinkedIn chat ID',
  description:
    "The person's Unipile 1:1 chat id, so message sync does not have to re-list chats every run.",
  icon: 'IconBrandLinkedin',
  isNullable: true,
  isUIEditable: false,
});
