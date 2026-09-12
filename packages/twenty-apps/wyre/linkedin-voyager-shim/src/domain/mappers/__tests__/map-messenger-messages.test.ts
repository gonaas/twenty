import { mapEmbeddedMessages, mapMessengerMessages } from 'src/domain/mappers/map-messenger-messages.util';
import {
  type MessengerConversationsResponse,
  type MessengerMessagesResponse,
} from 'src/linkedin/types/messenger.type';
import { loadFixture } from 'src/test-support/load-fixture.util';

const OWN_PROVIDER_ID = 'ACoAAAAAAAME';

describe('mapMessengerMessages', () => {
  it('maps thread messages with is_sender derived from the owner id and empty bodies as null', () => {
    const messages = mapMessengerMessages({
      response: loadFixture<MessengerMessagesResponse>('messenger-messages'),
      chatId: '2-chat-one==',
      ownProviderId: OWN_PROVIDER_ID,
    });

    expect(messages).toEqual([
      {
        id: '2-msg-one',
        chat_id: '2-chat-one==',
        text: 'Hello Alice',
        timestamp: '2026-09-11T04:13:20.000Z',
        is_sender: 1,
        sender_id: 'ACoAAAAAAAME',
        sender_attendee_id: 'ACoAAAAAAAME',
      },
      {
        id: '2-msg-two',
        chat_id: '2-chat-one==',
        text: "Hi! Sure, let's talk.",
        timestamp: '2026-09-11T12:31:16.484Z',
        is_sender: 0,
        sender_id: 'ACoAAAAAAA1',
        sender_attendee_id: 'ACoAAAAAAA1',
      },
      {
        id: '2-msg-empty',
        chat_id: '2-chat-one==',
        text: null,
        timestamp: '2026-09-11T12:31:40.000Z',
        is_sender: 0,
        sender_id: 'ACoAAAAAAA1',
        sender_attendee_id: 'ACoAAAAAAA1',
      },
    ]);
  });
});

describe('mapEmbeddedMessages', () => {
  it('extracts the latest message embedded in each conversation', () => {
    const messages = mapEmbeddedMessages({
      response: loadFixture<MessengerConversationsResponse>('messenger-conversations'),
      ownProviderId: OWN_PROVIDER_ID,
    });

    expect(messages).toEqual([
      expect.objectContaining({ id: '2-msg-two', chat_id: '2-chat-one==', is_sender: 0, text: "Hi! Sure, let's talk." }),
    ]);
  });
});
