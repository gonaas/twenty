import { findNewReceivedMessages } from 'src/domain/diff/find-new-received-messages.util';
import { findNewRelations } from 'src/domain/diff/find-new-relations.util';
import { shouldEmitWebhooks } from 'src/domain/diff/should-emit-webhooks.util';
import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';
import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';

const buildRelation = (memberId: string): UnipileRelation => ({
  member_id: memberId,
  public_identifier: null,
  public_profile_url: null,
  first_name: null,
  last_name: null,
  headline: null,
  created_at: null,
});

const buildMessage = (id: string, isSender: 0 | 1): UnipileListedMessage => ({
  id,
  chat_id: 'chat',
  text: null,
  timestamp: '2025-09-12T00:00:00.000Z',
  is_sender: isSender,
  sender_id: null,
  sender_attendee_id: null,
});

describe('findNewRelations', () => {
  it('returns only unknown member ids', () => {
    expect(
      findNewRelations({
        knownMemberIds: new Set(['a']),
        incoming: [buildRelation('a'), buildRelation('b')],
      }).map((relation) => relation.member_id),
    ).toEqual(['b']);
  });
});

describe('findNewReceivedMessages', () => {
  it('ignores own messages and already known ids', () => {
    expect(
      findNewReceivedMessages({
        knownMessageIds: new Set(['m1']),
        incoming: [buildMessage('m1', 0), buildMessage('m2', 1), buildMessage('m3', 0)],
      }).map((message) => message.id),
    ).toEqual(['m3']);
  });
});

describe('shouldEmitWebhooks', () => {
  it('stays silent on the first snapshot and without webhook config', () => {
    expect(shouldEmitWebhooks({ firstSnapshotDone: false, webhooksConfigured: true })).toBe(false);
    expect(shouldEmitWebhooks({ firstSnapshotDone: true, webhooksConfigured: false })).toBe(false);
    expect(shouldEmitWebhooks({ firstSnapshotDone: true, webhooksConfigured: true })).toBe(true);
  });
});
