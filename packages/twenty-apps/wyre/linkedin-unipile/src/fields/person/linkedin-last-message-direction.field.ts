import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MESSAGE_DIRECTION_OPTIONS } from 'src/constants/message-direction-options';
import {
  LINKEDIN_LAST_MESSAGE_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
  MESSAGE_DIRECTION_OPTION_UNIVERSAL_IDENTIFIERS,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options';

export default defineField({
  universalIdentifier: LINKEDIN_LAST_MESSAGE_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'linkedinLastMessageDirection',
  label: 'LinkedIn last message direction',
  description: 'Whether the most recent LinkedIn message was sent or received.',
  icon: 'IconMessage',
  isNullable: true,
  options: buildSelectOptions({
    meta: MESSAGE_DIRECTION_OPTIONS,
    ids: MESSAGE_DIRECTION_OPTION_UNIVERSAL_IDENTIFIERS,
  }),
  isUIEditable: false,
});
