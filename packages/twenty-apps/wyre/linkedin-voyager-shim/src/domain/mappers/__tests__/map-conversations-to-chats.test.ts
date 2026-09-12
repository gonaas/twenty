import { mapConversationsToChats } from 'src/domain/mappers/map-conversations-to-chats.util';
import { type MessengerConversationsResponse } from 'src/linkedin/types/messenger.type';
import { loadFixture } from 'src/test-support/load-fixture.util';

describe('mapConversationsToChats', () => {
  it('maps the messenger conversation list, dropping the owner and organizations', () => {
    const chats = mapConversationsToChats({
      response: loadFixture<MessengerConversationsResponse>('messenger-conversations'),
      ownProviderId: 'ACoAAAAAAAME',
    });

    expect(chats).toEqual([
      {
        id: '2-chat-one==',
        name: null,
        isGroup: false,
        lastActivityAt: '2026-09-11T12:31:16.484Z',
        attendees: [
          {
            providerId: 'ACoAAAAAAA1',
            name: 'Alice Example',
            publicIdentifier: null,
            profileUrl: 'https://www.linkedin.com/in/ACoAAAAAAA1',
          },
        ],
      },
      {
        id: '2-chat-sponsored==',
        name: null,
        isGroup: false,
        lastActivityAt: '2026-09-10T00:26:40.000Z',
        attendees: [],
      },
      {
        id: '2-chat-group==',
        name: 'Founders',
        isGroup: true,
        lastActivityAt: '2026-09-08T20:40:00.000Z',
        attendees: [
          { providerId: 'ACoAAAAAAA1', name: 'Alice Example', publicIdentifier: null, profileUrl: 'https://www.linkedin.com/in/ACoAAAAAAA1' },
          { providerId: 'ACoAAAAAAA2', name: 'Bob Hidden', publicIdentifier: null, profileUrl: 'https://www.linkedin.com/in/ACoAAAAAAA2' },
        ],
      },
    ]);
  });
});
