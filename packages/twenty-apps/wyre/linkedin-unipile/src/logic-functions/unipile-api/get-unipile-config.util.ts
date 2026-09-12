import { isNonEmptyString } from '@sniptt/guards';

import {
  UNIPILE_ACCOUNT_ID_ENV_VAR_NAME,
  UNIPILE_API_KEY_ENV_VAR_NAME,
  UNIPILE_DSN_ENV_VAR_NAME,
} from 'src/constants/server-variables';
import { UnipileConfigError } from 'src/logic-functions/errors/unipile-config-error';

export type UnipileConfig = {
  dsn: string;
  apiKey: string;
  accountId: string;
};

const readRequiredEnvVar = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!isNonEmptyString(value)) {
    throw new UnipileConfigError(
      `${name} is not set. A workspace admin must configure it in Settings -> Apps.`,
    );
  }

  return value;
};

export const getUnipileConfig = (): UnipileConfig => ({
  dsn: readRequiredEnvVar(UNIPILE_DSN_ENV_VAR_NAME),
  apiKey: readRequiredEnvVar(UNIPILE_API_KEY_ENV_VAR_NAME),
  accountId: readRequiredEnvVar(UNIPILE_ACCOUNT_ID_ENV_VAR_NAME),
});
