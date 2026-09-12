import { Hono } from 'hono';

import { createApiKeyMiddleware } from 'src/http/api-key.middleware';
import { type AppDependencies } from 'src/http/app-dependencies.type';
import { createAdminRoutes } from 'src/http/routes/admin.routes';
import { createUnipileRoutes } from 'src/http/routes/unipile.routes';
import { META_KEYS } from 'src/store/meta.repository';

export const createApp = (dependencies: AppDependencies) => {
  const { env, store, profileLookup, session, poller, voyager, logger } = dependencies;
  const app = new Hono();

  app.get('/health', (context) => {
    const state = session.getState();
    const body = {
      session: state,
      diedReason: session.getDiedReason(),
      pollerRunning: poller.isRunning(),
      firstSnapshotDone: store.meta.get(META_KEYS.firstSnapshotDone) === 'true',
      lastRefreshAt: store.meta.get(META_KEYS.lastFullRefreshAt),
      lookupsToday: profileLookup.lookupsToday(),
      queueLength: voyager.queueLength(),
      rateLimitedUntil: voyager.rateLimitedUntil()?.toISOString() ?? null,
      relations: store.relations.count(),
      messages: store.messages.count({}),
    };

    return context.json(body, state === 'DEAD' ? 503 : 200);
  });

  app.use('/api/*', createApiKeyMiddleware(env.API_KEY));
  app.use('/admin/*', createApiKeyMiddleware(env.API_KEY));

  app.route('/api/v1', createUnipileRoutes(dependencies));
  app.route('/admin', createAdminRoutes(dependencies));

  app.notFound((context) => context.json({ type: 'errors/not_found', title: 'Route not found' }, 404));

  app.onError((error, context) => {
    logger.error('Unhandled request error', { path: context.req.path, error: error.stack ?? String(error) });

    return context.json({ type: 'errors/internal', title: 'Internal error' }, 500);
  });

  return app;
};
