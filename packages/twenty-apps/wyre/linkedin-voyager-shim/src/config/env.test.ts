import { parseEnv } from 'src/config/env';

const MINIMAL_ENV = {
  API_KEY: 'a-sufficiently-long-api-key',
  ACCOUNT_ID: 'wyre-linkedin',
};

describe('parseEnv', () => {
  it('applies defaults on a minimal environment', () => {
    const env = parseEnv(MINIMAL_ENV);

    expect(env.PORT).toBe(8080);
    expect(env.POLL_INTERVAL_MINUTES).toBe(30);
    expect(env.BROWSER_HEADLESS).toBe(true);
    expect(env.WEBHOOK_URL).toBeUndefined();
  });

  it('rejects a missing API_KEY', () => {
    expect(() => parseEnv({ ACCOUNT_ID: 'x' })).toThrow(/API_KEY/);
  });

  it('requires WEBHOOK_URL and WEBHOOK_SECRET together', () => {
    expect(() =>
      parseEnv({ ...MINIMAL_ENV, WEBHOOK_URL: 'https://example.com/hook' }),
    ).toThrow(/WEBHOOK_SECRET/);
  });

  it('treats empty strings as unset', () => {
    const env = parseEnv({ ...MINIMAL_ENV, PROXY_SERVER: '', LINKEDIN_LI_AT: '  ' });

    expect(env.PROXY_SERVER).toBeUndefined();
    expect(env.LINKEDIN_LI_AT).toBeUndefined();
  });

  it('rejects proxy credentials without a server', () => {
    expect(() =>
      parseEnv({ ...MINIMAL_ENV, PROXY_USERNAME: 'user', PROXY_PASSWORD: 'pass' }),
    ).toThrow(/PROXY_SERVER/);
  });
});
