import { Hono } from 'hono';

import { InvalidCursorError, decodeCursor, nextCursor } from 'src/domain/cursor.util';
import { type AppDependencies } from 'src/http/app-dependencies.type';

const RELATIONS_MAX_LIMIT = 1000;
const SENT_INVITATIONS_MAX_LIMIT = 100;
const MESSAGES_MAX_LIMIT = 250;

const clampLimit = (raw: string | undefined, maximum: number): number => {
  const parsed = Number.parseInt(raw ?? '', 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return maximum;
  }

  return Math.min(parsed, maximum);
};

const readOffset = (raw: string | undefined): number | null => {
  try {
    return decodeCursor(raw);
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      return null;
    }

    throw error;
  }
};

export const createUnipileRoutes = ({ env, store, profileLookup, session }: AppDependencies) => {
  const routes = new Hono();

  routes.use('*', async (context, next) => {
    if (context.req.query('account_id') !== env.ACCOUNT_ID) {
      return context.json({ type: 'errors/not_found', title: 'Unknown account_id' }, 404);
    }

    await next();
  });

  routes.get('/users/relations', (context) => {
    const limit = clampLimit(context.req.query('limit'), RELATIONS_MAX_LIMIT);
    const offset = readOffset(context.req.query('cursor'));

    if (offset === null) {
      return context.json({ type: 'errors/invalid_parameters', title: 'Invalid cursor' }, 400);
    }

    const total = store.relations.count();

    return context.json({
      object: 'RelationList',
      items: store.relations.page({ limit, offset }),
      cursor: nextCursor({ offset, pageSize: limit, total }),
    });
  });

  routes.get('/users/invite/sent', (context) => {
    const limit = clampLimit(context.req.query('limit'), SENT_INVITATIONS_MAX_LIMIT);
    const offset = readOffset(context.req.query('cursor'));

    if (offset === null) {
      return context.json({ type: 'errors/invalid_parameters', title: 'Invalid cursor' }, 400);
    }

    const total = store.sentInvitations.count();

    return context.json({
      object: 'InvitationList',
      items: store.sentInvitations.page({ limit, offset }),
      cursor: nextCursor({ offset, pageSize: limit, total }),
    });
  });

  routes.get('/messages', (context) => {
    const limit = clampLimit(context.req.query('limit'), MESSAGES_MAX_LIMIT);
    const offset = readOffset(context.req.query('cursor'));
    const after = context.req.query('after');

    if (offset === null) {
      return context.json({ type: 'errors/invalid_parameters', title: 'Invalid cursor' }, 400);
    }

    if (after !== undefined && Number.isNaN(Date.parse(after))) {
      return context.json({ type: 'errors/invalid_parameters', title: 'Invalid after timestamp' }, 400);
    }

    const total = store.messages.count({ after });

    return context.json({
      object: 'MessageList',
      items: store.messages.page({ after, limit, offset }),
      cursor: nextCursor({ offset, pageSize: limit, total }),
    });
  });

  routes.get('/chats/:chatId', (context) => {
    const chat = store.chats.find(context.req.param('chatId'));

    if (chat === null) {
      return context.json({ type: 'errors/not_found', title: 'Chat not found' }, 404);
    }

    return context.json({
      object: 'Chat',
      id: chat.id,
      attendee_provider_id: chat.attendee_provider_id,
      name: chat.name,
    });
  });

  routes.get('/users/:identifier', async (context) => {
    if (session.getState() !== 'ALIVE') {
      return context.json({ type: 'errors/unavailable', title: 'LinkedIn session is not alive' }, 503);
    }

    const outcome = await profileLookup.lookup(context.req.param('identifier'));

    switch (outcome.kind) {
      case 'found':
        return context.json({ object: 'UserProfile', ...outcome.profile });
      case 'not_found':
        return context.json({ type: 'errors/invalid_parameters', title: 'Unknown identifier' }, 422);
      case 'budget_exhausted':
        return context.json({ type: 'errors/rate_limited', title: 'Daily profile lookup budget exhausted' }, 429);
      case 'rate_limited':
        return context.json(
          { type: 'errors/rate_limited', title: 'LinkedIn rate limited the session', retry_at: outcome.retryAt.toISOString() },
          429,
        );
      case 'session_dead':
        return context.json({ type: 'errors/unavailable', title: 'LinkedIn session is not alive' }, 503);
      case 'upstream_error':
        return context.json({ type: 'errors/upstream', title: 'LinkedIn request failed', status: outcome.status }, 502);
    }
  });

  return routes;
};
