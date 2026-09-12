import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { UnipileRequestError } from 'src/logic-functions/errors/unipile-request-error';

export const unipileRequest = async <TResponse>({
  config,
  path,
  query,
}: {
  config: UnipileConfig;
  path: string;
  query?: Record<string, string | number | undefined>;
}): Promise<TResponse> => {
  const url = new URL(path, config.dsn);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-API-KEY': config.apiKey },
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new UnipileRequestError(
      `Unipile request to ${path} failed with status ${response.status}`,
      response.status,
      body,
    );
  }

  return body as TResponse;
};
