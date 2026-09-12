import {
  type VoyagerEntity,
  type VoyagerNormalizedResponse,
} from 'src/linkedin/types/voyager-response.type';

export type EntityIndex = Map<string, VoyagerEntity>;

export const indexIncluded = (response: VoyagerNormalizedResponse): EntityIndex => {
  const index: EntityIndex = new Map();

  for (const entity of response.included ?? []) {
    if (typeof entity.entityUrn === 'string') {
      index.set(entity.entityUrn, entity);
    }
  }

  return index;
};

export const resolveEntity = (index: EntityIndex, urn: unknown): VoyagerEntity | null =>
  typeof urn === 'string' ? (index.get(urn) ?? null) : null;

export const resolveEntities = (index: EntityIndex, urns: unknown): VoyagerEntity[] => {
  if (!Array.isArray(urns)) {
    return [];
  }

  return urns
    .map((urn) => resolveEntity(index, urn))
    .filter((entity): entity is VoyagerEntity => entity !== null);
};

// Normalized payloads reference other entities either inline under `key` or
// as URNs under `*key`; callers should not care which one LinkedIn chose.
export const resolveReference = (
  index: EntityIndex,
  entity: VoyagerEntity,
  key: string,
): VoyagerEntity | null => {
  const inline = entity[key];

  if (typeof inline === 'object' && inline !== null && !Array.isArray(inline)) {
    return inline as VoyagerEntity;
  }

  return resolveEntity(index, entity[`*${key}`] ?? inline);
};

export const resolveReferenceList = (
  index: EntityIndex,
  entity: VoyagerEntity,
  key: string,
): VoyagerEntity[] => {
  const inline = entity[key];

  if (Array.isArray(inline) && inline.every((item) => typeof item === 'object' && item !== null)) {
    return inline as VoyagerEntity[];
  }

  return resolveEntities(index, entity[`*${key}`] ?? inline);
};

export const listElements = (
  index: EntityIndex,
  response: VoyagerNormalizedResponse,
): VoyagerEntity[] => resolveReferenceList(index, response.data, 'elements');

export const readString = (entity: VoyagerEntity | null, key: string): string | null => {
  const value = entity?.[key];

  return typeof value === 'string' && value.trim() !== '' ? value : null;
};

export const readNumber = (entity: VoyagerEntity | null, key: string): number | null => {
  const value = entity?.[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

export const readBoolean = (entity: VoyagerEntity | null, key: string): boolean | null => {
  const value = entity?.[key];

  return typeof value === 'boolean' ? value : null;
};

export const readObject = (entity: VoyagerEntity | null, key: string): VoyagerEntity | null => {
  const value = entity?.[key];

  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as VoyagerEntity)
    : null;
};
