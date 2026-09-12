export type SessionDeathReason =
  | 'REDIRECTED_TO_LOGIN'
  | 'CHALLENGE_CHECKPOINT'
  | 'COOKIE_REVOKED'
  | 'UNAUTHORIZED';

const LOGIN_PATH_MARKERS = ['/uas/login', '/login', '/authwall'];
const CHECKPOINT_PATH_MARKER = '/checkpoint/';

export const detectSessionDeath = ({
  url,
  status,
  setCookieHeader,
}: {
  url?: string | null;
  status?: number | null;
  setCookieHeader?: string | null;
}): SessionDeathReason | null => {
  if (typeof setCookieHeader === 'string' && /li_at="?delete me"?/i.test(setCookieHeader)) {
    return 'COOKIE_REVOKED';
  }

  if (typeof url === 'string') {
    const pathname = safePathname(url);

    if (pathname !== null) {
      if (pathname.includes(CHECKPOINT_PATH_MARKER)) {
        return 'CHALLENGE_CHECKPOINT';
      }

      if (LOGIN_PATH_MARKERS.some((marker) => pathname.startsWith(marker))) {
        return 'REDIRECTED_TO_LOGIN';
      }
    }
  }

  if (status === 401 || status === 403) {
    return 'UNAUTHORIZED';
  }

  return null;
};

const safePathname = (url: string): string | null => {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
};
