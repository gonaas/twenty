import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { LINKEDIN_CONNECTION_OPTIONS } from 'src/constants/linkedin-connection-options';
import {
  LINKEDIN_CONNECTION_FIELD_UNIVERSAL_IDENTIFIER,
  LINKEDIN_CONNECTION_OPTION_UNIVERSAL_IDENTIFIERS,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options';

export default defineField({
  universalIdentifier: LINKEDIN_CONNECTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'linkedinConnection',
  label: 'LinkedIn connection',
  description:
    'Factual LinkedIn relationship state from Unipile. Can regress, for example on a withdrawn invitation.',
  icon: 'IconBrandLinkedin',
  isNullable: true,
  options: buildSelectOptions({
    meta: LINKEDIN_CONNECTION_OPTIONS,
    ids: LINKEDIN_CONNECTION_OPTION_UNIVERSAL_IDENTIFIERS,
  }),
  isUIEditable: false,
});
