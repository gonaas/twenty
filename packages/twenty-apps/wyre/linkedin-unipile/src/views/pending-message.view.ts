import {
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
  defineView,
} from 'twenty-sdk/define';

import {
  LINKEDIN_CONNECTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  LINKEDIN_CONNECTION_FIELD_UNIVERSAL_IDENTIFIER,
  LINKEDIN_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
  PENDING_MESSAGE_VIEW_FILTER_UNIVERSAL_IDENTIFIERS,
  PENDING_MESSAGE_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  PENDING_MESSAGE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const PERSON_FIELDS = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.fields;

// Accepted invitations nobody has written to yet. Both filters use fields this
// app declares: linkedinStatus is a hand-created workspace field with no stable
// universal identifier, so it cannot be referenced from a manifest.
export default defineView({
  universalIdentifier: PENDING_MESSAGE_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Pending message',
  icon: 'IconCheckbox',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: ViewType.TABLE,
  position: 1,
  fields: [
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.name,
      fieldMetadataUniversalIdentifier: PERSON_FIELDS.name.universalIdentifier,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.company,
      fieldMetadataUniversalIdentifier:
        PERSON_FIELDS.company.universalIdentifier,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.jobTitle,
      fieldMetadataUniversalIdentifier:
        PERSON_FIELDS.jobTitle.universalIdentifier,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.linkedinConnectedAt,
      fieldMetadataUniversalIdentifier:
        LINKEDIN_CONNECTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FIELD_UNIVERSAL_IDENTIFIERS.linkedinLink,
      fieldMetadataUniversalIdentifier:
        PERSON_FIELDS.linkedinLink.universalIdentifier,
      position: 4,
      isVisible: true,
      size: 200,
    },
  ],
  filters: [
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FILTER_UNIVERSAL_IDENTIFIERS.connection,
      fieldMetadataUniversalIdentifier:
        LINKEDIN_CONNECTION_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['CONNECTED'],
    },
    {
      universalIdentifier:
        PENDING_MESSAGE_VIEW_FILTER_UNIVERSAL_IDENTIFIERS.lastMessageAt,
      fieldMetadataUniversalIdentifier:
        LINKEDIN_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_EMPTY,
      value: '',
    },
  ],
  sorts: [
    {
      universalIdentifier: PENDING_MESSAGE_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        LINKEDIN_CONNECTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.DESC,
    },
  ],
});
