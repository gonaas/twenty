import { type CoreApiClient } from 'twenty-client-sdk/core';

import { LINKEDIN_CONVERSATION_NOTE_TITLE } from 'src/constants/linkedin-conversation-note-title';

type NoteTargetNode = {
  note: { id: string; title: string; createdAt: string } | null;
};

// The cron and the webhook can both create the note for the same person before
// either sees the other's write; picking the oldest match makes every later
// write converge on a single note instead of alternating between duplicates.
export const findLinkedinConversationNoteId = async (
  client: CoreApiClient,
  personId: string,
): Promise<string | null> => {
  const result = await client.query({
    noteTargets: {
      __args: { filter: { targetPersonId: { eq: personId } } },
      edges: { node: { note: { id: true, title: true, createdAt: true } } },
    },
  });

  const nodes = (result.noteTargets?.edges ?? []) as Array<{
    node: NoteTargetNode;
  }>;

  const matches = nodes
    .map(({ node }) => node.note)
    .filter(
      (note): note is NonNullable<NoteTargetNode['note']> =>
        note !== null && note.title === LINKEDIN_CONVERSATION_NOTE_TITLE,
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  return matches[0]?.id ?? null;
};
