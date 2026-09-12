// Rest.li 2.0 query values are wrapped in parentheses and the SPA percent-encodes
// every reserved character inside them, including the parentheses and commas
// that encodeURIComponent leaves untouched.
export const encodeRestliValue = (value: string): string =>
  encodeURIComponent(value).replace(/[()!'*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export type RestliRawValue = { raw: string };

export type RestliVariableValue = string | number | RestliRawValue;

// List(...) keeps its own parentheses and commas unencoded; only the items are encoded.
export const restliList = (values: string[]): RestliRawValue => ({
  raw: `List(${values.map(encodeRestliValue).join(',')})`,
});

const encodeVariable = (value: RestliVariableValue): string => {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return encodeRestliValue(value);
  }

  return value.raw;
};

export const buildGraphqlVariables = (variables: Record<string, RestliVariableValue>): string =>
  `(${Object.entries(variables)
    .map(([key, value]) => `${key}:${encodeVariable(value)}`)
    .join(',')})`;
