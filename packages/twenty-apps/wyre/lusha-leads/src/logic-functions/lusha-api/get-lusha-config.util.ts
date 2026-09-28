import { isNonEmptyString } from '@sniptt/guards';

import {
  DEFAULT_LUSHA_CREATE_COMPANIES,
  DEFAULT_LUSHA_ROWS_PER_RUN,
  LUSHA_API_KEY_ENV_VAR_NAME,
  LUSHA_CREATE_COMPANIES_ENV_VAR_NAME,
  LUSHA_OWNER_EMAIL_ENV_VAR_NAME,
  LUSHA_ROWS_PER_RUN_ENV_VAR_NAME,
  LUSHA_TABLE_ID_ENV_VAR_NAME,
} from 'src/constants/server-variables';
import { LushaConfigError } from 'src/logic-functions/errors/lusha-config-error';

export type LushaConfig = {
  apiKey: string;
  tableId: string;
  ownerEmail: string | undefined;
  rowsPerRun: number;
  shouldCreateCompanies: boolean;
};

const readRequiredEnvVar = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!isNonEmptyString(value)) {
    throw new LushaConfigError(
      `${name} is not set. A workspace admin must configure it in Settings -> Apps.`,
    );
  }

  return value;
};

const readOptionalEnvVar = (name: string): string | undefined => {
  const value = process.env[name]?.trim();

  return isNonEmptyString(value) ? value : undefined;
};

// Zero is a valid setting: it reads no rows at all, which is how an admin
// pauses ingestion without uninstalling the app or revoking the API key.
const readRowsPerRun = (): number => {
  const rawValue = readOptionalEnvVar(LUSHA_ROWS_PER_RUN_ENV_VAR_NAME);

  if (rawValue === undefined) {
    return DEFAULT_LUSHA_ROWS_PER_RUN;
  }

  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue >= 0
    ? parsedValue
    : DEFAULT_LUSHA_ROWS_PER_RUN;
};

// Anything that is not "true", in any casing, leaves Company creation off, so
// a typo in the variable can never start fragmenting the Company list.
const readShouldCreateCompanies = (): boolean => {
  const rawValue = readOptionalEnvVar(LUSHA_CREATE_COMPANIES_ENV_VAR_NAME);

  if (rawValue === undefined) {
    return DEFAULT_LUSHA_CREATE_COMPANIES;
  }

  return rawValue.toLowerCase() === 'true';
};

export const getLushaConfig = (): LushaConfig => ({
  apiKey: readRequiredEnvVar(LUSHA_API_KEY_ENV_VAR_NAME),
  tableId: readRequiredEnvVar(LUSHA_TABLE_ID_ENV_VAR_NAME),
  ownerEmail: readOptionalEnvVar(LUSHA_OWNER_EMAIL_ENV_VAR_NAME),
  rowsPerRun: readRowsPerRun(),
  shouldCreateCompanies: readShouldCreateCompanies(),
});
