export const LUSHA_API_KEY_ENV_VAR_NAME = 'LUSHA_API_KEY';
export const LUSHA_TABLE_ID_ENV_VAR_NAME = 'LUSHA_TABLE_ID';
export const LUSHA_ROWS_PER_RUN_ENV_VAR_NAME = 'LUSHA_ROWS_PER_RUN';
export const LUSHA_CREATE_COMPANIES_ENV_VAR_NAME = 'LUSHA_CREATE_COMPANIES';
export const LUSHA_OWNER_EMAIL_ENV_VAR_NAME = 'LUSHA_OWNER_EMAIL';

export const DEFAULT_LUSHA_ROWS_PER_RUN = 100;

// Creating Companies is off by default: an unmatched company_name is far more
// often a spelling variant of a Company already in the CRM than a new account.
export const DEFAULT_LUSHA_CREATE_COMPANIES = false;
