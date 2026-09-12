# LinkedIn (Unipile)

Syncs each Person's LinkedIn relationship (connection, invitations, messages) from
[Unipile](https://www.unipile.com) and advances `Linkedin Status` automatically. Runs
as a Twenty application: a 30-minute cron reconcile plus a webhook for near-real-time
updates.

## Self-hosted alternative to Unipile

`packages/twenty-apps/wyre/linkedin-voyager-shim` implements the same five endpoints and three
webhooks this app consumes, backed by the account owner's LinkedIn session cookie. To use it,
deploy the shim and set `UNIPILE_DSN` to its private URL (for example
`http://linkedin-voyager-shim.railway.internal:8080`), `UNIPILE_API_KEY` to the shim `API_KEY`,
`UNIPILE_ACCOUNT_ID` to the shim `ACCOUNT_ID` and `UNIPILE_WEBHOOK_SECRET` to the shim
`WEBHOOK_SECRET`. No code change in this app is needed.

## Server variables

Set these on the application registration (Settings -> Apps -> LinkedIn (Unipile)):

| Variable | Secret | Notes |
|---|---|---|
| `UNIPILE_DSN` | no | Base URL of the Unipile API, e.g. `https://api1.unipile.com:12345` |
| `UNIPILE_API_KEY` | yes | Sent as the `X-API-KEY` header |
| `UNIPILE_ACCOUNT_ID` | no | The Unipile account id for the connected LinkedIn session |
| `UNIPILE_WEBHOOK_SECRET` | yes | Shared secret Unipile sends back in the `Unipile-Auth` header |
| `LINKEDIN_PROFILE_LOOKUPS_PER_RUN` | no | Caps `GET /users/{identifier}` calls per reconcile run, default 25 |

## Railway requirement

`LOGIC_FUNCTION_TYPE=local` must be set on both `twenty-server` and `twenty-worker`.
The production default is `DISABLED`, which means no app logic function runs at all.

## Deploy

```bash
cd packages/twenty-apps/wyre/linkedin-unipile
yarn install
yarn twenty remote:add --as railway --url "$TWENTY_SERVER_URL" --api-key "$TWENTY_API_TOKEN"
yarn twenty dev:build
yarn twenty app:publish --private -r railway
yarn twenty app:install -r railway
```

Then in the CRM: Settings -> Apps -> LinkedIn (Unipile) -> set the five server
variables above.

## Unipile webhooks

Create these once, against the Unipile DSN, pointing at this app's webhook resolver
(`unipile-webhook-resolver`, universal identifier
`eb40d474-181f-4dd9-9fe0-b120e9b07f77`):

```bash
curl -X POST "$UNIPILE_DSN/api/v1/webhooks" -H "X-API-KEY: $UNIPILE_API_KEY" -H "Content-Type: application/json" \
  -d '{"source":"messaging","request_url":"https://<server-host>/webhooks/server/eb40d474-181f-4dd9-9fe0-b120e9b07f77","headers":[{"key":"Unipile-Auth","value":"<UNIPILE_WEBHOOK_SECRET>"}]}'

curl -X POST "$UNIPILE_DSN/api/v1/webhooks" -H "X-API-KEY: $UNIPILE_API_KEY" -H "Content-Type: application/json" \
  -d '{"source":"users","request_url":"https://<server-host>/webhooks/server/eb40d474-181f-4dd9-9fe0-b120e9b07f77","headers":[{"key":"Unipile-Auth","value":"<UNIPILE_WEBHOOK_SECRET>"}]}'

curl -X POST "$UNIPILE_DSN/api/v1/webhooks" -H "X-API-KEY: $UNIPILE_API_KEY" -H "Content-Type: application/json" \
  -d '{"source":"account_status","request_url":"https://<server-host>/webhooks/server/eb40d474-181f-4dd9-9fe0-b120e9b07f77","headers":[{"key":"Unipile-Auth","value":"<UNIPILE_WEBHOOK_SECRET>"}]}'
```

## LinkedIn account safety

Unipile operates on the personal LinkedIn session, outside LinkedIn's terms of
service. To keep the account safe: relations and messages are only listed
(cheap, no per-profile cost), reads are paced 4-5.5 hours apart per reconcile
run rather than at fixed times, and profile lookups (`GET /users/{identifier}`,
the only endpoint that visits a specific profile) are capped at
`LINKEDIN_PROFILE_LOOKUPS_PER_RUN` per run. A failed lookup is not retried for
24 hours.
