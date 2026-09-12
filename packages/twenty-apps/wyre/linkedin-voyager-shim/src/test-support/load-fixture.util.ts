import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

const FIXTURES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../test/fixtures/voyager');

export const loadFixture = <TFixture = VoyagerNormalizedResponse>(name: string): TFixture =>
  JSON.parse(readFileSync(resolve(FIXTURES_DIR, `${name}.json`), 'utf8')) as TFixture;

export const loadVoyagerFixture = (name: string): VoyagerNormalizedResponse => loadFixture(name);
