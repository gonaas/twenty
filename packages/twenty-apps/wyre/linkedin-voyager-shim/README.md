# LinkedIn Voyager shim

A self-hosted, Unipile-compatible HTTP service for the `linkedin-unipile` Twenty app. It exposes
the five `GET` endpoints and the three webhooks that app consumes, backed by LinkedIn's private
Voyager API and the account owner's own session cookie instead of a paid Unipile account.

The Twenty app is not modified: point its `UNIPILE_DSN` at this service and keep everything else.

## How it stays alive

LinkedIn terminates sessions whose traffic does not look like a browser, and challenges
datacenter IPs. So this service:

- runs a real Chromium (Playwright) and issues every Voyager call from inside a
  `linkedin.com` page, so TLS, cookies and headers are the browser's own;
- sends all LinkedIn traffic through a residential sticky proxy (`PROXY_*`);
- serves the Twenty app from a local SQLite snapshot that a jittered poller refreshes every
  `POLL_INTERVAL_MINUTES`; the app's reads never reach LinkedIn;
- paces LinkedIn requests (`MIN_REQUEST_INTERVAL_MS` + jitter), backs off on 429/999, and caps
  live profile lookups per day (`DAILY_PROFILE_LOOKUP_BUDGET`, 24h cache including misses);
- detects a killed session (redirect to login/checkpoint, 401/403, `li_at="delete me"`), stops
  polling, posts the account-status webhook and waits for a new cookie on `POST /admin/session`.

None of this removes the account risk: every request is made as the account owner, outside
LinkedIn's terms of service. Treat session loss as routine and keep the daily budget low.

## Endpoints

| Route | Notes |
|---|---|
| `GET /health` | No auth. `503` while the session is dead. |
| `GET /api/v1/users/relations?account_id&limit&cursor` | From snapshot, newest first, `limit` <= 1000 |
| `GET /api/v1/users/invite/sent?account_id&limit&cursor` | From snapshot, `limit` <= 100 |
| `GET /api/v1/messages?account_id&after&limit&cursor` | From snapshot, oldest first, `limit` <= 250 |
| `GET /api/v1/chats/{chat_id}?account_id` | `attendee_provider_id` is `null` for group chats |
| `GET /api/v1/users/{identifier}?account_id` | Live lookup; `422` unknown slug, `429` budget or rate limit, `503` session dead |
| `POST /admin/session` `{ li_at, jsessionid? }` | Rotate the cookie without redeploying; `409` if it does not authenticate |
| `POST /admin/sync` | Force a snapshot refresh |

`/api/*` and `/admin/*` require `X-API-KEY: <API_KEY>`. `account_id` must equal `ACCOUNT_ID`.

Webhooks (`WEBHOOK_URL`, header `Unipile-Auth: <WEBHOOK_SECRET>`): `new_relation`,
`message_received`, and the event-less account status `{ account_id, message: "CREDENTIALS" }`.
Nothing is emitted for the first snapshot after install.

## Setup

```bash
yarn install
cp env.example .env             # fill API_KEY, ACCOUNT_ID, PROXY_*, WEBHOOK_*
yarn playwright install chromium
yarn session:login              # opens a headed Chromium THROUGH the proxy; log in by hand; paste the printed vars into .env
yarn dev
curl -s localhost:8080/health
```

Mint the cookie through the same proxy the service uses: a session born on the IP it will live
on is the strongest "this is not a stolen cookie" signal available.

Every Voyager path was verified against a live session on 2026-09-12 (`docs/endpoints.md`).
When LinkedIn drifts, `yarn spike:capture` and `yarn spike:probe` re-check them.

## Railway

1. New service from this repository, root directory `packages/twenty-apps/wyre/linkedin-voyager-shim`
   (the Dockerfile there builds on the Playwright image; give it at least 1 GB of memory).
2. Attach a volume mounted at `/data`.
3. Set the variables from `env.example`. `PORT=8080`, `DATA_DIR=/data`.
4. The service is reachable from the Twenty services over private networking at
   `http://<service-name>.railway.internal:8080` (IPv6; the server binds to `::`).

Then in Twenty, Settings -> Apps -> LinkedIn (Unipile):

| Twenty variable | Value |
|---|---|
| `UNIPILE_DSN` | `http://<service-name>.railway.internal:8080` |
| `UNIPILE_API_KEY` | the shim `API_KEY` |
| `UNIPILE_ACCOUNT_ID` | the shim `ACCOUNT_ID` |
| `UNIPILE_WEBHOOK_SECRET` | the shim `WEBHOOK_SECRET` |

## Development

```bash
yarn typecheck
yarn lint
yarn test
yarn build && yarn start
```

Layout: `src/domain` (Unipile types, pure mappers, diffs, webhook payloads), `src/linkedin`
(Playwright session, Voyager client, endpoint registry, lookup service), `src/store` (SQLite
via `node:sqlite`), `src/poller` (refresh + webhooks), `src/http` (Hono routes).
