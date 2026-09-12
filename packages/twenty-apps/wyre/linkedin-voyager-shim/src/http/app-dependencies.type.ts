import { type Env } from 'src/config/env';
import { type ProfileLookupService } from 'src/linkedin/profile-lookup.service';
import { type SessionCredentials } from 'src/linkedin/session-manager';
import { type Logger } from 'src/logger';
import { type RefreshSummary } from 'src/poller/refresh-snapshot';
import { type Store } from 'src/store/create-store';
import { type SessionState } from 'src/store/session.repository';

export type AppDependencies = {
  env: Pick<Env, 'API_KEY' | 'ACCOUNT_ID'>;
  store: Store;
  profileLookup: ProfileLookupService;
  session: {
    getState: () => SessionState;
    getDiedReason: () => string | null;
    rotate: (credentials: SessionCredentials) => Promise<boolean>;
  };
  poller: {
    triggerNow: () => Promise<RefreshSummary | null>;
    isRunning: () => boolean;
    start: () => void;
  };
  voyager: {
    queueLength: () => number;
    rateLimitedUntil: () => Date | null;
  };
  logger: Logger;
};
