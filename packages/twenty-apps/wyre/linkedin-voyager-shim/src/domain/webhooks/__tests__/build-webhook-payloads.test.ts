import {
  buildAccountStatusPayload,
  buildMessageReceivedPayload,
  buildNewRelationPayload,
} from 'src/domain/webhooks/build-webhook-payloads.util';

describe('webhook payload builders', () => {
  it('builds message_received with the sender resolved from the attendees', () => {
    const payload = buildMessageReceivedPayload({
      accountId: 'acc',
      ownProviderId: 'ME',
      message: {
        id: 'm1',
        chat_id: 'c1',
        text: 'hello',
        timestamp: '2025-09-12T00:00:00.000Z',
        is_sender: 0,
        sender_id: 'THEM',
        sender_attendee_id: 'THEM',
      },
      attendees: [{ providerId: 'THEM', name: 'Them Person', publicIdentifier: 'them', profileUrl: null }],
    });

    expect(payload).toEqual({
      event: 'message_received',
      account_id: 'acc',
      account_type: 'LINKEDIN',
      chat_id: 'c1',
      message_id: 'm1',
      message: 'hello',
      timestamp: '2025-09-12T00:00:00.000Z',
      sender: {
        attendee_id: 'THEM',
        attendee_name: 'Them Person',
        attendee_provider_id: 'THEM',
        attendee_profile_url: 'https://www.linkedin.com/in/them/',
      },
      attendees: [
        {
          attendee_id: 'THEM',
          attendee_name: 'Them Person',
          attendee_provider_id: 'THEM',
          attendee_profile_url: 'https://www.linkedin.com/in/them/',
        },
      ],
      account_info: { user_id: 'ME' },
    });
  });

  it('builds new_relation and the event-less account status', () => {
    expect(
      buildNewRelationPayload({
        accountId: 'acc',
        relation: {
          member_id: 'X',
          public_identifier: 'x-y',
          public_profile_url: null,
          first_name: 'X',
          last_name: 'Y',
          headline: null,
          created_at: null,
        },
      }),
    ).toEqual({
      event: 'new_relation',
      account_id: 'acc',
      user_full_name: 'X Y',
      user_provider_id: 'X',
      user_public_identifier: 'x-y',
    });

    const status = buildAccountStatusPayload({ accountId: 'acc', message: 'CREDENTIALS' });

    expect(status).toEqual({ account_id: 'acc', message: 'CREDENTIALS' });
    expect('event' in status).toBe(false);
  });
});
