import { isNonEmptyString, isObject } from '@sniptt/guards';

const APP_ACCESS_TOKEN_ENV_VAR_NAME = 'TWENTY_APP_ACCESS_TOKEN';

// The post-install hook receives no execution context; the app access token
// injected into process.env is scoped to this workspace and carries its id
// in the JWT payload.
export const getCurrentWorkspaceId = (): string | undefined => {
  const accessToken = process.env[APP_ACCESS_TOKEN_ENV_VAR_NAME];

  if (!isNonEmptyString(accessToken)) {
    return undefined;
  }

  const encodedPayload = accessToken.split('.')[1];

  if (!isNonEmptyString(encodedPayload)) {
    return undefined;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    );

    if (!isObject(payload) || Array.isArray(payload)) {
      return undefined;
    }

    const workspaceId = (payload as Record<string, unknown>).workspaceId;

    return isNonEmptyString(workspaceId) ? workspaceId : undefined;
  } catch {
    return undefined;
  }
};
