# Lusha Leads

Ingests a Lusha Workspace contacts table into Twenty as **People**, each with
their LinkedIn URL set.

That is the whole job. Once a Person exists with a `linkedinLink`, the sibling
[`linkedin-unipile`](../linkedin-unipile) app takes the relationship over on
its own: it detects the invitation you sent by hand, the acceptance, and the
messages, and advances LinkedIn Status accordingly.

This app never touches LinkedIn. It sends nothing, invites nobody, and does
not duplicate anything `linkedin-unipile` does.

## ⚠️ Reading rows costs Lusha credits

`GET /v3/contacts/tables/{table_id}/entities` is **charged per row returned**
(`export_api`). Every run of the cron spends credits on every row it reads,
whether or not the row produces a new Person.

**The account this was built against is already low on credits.**

Two consequences:

- `LUSHA_ROWS_PER_RUN` is a spend ceiling, not a batch size. Setting it to `0`
  pauses ingestion without uninstalling the app.
- The cron runs **once a day** (`0 6 * * *`), not every few minutes. The table
  is small and curated by hand, so there is nothing to gain from reading it
  more often.

Each run returns `creditsCharged` in its summary. The v3 `billing` object
carries only `creditsCharged` and `resultsReturned` — the API exposes no
balance or low-balance signal on this route, so the app cannot warn about one.

## How it works

1. Reads at most `LUSHA_ROWS_PER_RUN` rows from the configured table,
   paginating with `page` (0-based) and `size` (capped at 100 per the spec).
   `size` is fixed for the whole run at `min(LUSHA_ROWS_PER_RUN, 100)` — the
   server derives the offset from `page * size`, so shrinking `size` on the
   last page would slide the window backwards over rows already paid for. The
   budget is enforced by trimming locally instead.
2. Loads every Person in the workspace once and indexes them by
   `lushaContactId` and by normalized LinkedIn slug.
3. For each row:
   - **No usable LinkedIn URL → skipped and counted.** The point of a lead
     here is that it can be found on LinkedIn. A value only counts when its
     cell reports `status: "success"` and it looks like a profile — a
     `linkedin.com/in/<slug>` URL or a bare slug. A placeholder such as
     `"Not found"`, or a `/company/` URL, is not a lead.
   - **Match on `lushaContactId`, else on the normalized slug → UPDATE**, and
     the update only fills fields that are currently empty. A value a human or
     `linkedin-unipile` already wrote is never overwritten.
   - **No match → CREATE.**
   - **A row Twenty rejects → counted as `failed` and stepped over.** The page
     is already billed by then, so one bad record must not cost the rest.
4. Records it writes are added to the in-memory index straight away, so
   running the ingestion twice in a row creates zero People the second time.

### Field mapping

| Lusha | Twenty Person |
| --- | --- |
| `firstName` / `lastName` | `name` (FULL_NAME) — the separate fields, never a split of `fullName` |
| `socialLinks.linkedin`, falling back to the `contact_linkedin` column | `linkedinLink.primaryLinkUrl` (LINKS composite) |
| `job.title`, falling back to the `contact_jobTitle` column | `jobTitle` |
| `tableContactId` | `lushaContactId` (this app's field) |
| `company_name` column | `company` relation, by **exact** name match |
| unmasked `datapoints.emails` | `emails` |
| unmasked `datapoints.phones[0]` | `phones` |

A `company_name` with no exact match creates a Company **only** when
`LUSHA_CREATE_COMPANIES` is true. Off by default: an unmatched name is far
more often a spelling variant of a Company already in the CRM than a new
account, and creating it fragments the Company list.

### Masked data

Lusha returns emails and phones **masked** unless the contact is
`type: "SHOWN"` — `"...@kronosig.com"`, `"+34 671..."`, with
`isMasked: true`. A masked value still parses as a plausible email or phone
number, so nothing but those flags distinguishes it from a real one.

**The gate fails closed.** A datapoint is written only when the row says
`type: "SHOWN"` *and* the datapoint says `isMasked: false`. An absent or null
`isMasked` is treated as masked: storing a masked value would poison search,
filters and any future outreach with an address nobody can be reached at.
Unmasking costs credits and is out of scope for this app.

## Setup

1. Install the app on the workspace.
2. In **Settings → Apps → Lusha Leads**, fill in the server variables below.
3. The first cron tick runs at 06:00. To try it sooner:
   `npx twenty dev:function:exec ingest-lusha-leads`.

### Server variables

| Name | Secret | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `LUSHA_API_KEY` | yes | yes | — | Lusha API key, sent as the `api_key` header. |
| `LUSHA_TABLE_ID` | no | yes | — | Id of the Lusha Workspace contacts table to ingest. No table id is hardcoded anywhere in this app. |
| `LUSHA_ROWS_PER_RUN` | no | no | `100` | Hard cap on rows read per run, and therefore on credits spent per run. `0` pauses ingestion. |
| `LUSHA_CREATE_COMPANIES` | no | no | `false` | When `true`, an unmatched `company_name` creates a Company. The value is compared case-insensitively; anything other than `true` leaves it off. |
| `LUSHA_OWNER_EMAIL` | no | no | — | Lusha user the read is attributed to, sent as the `email` query parameter. See the note below. |

`LUSHA_OWNER_EMAIL` is optional in the published OpenAPI spec but the Tables
tutorial states the owner is required on every table-route call when
authenticating with an API key. Set it to the account that owns the table
(`you@example.com`). If Lusha answers `400` without it, that variable is the
fix — no code change needed.

## Verified against

The HTTP contract was verified on **2026-09-28** against Lusha's official
public API documentation:

- Endpoint reference:
  <https://docs.lusha.com/apis/openapi/contacts-tables/getcontactstableentities>
- Machine-readable OpenAPI v3 spec the reference is generated from:
  <https://docs.lusha.com/_spec/apis/@v3/openapi.yaml>
- Tables overview: <https://docs.lusha.com/tutorials/tables>

What that confirmed:

- Server: `https://api.lusha.com`
- Operation: `GET /v3/contacts/tables/{table_id}/entities`
  (`operationId: getContactsTableEntities`)
- Auth: `ApiKeyAuth`, an API key in the **`api_key`** request header
- Query: `email` (owner), `page` (integer, max 100, default 0), `size`
  (integer, default 100)
- Response: `{ data: TableEntity[], pagination: { page, size, total },
  billing: { creditsCharged, resultsReturned } }`
- Billing: "Charged per row returned via `export_api`."

Two caveats worth knowing before changing the client:

- The **tutorial page contradicts the reference**: it lists
  `POST /v3/contacts/tables/entities/get`, which does not exist in the v3
  OpenAPI spec. The generated reference and the spec agree on the `GET` form
  above, so that is what this app calls.
- The spec documents `TableEntity` as `{ id, columns[] }` and says outright
  that the shape is *"representative, not an exhaustive schema"* and that the
  remaining per-row fields are owned by the Workspace service. The live
  response also carries `firstName`, `lastName`, `fullName`, `type`,
  `tableContactId`, `datapoints`, `job` and `socialLinks`, which is what this
  app maps. Every one of those is optional in
  `src/logic-functions/lusha-api/types/lusha-table-entity.type.ts`.

Everything that talks HTTP lives in **one file** —
`src/logic-functions/lusha-api/get-lusha-table-entities.ts` — so correcting
the contract is a one-file change.

## Layout

```
src/
  application-config.ts                 app manifest + server variables
  default-role.ts                       its own role (Person + Company)
  constants/
    server-variables.ts
    universal-identifiers.ts
  fields/person/
    lusha-contact-id.field.ts           lushaContactId, TEXT, not UI-editable
  logic-functions/
    ingest-lusha-leads.ts               the cron entry point
    domain/                             pure, unit-tested
      build-person-create-input.ts
      build-person-update-input.ts      fill-only-the-blanks
      map-lusha-row-to-person.ts
      normalize-linkedin-identifier.ts
      resolve-existing-person.ts        two-key dedupe
      select-unmasked-datapoints.ts     the masked-data gate
    data/                               GraphQL reads and writes
    lusha-api/                          the Lusha REST layer
    errors/
    types/
```

`normalizeLinkedinIdentifier` is deliberately **copied** from
`linkedin-unipile` rather than imported: the two apps version and deploy
independently, so a cross-app import would couple them. Both must agree on the
slug, because that slug is how a Person ingested here is recognised there. Its
test file extends the sibling's cases with non-ASCII slugs such as
`oscar-herráez-sánchez-58820617`.

### A note on the role

Twenty has no separate create permission: an insert is authorized by
`canUpdateObjectRecords`. The role therefore grants read + update on Person
(to create leads) and on Company (only so `LUSHA_CREATE_COMPANIES` can create
one). `linkedin-unipile`'s role is untouched — it deliberately has no create
permission and must stay that way.

## Development

```bash
yarn install
yarn typecheck     # tsgo --noEmit -p tsconfig.spec.json
yarn test          # vitest
yarn lint          # oxlint
npx oxfmt src/
```

Tests are pure-function unit tests only, mirroring `linkedin-unipile`: no
network, kv or GraphQL mocking. Nothing in this repository runs against the
live Lusha API, because doing so spends credits.

> `yarn typecheck` needs the generated API client
> (`node_modules/twenty-client-sdk/dist/core/generated`), which
> `npx twenty dev:generate-client` produces from the active remote. The
> generated client is typed against whichever workspace it was built from, so
> it does not know about `lushaContactId`; the selection in
> `src/logic-functions/data/fetch-lusha-people.util.ts` is the one place that
> is cast, exactly as `linkedin-unipile` does it.
