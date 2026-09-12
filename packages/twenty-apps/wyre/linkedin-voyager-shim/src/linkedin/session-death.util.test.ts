import { detectSessionDeath } from 'src/linkedin/session-death.util';

describe('detectSessionDeath', () => {
  it('flags the explicit cookie revocation LinkedIn sends', () => {
    expect(
      detectSessionDeath({
        url: 'https://www.linkedin.com/voyager/api/me',
        status: 200,
        setCookieHeader: 'li_at="delete me"; Path=/; Domain=.linkedin.com',
      }),
    ).toBe('COOKIE_REVOKED');
  });

  it('flags redirects to login and challenge pages', () => {
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/uas/login?session_redirect=%2Ffeed' })).toBe(
      'REDIRECTED_TO_LOGIN',
    );
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/login' })).toBe('REDIRECTED_TO_LOGIN');
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/checkpoint/challenge/abc' })).toBe(
      'CHALLENGE_CHECKPOINT',
    );
  });

  it('flags unauthorized Voyager responses', () => {
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/voyager/api/me', status: 401 })).toBe(
      'UNAUTHORIZED',
    );
  });

  it('returns null for a healthy feed navigation', () => {
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/feed/', status: 200 })).toBeNull();
    expect(detectSessionDeath({ url: 'https://www.linkedin.com/in/someone/', status: 200 })).toBeNull();
  });
});
