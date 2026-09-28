import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LUSHA_CONTACT_ID_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LUSHA_CONTACT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'lushaContactId',
  type: FieldType.TEXT,
  label: 'Lusha contact ID',
  description:
    "The row's tableContactId in the Lusha Workspace table. Primary match key on re-ingestion; the LinkedIn slug is only the fallback.",
  icon: 'IconDatabase',
  isNullable: true,
  isUIEditable: false,
});
