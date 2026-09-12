import { timingSafeEqual } from 'node:crypto';

import { type MiddlewareHandler } from 'hono';

export const apiKeysMatch = (provided: string | undefined, expected: string): boolean => {
  if (provided === undefined) {
    return false;
  }

  const providedBuffer = Buffer.from(provided, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
};

export const createApiKeyMiddleware = (expectedApiKey: string): MiddlewareHandler => async (context, next) => {
  if (!apiKeysMatch(context.req.header('x-api-key'), expectedApiKey)) {
    return context.json({ type: 'errors/unauthorized', title: 'Invalid API key' }, 401);
  }

  await next();
};
