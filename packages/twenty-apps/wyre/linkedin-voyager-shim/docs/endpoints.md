# Voyager endpoints

Every LinkedIn-specific path lives in `src/linkedin/endpoints.ts`; every response shape the
mappers depend on lives in `test/fixtures/voyager/*.json`. This table is the source of truth
for how much of that has been verified against a live session.

| Purpose | Path (see `endpoints.ts`) | Mapper | Status |
|---|---|---|---|
| Own identity | `GET /voyager/api/me` | `map-me-to-provider-id.util.ts` | VERIFIED 2026-09-12 |
| Connections | `GET /voyager/api/relationships/dash/connections?decorationId=…ConnectionListWithProfile-16&count=40&q=search&sortType=RECENTLY_ADDED&start=N` | `map-connections-to-relations.util.ts` | VERIFIED 2026-09-12 (40/page, `createdAt` epoch ms, 39/40 with slug) |
| Sent invitations | `GET /voyager/api/relationships/sentInvitationViewsV2?invitationType=CONNECTION&q=invitationType&start=N&count=100` | `map-sent-invitations.util.ts` | VERIFIED 2026-09-12 (100/page) |
| Conversations page | `GET /voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0e6384758dbe98769dd964f463fcdbeb&variables=(mailboxUrn,category:INBOX,lastUpdatedBefore?,count)` | `map-conversations-to-chats.util.ts`, `mapEmbeddedMessages` | VERIFIED 2026-09-12 (newest first, `lastUpdatedBefore` strictly older, embeds the latest message) |
| Recent conversations | `…queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn)` | same | VERIFIED 2026-09-12 (20 most recent; `count`/`lastUpdatedBefore` ignored) |
| Thread messages | `…queryId=messengerMessages.d8ea76885a52fd5dc5c317078ab7c977&variables=(conversationUrn,deliveredAt,countBefore,countAfter:0)` | `map-messenger-messages.util.ts` | VERIFIED 2026-09-12 (ascending, anchor walks back) |
| Profile identity | `GET /voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=<slug or id>` | `mapProfileIdentity` | VERIFIED 2026-09-12 |
| Member relationship | `GET /voyager/api/voyagerRelationshipsDashMemberRelationships/urn:li:fsd_memberRelationship:<id>` | `mapMemberRelationship` | VERIFIED 2026-09-12 for `noConnection` (`memberDistance` is a plain string); `connection` and pending `invitation` shapes inferred |

Facts learned on 2026-09-12:

- The web SPA no longer calls the REST entries above: connections, invitations and profiles
  moved to `flagship-web` (React Server Components with SDUI payloads), which is rendered UI,
  not an API. The REST endpoints still answer, so the shim uses them.
- The legacy family `/voyager/api/identity/profiles/{id}/*` returns `410 Gone`.
- `FullProfileWithEntities-101` does not include the member relationship; the distance and
  pending invitation come from the separate member-relationship resource.
- Rest.li values must be percent-encoded including parentheses and commas
  (`src/linkedin/restli.util.ts`); `encodeURIComponent` alone yields `400`.
- Messaging GraphQL uses `accept: application/graphql` and returns plain nested trees keyed by
  resolver (`messengerConversationsByCategory`, `messengerMessagesByAnchorTimestamp`, …);
  `readMessengerElements` finds the collection regardless of the key.
- Other messenger query ids declared by the bundles and what they require (from their
  validation errors): `33c5bfbf…` `categories: [String!]!`; `395d9022…`/`9c3ab648…`
  `recipients` (returned nothing for a known attendee); `737b2714…`/`bfafd364…` search
  criteria; `d958e56c…`/`de3cb2a3…` `conversationIds`; `fb3eab13…` `messengerConversationsId`;
  `messengerMessages.15615824…` `count` (first 20 ascending, ignores `deliveredAt`);
  `5604b060…` sync-token `criteria`; `b2da9490…` `messengerMessagesIds`.
- Sponsored InMail threads have an `organization` participant instead of a member; they map
  to chats without attendees, which the CRM ignores.

## Re-verifying after drift

```bash
yarn session:login            # through the same PROXY_* the shim will use
yarn spike:capture            # records what the SPA calls on the list, inbox and profile pages
yarn spike:probe              # calls the endpoints above from the session and reports status/shape
```

Reports land in `docs/spike-capture-<date>.md`, `docs/spike-probe-<date>-*.md`; raw bodies in
`test/fixtures/voyager/*.raw.json` (gitignored). When a GraphQL hash rotates, search the loaded
`static.licdn.com` bundles for `messenger[A-Za-z]+\.[0-9a-f]{32}` and update
`MESSENGER_QUERY_IDS`.
