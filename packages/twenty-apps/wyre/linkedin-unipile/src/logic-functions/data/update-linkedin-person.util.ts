import { type CoreApiClient } from 'twenty-client-sdk/core';

export const updateLinkedinPerson = async ({
  client,
  personId,
  data,
}: {
  client: CoreApiClient;
  personId: string;
  data: Record<string, unknown>;
}): Promise<void> => {
  await client.mutation({
    updatePerson: { __args: { id: personId, data }, id: true },
  });
};
