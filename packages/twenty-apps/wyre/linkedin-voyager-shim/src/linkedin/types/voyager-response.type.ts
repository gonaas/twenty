// Shape returned when the request carries accept: application/vnd.linkedin.normalized+json+2.1.
export type VoyagerEntity = {
  entityUrn?: string;
  $type?: string;
  [key: string]: unknown;
};

export type VoyagerNormalizedResponse = {
  data: VoyagerEntity;
  included: VoyagerEntity[];
  meta?: unknown;
};

export type VoyagerCollectionData = VoyagerEntity & {
  elements?: unknown[];
  '*elements'?: string[];
  paging?: { start?: number; count?: number; total?: number };
};
