import { type CoreApiClient } from 'twenty-client-sdk/core';
import { isDefined } from 'twenty-sdk/utils';

export const createLushaPerson = async ({
  client,
  data,
}: {
  client: CoreApiClient;
  data: Record<string, unknown>;
}): Promise<string> => {
  const result = await client.mutation({
    createPerson: { __args: { data }, id: true },
  });
  const personId = result.createPerson?.id;

  if (!isDefined(personId)) {
    throw new Error('createPerson did not return an id');
  }

  return personId;
};

export const updateLushaPerson = async ({
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
