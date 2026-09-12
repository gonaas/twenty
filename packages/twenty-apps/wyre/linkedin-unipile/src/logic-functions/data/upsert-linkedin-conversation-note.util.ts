import { isNonEmptyString } from '@sniptt/guards';
import { type CoreApiClient } from 'twenty-client-sdk/core';

import { LINKEDIN_CONVERSATION_NOTE_TITLE } from 'src/constants/linkedin-conversation-note-title';
import { findLinkedinConversationNoteId } from 'src/logic-functions/data/find-linkedin-conversation-note-id.util';

export const upsertLinkedinConversationNote = async ({
  client,
  personId,
  markdown,
}: {
  client: CoreApiClient;
  personId: string;
  markdown: string;
}): Promise<void> => {
  const existingNoteId = await findLinkedinConversationNoteId(client, personId);

  if (existingNoteId !== null) {
    await client.mutation({
      updateNote: {
        __args: {
          id: existingNoteId,
          data: { bodyV2: { markdown, blocknote: null } },
        },
        id: true,
      },
    });

    return;
  }

  const created = await client.mutation({
    createNote: {
      __args: {
        data: {
          title: LINKEDIN_CONVERSATION_NOTE_TITLE,
          bodyV2: { markdown, blocknote: null },
        },
      },
      id: true,
    },
  });

  const createdNoteId = created.createNote?.id;

  if (!isNonEmptyString(createdNoteId)) {
    throw new Error(
      `createNote returned no id for the LinkedIn conversation note of person ${personId}`,
    );
  }

  await client.mutation({
    createNoteTarget: {
      __args: {
        data: { noteId: createdNoteId, targetPersonId: personId },
      },
      id: true,
    },
  });
};
