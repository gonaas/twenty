import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_MEMBER_ID_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: LINKEDIN_MEMBER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  name: 'linkedinMemberId',
  type: FieldType.TEXT,
  label: 'LinkedIn member ID',
  description:
    "The person's Unipile provider id on LinkedIn. Stable match key; vanity URLs change.",
  icon: 'IconBrandLinkedin',
  isNullable: true,
  isUIEditable: false,
});
