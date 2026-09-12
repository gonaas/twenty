import { type CoreApiClient } from 'twenty-client-sdk/core';

export const findPersonIdByLinkedinMemberId = async (
  client: CoreApiClient,
  memberId: string,
): Promise<string | null> => {
  const result = await client.query({
    people: {
      __args: { filter: { linkedinMemberId: { eq: memberId } }, first: 1 },
      edges: { node: { id: true } },
    },
  });

  const node = result.people?.edges?.[0]?.node as { id: string } | undefined;

  return node?.id ?? null;
};
