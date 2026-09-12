import { buildConversationUrn, extractScopedUrnTail } from 'src/domain/messenger-urn.util';

describe('messenger urns', () => {
  it('extracts the thread and message ids scoped to the owner', () => {
    expect(extractScopedUrnTail('urn:li:msg_conversation:(urn:li:fsd_profile:ACoAAME,2-abc==)')).toBe('2-abc==');
    expect(extractScopedUrnTail('urn:li:msg_message:(urn:li:fsd_profile:ACoAAME,2-msg)')).toBe('2-msg');
    expect(extractScopedUrnTail('urn:li:fsd_profile:ACoAAME')).toBeNull();
  });

  it('rebuilds the conversation urn from the owner and the thread id', () => {
    expect(buildConversationUrn({ ownProviderId: 'ACoAAME', chatId: '2-abc==' })).toBe(
      'urn:li:msg_conversation:(urn:li:fsd_profile:ACoAAME,2-abc==)',
    );
  });
});
