export class RateLimitedError extends Error {
  constructor(
    public readonly status: number,
    public readonly retryAt: Date,
  ) {
    super(`LinkedIn rate limited the session (status ${status}); backing off until ${retryAt.toISOString()}`);
    this.name = 'RateLimitedError';
  }
}

export class SessionNotAliveError extends Error {
  constructor(public readonly state: string) {
    super(`LinkedIn session is not alive (state ${state})`);
    this.name = 'SessionNotAliveError';
  }
}

export class VoyagerRequestError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Voyager request to ${path} failed with status ${status}`);
    this.name = 'VoyagerRequestError';
  }
}
