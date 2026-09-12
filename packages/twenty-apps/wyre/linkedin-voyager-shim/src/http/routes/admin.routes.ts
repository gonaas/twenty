import { Hono } from 'hono';
import { z } from 'zod';

import { type AppDependencies } from 'src/http/app-dependencies.type';

const rotateSessionSchema = z.object({
  li_at: z.string().trim().min(10),
  jsessionid: z.string().trim().min(1).optional(),
});

export const createAdminRoutes = ({ session, poller, logger }: AppDependencies) => {
  const routes = new Hono();

  routes.post('/session', async (context) => {
    const parsed = rotateSessionSchema.safeParse(await context.req.json().catch(() => null));

    if (!parsed.success) {
      return context.json({ type: 'errors/invalid_parameters', title: 'Expected { li_at, jsessionid? }' }, 400);
    }

    logger.info('Rotating LinkedIn session cookie');

    const alive = await session.rotate({
      liAt: parsed.data.li_at,
      jsessionid: parsed.data.jsessionid ?? null,
    });

    if (alive && !poller.isRunning()) {
      poller.start();
    }

    return context.json({ session: session.getState(), died_reason: session.getDiedReason() }, alive ? 200 : 409);
  });

  routes.post('/sync', async (context) => {
    const summary = await poller.triggerNow();

    return context.json({ refreshed: summary !== null, summary }, summary === null ? 409 : 200);
  });

  return routes;
};
