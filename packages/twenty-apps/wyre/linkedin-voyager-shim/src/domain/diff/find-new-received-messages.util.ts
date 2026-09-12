import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';

export const findNewReceivedMessages = ({
  knownMessageIds,
  incoming,
}: {
  knownMessageIds: ReadonlySet<string>;
  incoming: UnipileListedMessage[];
}): UnipileListedMessage[] =>
  incoming.filter((message) => message.is_sender === 0 && !knownMessageIds.has(message.id));
