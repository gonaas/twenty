import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(8080),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    API_KEY: z.string().trim().min(16),
    ACCOUNT_ID: z.string().trim().min(1),
    DATA_DIR: z.string().trim().min(1).default('./data'),

    WEBHOOK_URL: optionalTrimmedString.pipe(z.url().optional()),
    WEBHOOK_SECRET: optionalTrimmedString,

    LINKEDIN_LI_AT: optionalTrimmedString,
    LINKEDIN_JSESSIONID: optionalTrimmedString,

    PROXY_SERVER: optionalTrimmedString,
    PROXY_USERNAME: optionalTrimmedString,
    PROXY_PASSWORD: optionalTrimmedString,

    BROWSER_LOCALE: z.string().trim().default('es-ES'),
    BROWSER_TIMEZONE: z.string().trim().default('Europe/Madrid'),
    BROWSER_USER_AGENT: optionalTrimmedString,
    BROWSER_HEADLESS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),

    POLL_INTERVAL_MINUTES: z.coerce.number().positive().default(30),
    POLL_JITTER_MINUTES: z.coerce.number().min(0).default(10),
    KEEPALIVE_MINUTES: z.coerce.number().positive().default(30),
    MIN_REQUEST_INTERVAL_MS: z.coerce.number().int().min(0).default(4000),
    REQUEST_JITTER_MS: z.coerce.number().int().min(0).default(3000),
    RATE_LIMIT_BACKOFF_MINUTES: z.coerce.number().positive().default(60),
    DAILY_PROFILE_LOOKUP_BUDGET: z.coerce.number().int().min(0).default(100),
    CONVERSATIONS_PER_REFRESH: z.coerce.number().int().positive().default(40),
    CONVERSATION_PAGES_MAX: z.coerce.number().int().positive().default(25),
    THREAD_PAGES_MAX: z.coerce.number().int().positive().default(10),
    MESSAGE_BACKFILL_DAYS: z.coerce.number().int().positive().default(90),
    CONNECTIONS_PAGE_SIZE: z.coerce.number().int().positive().max(40).default(40),
  })
  .refine(
    (env) => (env.WEBHOOK_URL === undefined) === (env.WEBHOOK_SECRET === undefined),
    { message: 'WEBHOOK_URL and WEBHOOK_SECRET must be set together' },
  )
  .refine(
    (env) => {
      const proxyValues = [env.PROXY_SERVER, env.PROXY_USERNAME, env.PROXY_PASSWORD];
      const definedCount = proxyValues.filter((value) => value !== undefined).length;

      return definedCount === 0 || definedCount === 3 || (definedCount === 1 && env.PROXY_SERVER !== undefined);
    },
    { message: 'PROXY_SERVER is required; PROXY_USERNAME and PROXY_PASSWORD must be set together' },
  );

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (source: Record<string, string | undefined> = process.env): Env => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment:\n${issues}`);
  }

  return result.data;
};
