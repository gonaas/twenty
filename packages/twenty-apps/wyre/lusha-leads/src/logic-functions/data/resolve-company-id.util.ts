import { type CoreApiClient } from 'twenty-client-sdk/core';
import { isDefined } from 'twenty-sdk/utils';

const findCompanyIdByExactName = async (
  client: CoreApiClient,
  name: string,
): Promise<string | undefined> => {
  const result = await client.query({
    companies: {
      __args: { filter: { name: { eq: name } }, first: 1 },
      edges: { node: { id: true } },
    },
  });

  return result.companies?.edges?.[0]?.node?.id;
};

const createCompanyByName = async (
  client: CoreApiClient,
  name: string,
): Promise<string> => {
  const result = await client.mutation({
    createCompany: { __args: { data: { name } }, id: true },
  });
  const companyId = result.createCompany?.id;

  if (!isDefined(companyId)) {
    throw new Error('createCompany did not return an id');
  }

  return companyId;
};

// One cache per run, keyed by the raw Lusha name: the table repeats the same
// employer across rows, and a miss is a wasted round trip either way.
export type CompanyIdCache = Map<string, string | undefined>;

export const resolveCompanyId = async ({
  client,
  companyName,
  shouldCreateCompanies,
  cache,
}: {
  client: CoreApiClient;
  companyName: string;
  shouldCreateCompanies: boolean;
  cache: CompanyIdCache;
}): Promise<string | undefined> => {
  const name = companyName.trim();
  const cached = cache.get(name);

  if (cache.has(name)) {
    return cached;
  }

  const existingId = await findCompanyIdByExactName(client, name);

  if (isDefined(existingId)) {
    cache.set(name, existingId);

    return existingId;
  }

  if (!shouldCreateCompanies) {
    cache.set(name, undefined);

    return undefined;
  }

  const createdId = await createCompanyByName(client, name);

  cache.set(name, createdId);

  return createdId;
};
