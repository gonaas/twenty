# Messaging probe 2026-09-12

## Query ids declared by the bundles

| Query id | Variable names seen nearby |
|---|---|
| messengerConversationDrafts.6ae82792d9d6327645a820f7cf541a4d |  |
| messengerConversationDrafts.79f07809b230ccd9adc512c97e7cb673 |  |
| messengerConversations.0d5e6781bbee71c3e51c8843c6519f48 |  |
| messengerConversations.0e6384758dbe98769dd964f463fcdbeb |  |
| messengerConversations.33c5bfbf15b112da638fee15f77f5e33 |  |
| messengerConversations.395d9022591a61de801254af1334a059 |  |
| messengerConversations.737b27144cf922499202658a5345016f |  |
| messengerConversations.74c17e85611b60b7ba2700481151a316 |  |
| messengerConversations.9501074288a12f3ae9e3c7ea243bccbf |  |
| messengerConversations.9c3ab648b616451570c715e4a184465e |  |
| messengerConversations.b7affb08320b28f0d8bf883fe8590337 |  |
| messengerConversations.bfafd36408eaf7b05321b3928d123711 |  |
| messengerConversations.d958e56ceafc187daca998b17eee20fc |  |
| messengerConversations.db23ac94a546670956b37f89cf64a070 |  |
| messengerConversations.de3cb2a3e8fe576a5d0908f4e00f64cc |  |
| messengerConversations.fb3eab135970d880d59c5fad1bc695f9 |  |
| messengerMailboxCounts.fc528a5a81a76dff212a4a3d2d48e84b |  |
| messengerMailboxRealtimeSubscriptionAuthorizationTokens.1a3b0efc0a0a2c24c23367b5f8a25e62 |  |
| messengerMessageDrafts.0c69f1f302be6bc6e75029c09d1b421e |  |
| messengerMessageDrafts.27315053e29a283b57acdefa0c6b76db |  |
| messengerMessageDrafts.2cf9ab96f9203dcfb41c51cc8a81d024 |  |
| messengerMessageDrafts.f1a11f3d6759ecaedbda4cea46cf47ae |  |
| messengerMessages.1561582483b8a511147478d8c099b03d |  |
| messengerMessages.5604b0605ca53ed7ca9071ec11007c60 |  |
| messengerMessages.5846eeb71c981f11e0134cb6626cc314 |  |
| messengerMessages.b2da9490a1aee637ef1f5c8576f9799f |  |
| messengerMessages.d8ea76885a52fd5dc5c317078ab7c977 |  |
| messengerMessagingParticipants.b0e19e57faf7a9bddf344c242c596c13 |  |
| messengerQuickReplies.4338d226319203b5b08920ab7621fa45 |  |
| messengerSeenReceipts.dc29d9bcecad524b9dd264acbbde3b5c |  |

## Probes

| Probe | Status | Summary | Path | File |
|---|---|---|---|---|
| me | 200 | elements=- first=- last=- metadata=null | `/voyager/api/me` | probe2-01-me.raw.json |
| conversations-default | 200 | elements=20 first=1789129876484 last=1787220204049 metadata={"newSyncToken":"gtDO35JournQ35JoLnVybjpsaTpmYWJyaWM6cHJvZC1sdHgxAA==","_recipeType":"com.linkedin.6614bca623fc9720b29ed | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-02-conversations-default.raw.json |
| messages-default | 200 | elements=1 first=1789129876484 last=1789129876484 metadata={"_type":"com.linkedin.messenger.SyncMetadata","deletedUrns":[],"newSyncToken":"ipCbh5Jo3ojR35JoLnVybjpsaTpmYWJyaWM6cHJv | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…)` | probe2-03-messages-default.raw.json |
| messages-count | 200 | elements=1 first=1789129876484 last=1789129876484 metadata={"_type":"com.linkedin.messenger.SyncMetadata","deletedUrns":[],"newSyncToken":"ipCbh5JorM7R35JoLnVybjpsaTpmYWJyaWM6cHJv | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,count:20)` | probe2-04-messages-count.raw.json |
| messages-before | 200 | elements=1 first=1789129876484 last=1789129876484 metadata={"_type":"com.linkedin.messenger.SyncMetadata","deletedUrns":[],"newSyncToken":"ipCbh5JokpTS35JoLnVybjpsaTpmYWJyaWM6cHJv | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,deliveredAt:1789222597819,count:20)` | probe2-05-messages-before.raw.json |
| conversations-fcdbeb-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0e6384758dbe98769dd964f463fcdbeb&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-06-conversations-fcdbeb-plain.raw.json |
| conversations-fcdbeb-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0e6384758dbe98769dd964f463fcdbeb&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-07-conversations-fcdbeb-before.raw.json |
| conversations-7f5e33-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.33c5bfbf15b112da638fee15f77f5e33&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-08-conversations-7f5e33-plain.raw.json |
| conversations-7f5e33-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.33c5bfbf15b112da638fee15f77f5e33&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-09-conversations-7f5e33-before.raw.json |
| conversations-34a059-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.395d9022591a61de801254af1334a059&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-10-conversations-34a059-plain.raw.json |
| conversations-34a059-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.395d9022591a61de801254af1334a059&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-11-conversations-34a059-before.raw.json |
| conversations-45016f-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.737b27144cf922499202658a5345016f&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-12-conversations-45016f-plain.raw.json |
| conversations-45016f-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.737b27144cf922499202658a5345016f&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-13-conversations-45016f-before.raw.json |
| conversations-51a316-plain | 200 | elements=20 first=1789129876484 last=1787220204049 metadata={"_type":"com.linkedin.messenger.SyncMetadata","deletedUrns":[],"newSyncToken":"gtDO35JonOTW35JoLnVybjpsaTpmYWJyaWM6cHJv | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.74c17e85611b60b7ba2700481151a316&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-14-conversations-51a316-plain.raw.json |
| conversations-51a316-before | 200 | elements=20 first=1789129876484 last=1787220204049 metadata={"_type":"com.linkedin.messenger.SyncMetadata","deletedUrns":[],"newSyncToken":"gtDO35JokLDX35JoLnVybjpsaTpmYWJyaWM6cHJv | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.74c17e85611b60b7ba2700481151a316&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-15-conversations-51a316-before.raw.json |
| conversations-3bccbf-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.9501074288a12f3ae9e3c7ea243bccbf&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-16-conversations-3bccbf-plain.raw.json |
| conversations-3bccbf-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.9501074288a12f3ae9e3c7ea243bccbf&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-17-conversations-3bccbf-before.raw.json |
| conversations-84465e-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.9c3ab648b616451570c715e4a184465e&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-18-conversations-84465e-plain.raw.json |
| conversations-84465e-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.9c3ab648b616451570c715e4a184465e&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-19-conversations-84465e-before.raw.json |
| conversations-590337-plain | 200 | elements=20 first=1789129876484 last=1787220204049 metadata={"newSyncToken":"gtDO35JonP7Z35JoLnVybjpsaTpmYWJyaWM6cHJvZC1sdHgxAA==","_recipeType":"com.linkedin.ea2b1b945dbc12686523a | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.b7affb08320b28f0d8bf883fe8590337&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-20-conversations-590337-plain.raw.json |
| conversations-590337-before | 200 | elements=20 first=1789129876484 last=1787220204049 metadata={"newSyncToken":"gtDO35Jo0M3a35JoLnVybjpsaTpmYWJyaWM6cHJvZC1sdHgxAA==","_recipeType":"com.linkedin.ea2b1b945dbc12686523a | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.b7affb08320b28f0d8bf883fe8590337&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-21-conversations-590337-before.raw.json |
| conversations-123711-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.bfafd36408eaf7b05321b3928d123711&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-22-conversations-123711-plain.raw.json |
| conversations-123711-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.bfafd36408eaf7b05321b3928d123711&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-23-conversations-123711-before.raw.json |
| conversations-ee20fc-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.d958e56ceafc187daca998b17eee20fc&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-24-conversations-ee20fc-plain.raw.json |
| conversations-ee20fc-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.d958e56ceafc187daca998b17eee20fc&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-25-conversations-ee20fc-before.raw.json |
| conversations-64a070-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.db23ac94a546670956b37f89cf64a070&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-26-conversations-64a070-plain.raw.json |
| conversations-64a070-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.db23ac94a546670956b37f89cf64a070&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-27-conversations-64a070-before.raw.json |
| conversations-0f64cc-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.de3cb2a3e8fe576a5d0908f4e00f64cc&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-28-conversations-0f64cc-plain.raw.json |
| conversations-0f64cc-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.de3cb2a3e8fe576a5d0908f4e00f64cc&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-29-conversations-0f64cc-before.raw.json |
| conversations-c695f9-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.fb3eab135970d880d59c5fad1bc695f9&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe2-30-conversations-c695f9-plain.raw.json |
| conversations-c695f9-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.fb3eab135970d880d59c5fad1bc695f9&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe2-31-conversations-c695f9-before.raw.json |
| messages-99b03d-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.1561582483b8a511147478d8c099b03d&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…)` | probe2-32-messages-99b03d-plain.raw.json |
| messages-99b03d-before | 200 | elements=1 first=1789129876484 last=1789129876484 metadata={"nextCursor":"QVNDRU5ESU5HJjE3ODkxMjk4NzY0ODQmMi1NVGM0T1RFeU9UZzNOalE0TkdJNU56SXpOQzB4TURBbVpXRXhZbUV5TXpNdE16SmtaQzAwT | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.1561582483b8a511147478d8c099b03d&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,deliveredAt:1789222717953,count:20)` | probe2-33-messages-99b03d-before.raw.json |
| messages-007c60-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5604b0605ca53ed7ca9071ec11007c60&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…)` | probe2-34-messages-007c60-plain.raw.json |
| messages-007c60-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5604b0605ca53ed7ca9071ec11007c60&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,deliveredAt:1789222726581,count:20)` | probe2-35-messages-007c60-before.raw.json |
| messages-f9799f-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.b2da9490a1aee637ef1f5c8576f9799f&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…)` | probe2-36-messages-f9799f-plain.raw.json |
| messages-f9799f-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.b2da9490a1aee637ef1f5c8576f9799f&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,deliveredAt:1789222734901,count:20)` | probe2-37-messages-f9799f-before.raw.json |
| messages-b7c977-plain | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.d8ea76885a52fd5dc5c317078ab7c977&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…)` | probe2-38-messages-b7c977-plain.raw.json |
| messages-b7c977-before | 200 | elements=- first=- last=- metadata=null | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.d8ea76885a52fd5dc5c317078ab7c977&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A%28urn%3Ali%3Afsd_profile%3AACoAA…%2C2-…,deliveredAt:1789222743242,count:20)` | probe2-39-messages-b7c977-before.raw.json |
