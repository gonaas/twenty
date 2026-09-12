import { type Env } from 'src/config/env';
import {
  mapMemberRelationship,
  mapProfileIdentity,
} from 'src/domain/mappers/map-profile-to-user-profile.util';
import { type UnipileUserProfile } from 'src/domain/unipile/unipile-user-profile.type';
import { VOYAGER_ENDPOINTS, VOYAGER_PAGE_INSTANCE_PREFIXES, VOYAGER_REFERERS } from 'src/linkedin/endpoints';
import { RateLimitedError, SessionNotAliveError } from 'src/linkedin/errors';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';
import { type VoyagerClient } from 'src/linkedin/voyager-client';
import { type Logger } from 'src/logger';
import { type LookupsRepository } from 'src/store/lookups.repository';
import { type MetaRepository, META_KEYS } from 'src/store/meta.repository';

const LOOKUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// LinkedIn answers an unknown or unreachable identifier with 403 as well as 404.
const NOT_FOUND_STATUSES = new Set([400, 403, 404, 422]);

export type ProfileLookupOutcome =
  | { kind: 'found'; profile: UnipileUserProfile }
  | { kind: 'not_found' }
  | { kind: 'budget_exhausted' }
  | { kind: 'rate_limited'; retryAt: Date }
  | { kind: 'session_dead' }
  | { kind: 'upstream_error'; status: number };

export type ProfileLookupService = {
  lookup: (identifier: string) => Promise<ProfileLookupOutcome>;
  lookupsToday: () => number;
};

const startOfUtcDay = (): string => {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
};

export const createProfileLookupService = ({
  env,
  voyagerClient,
  lookupsRepository,
  metaRepository,
  logger,
}: {
  env: Env;
  voyagerClient: VoyagerClient;
  lookupsRepository: LookupsRepository;
  metaRepository: MetaRepository;
  logger: Logger;
}): ProfileLookupService => {
  const lookupsToday = () => lookupsRepository.countSince(startOfUtcDay());

  // One lookup is two Voyager calls: the profile resolves the identifier to a
  // provider id, the relationship carries the distance and pending invitation.
  const fetchProfile = async (identifier: string): Promise<ProfileLookupOutcome> => {
    const ownProviderId = metaRepository.get(META_KEYS.ownProviderId);

    if (ownProviderId === null) {
      return { kind: 'session_dead' };
    }

    const requestOptions = {
      referer: VOYAGER_REFERERS.profile({ memberIdentity: identifier }),
      pageInstancePrefix: VOYAGER_PAGE_INSTANCE_PREFIXES.profile,
    };
    const profileResult = await voyagerClient.get(
      VOYAGER_ENDPOINTS.profile({ memberIdentity: identifier }),
      requestOptions,
    );

    if (NOT_FOUND_STATUSES.has(profileResult.status)) {
      return { kind: 'not_found' };
    }

    if (profileResult.status < 200 || profileResult.status >= 300 || profileResult.json === null) {
      logger.warn('Profile lookup failed upstream', { identifier, status: profileResult.status });

      return { kind: 'upstream_error', status: profileResult.status };
    }

    const identity = mapProfileIdentity(profileResult.json as VoyagerNormalizedResponse);

    if (identity === null) {
      return { kind: 'not_found' };
    }

    const relationshipResult = await voyagerClient.get(
      VOYAGER_ENDPOINTS.memberRelationship({ providerId: identity.providerId }),
      requestOptions,
    );

    if (
      relationshipResult.status < 200 ||
      relationshipResult.status >= 300 ||
      relationshipResult.json === null
    ) {
      logger.warn('Member relationship lookup failed upstream', {
        identifier,
        status: relationshipResult.status,
      });

      return { kind: 'upstream_error', status: relationshipResult.status };
    }

    const relationshipData = (relationshipResult.json as { data?: Record<string, unknown> }).data ?? {};

    logger.debug('Member relationship payload', {
      identifier,
      unionKeys: Object.keys((relationshipData.memberRelationshipUnion as object | undefined) ?? {}),
      dataKeys: Object.keys((relationshipData.memberRelationshipData as object | undefined) ?? {}),
    });

    return {
      kind: 'found',
      profile: mapMemberRelationship({
        identity,
        response: relationshipResult.json as VoyagerNormalizedResponse,
        ownProviderId,
      }),
    };
  };

  return {
    lookupsToday,
    lookup: async (identifier) => {
      const cached = lookupsRepository.find(identifier);

      if (cached !== null && Date.parse(cached.fetchedAt) + LOOKUP_CACHE_TTL_MS > Date.now()) {
        return cached.profile === null ? { kind: 'not_found' } : { kind: 'found', profile: cached.profile };
      }

      if (lookupsToday() >= env.DAILY_PROFILE_LOOKUP_BUDGET) {
        return { kind: 'budget_exhausted' };
      }

      try {
        const outcome = await fetchProfile(identifier);
        const fetchedAt = new Date().toISOString();

        if (outcome.kind === 'found') {
          lookupsRepository.save({ identifier, status: 200, profile: outcome.profile, fetchedAt });
        } else if (outcome.kind === 'not_found') {
          lookupsRepository.save({ identifier, status: 422, profile: null, fetchedAt });
        }

        return outcome;
      } catch (error) {
        if (error instanceof RateLimitedError) {
          return { kind: 'rate_limited', retryAt: error.retryAt };
        }

        if (error instanceof SessionNotAliveError) {
          return { kind: 'session_dead' };
        }

        throw error;
      }
    },
  };
};
