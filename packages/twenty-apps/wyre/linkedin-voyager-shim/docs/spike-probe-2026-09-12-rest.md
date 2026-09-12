# Probe 2026-09-12

| Probe | Status | Summary | Path | File |
|---|---|---|---|---|
| me | 200 | keys=data,included data=plainId,publicContactInfo,premiumSubscriber,*miniProfile,$type elements=- included=1 | `/voyager/api/me` | probe-01-me.raw.json |
| messenger-conversations-default | 200 | keys=data data=_recipeType,_type,messengerConversationsBySyncToken elements=20 included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe-02-messenger-conversations-default.raw.json |
| messenger-conversations-count | 200 | keys=data data=_recipeType,_type,messengerConversationsBySyncToken elements=20 included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,count:40)` | probe-03-messenger-conversations-count.raw.json |
| messenger-conversations-before | 200 | keys=data data=_recipeType,_type,messengerConversationsBySyncToken elements=20 included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…,lastUpdatedBefore:1787220204049,count:20)` | probe-04-messenger-conversations-before.raw.json |
| messenger-messages-default | 400 | keys=status data=status elements=- included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A(urn%3Ali%3Afsd_profile%3AACoAA…%2C2-ZWExYmEyMzMtMzJkZC00MjcyLThlZmMtZDQ3M2UxZjIyNGEyXzEwMA%3D%3D))` | probe-05-messenger-messages-default.raw.json |
| messenger-messages-count | 400 | keys=status data=status elements=- included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A(urn%3Ali%3Afsd_profile%3AACoAA…%2C2-ZWExYmEyMzMtMzJkZC00MjcyLThlZmMtZDQ3M2UxZjIyNGEyXzEwMA%3D%3D),count:20)` | probe-06-messenger-messages-count.raw.json |
| messenger-messages-before | 400 | keys=status data=status elements=- included=- | `/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMessages.5846eeb71c981f11e0134cb6626cc314&variables=(conversationUrn:urn%3Ali%3Amsg_conversation%3A(urn%3Ali%3Afsd_profile%3AACoAA…%2C2-ZWExYmEyMzMtMzJkZC00MjcyLThlZmMtZDQ3M2UxZjIyNGEyXzEwMA%3D%3D),deliveredAt:1789221164170,count:20)` | probe-07-messenger-messages-before.raw.json |
| dash-connections-deco16 | 200 | keys=data,included data=entityUrn,paging,*elements,$type elements=40 included=79 | `/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-16&count=40&q=search&sortType=RECENTLY_ADDED&start=0` | probe-08-dash-connections-deco16.raw.json |
| dash-connections-nodeco | 200 | keys=data,included data=entityUrn,paging,*elements,$type elements=40 included=40 | `/voyager/api/relationships/dash/connections?count=40&q=search&sortType=RECENTLY_ADDED&start=0` | probe-09-dash-connections-nodeco.raw.json |
| legacy-connections | 200 | keys=data,included data=metadata,entityUrn,paging,*elements,$type elements=39 included=78 | `/voyager/api/relationships/connections?start=0&count=40&sortType=RECENTLY_ADDED` | probe-10-legacy-connections.raw.json |
| sent-invitations-v2 | 200 | keys=data,included data=metadata,entityUrn,paging,*elements,$type elements=100 included=301 | `/voyager/api/relationships/sentInvitationViewsV2?invitationType=CONNECTION&q=invitationType&start=0&count=100` | probe-11-sent-invitations-v2.raw.json |
| received-invitations | 200 | keys=data,included data=metadata,entityUrn,elements,paging,$type elements=0 included=0 | `/voyager/api/relationships/invitationViews?q=receivedInvitation&start=0&count=10&includeInsights=true` | probe-12-received-invitations.raw.json |
| dash-sent-invitations | 404 | keys=status data=status elements=- included=- | `/voyager/api/relationships/dash/sentInvitationViews?q=invitationType&invitationType=CONNECTION&start=0&count=100` | probe-13-dash-sent-invitations.raw.json |
| dash-profile-by-id-full | 200 | keys=data,included data=entityUrn,paging,*elements,$type elements=1 included=85 | `/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=ACoAA…&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-101` | probe-14-dash-profile-by-id-full.raw.json |
| dash-profile-by-id-nodeco | 200 | keys=data,included data=entityUrn,paging,*elements,$type elements=1 included=1 | `/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=ACoAA…` | probe-15-dash-profile-by-id-nodeco.raw.json |
| dash-profile-by-slug | 200 | keys=data,included data=entityUrn,paging,*elements,$type elements=1 included=102 | `/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=gonzalo-astudillo&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-101` | probe-16-dash-profile-by-slug.raw.json |
| dash-member-relationship | 200 | keys=data,included data=memberRelationshipUnion,entityUrn,memberRelationshipData,$type elements=- included=0 | `/voyager/api/voyagerRelationshipsDashMemberRelationships/urn%3Ali%3Afsd_memberRelationship%3AACoAA…` | probe-17-dash-member-relationship.raw.json |
| legacy-networkinfo | 410 | keys=data,included data=status elements=- included=0 | `/voyager/api/identity/profiles/ACoAA…/networkinfo` | probe-18-legacy-networkinfo.raw.json |

## People search (network=F) captures

| Status | URL | File |
|---|---|---|
| 200 | `https://www.linkedin.com/voyager/api/premium/featureAccess?name=reactivationFeaturesEligible` | probe-search-01.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerGlobalAlerts?adHocAlerts=true&alertWithActions=true&q=findAlerts` | probe-search-02.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerSegmentsDashChameleonConfig` | probe-search-03.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/me` | probe-search-04.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=()&queryId=voyagerFeedDashGlobalNavs.a618d03c522276ae43e2ecc891d11cf2` | probe-search-05.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(memberIdentity:ACoAA…)&queryId=voyagerIdentityDashProfiles.b5c27c04968c409fc0ed3546575b9b7a` | probe-search-06.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&queryId=voyagerFeedDashThirdPartyIdSyncs.e9d3044f7ad311ff359561b405629210` | probe-search-07.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=()&queryId=voyagerJobsDashJobSeekerPreferences.53d4a0b454b82ce339abf8afc2c65190` | probe-search-08.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=()&queryId=voyagerDashMySettings.8fdc6cac2e41f88f83e8d17dc78ac26c` | probe-search-09.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(pageKey:messaging_realtime,slotId:onboarding)&queryId=voyagerLegoDashPageContents.6e5607181411f5835938e105d18564e2` | probe-search-10.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(pageKey:messaging_presence,slotId:onboarding)&queryId=voyagerLegoDashPageContents.6e5607181411f5835938e105d18564e2` | probe-search-11.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(featureAccessTypes:List(CAN_ACCESS_RECRUITER_MAILBOX,CAN_ACCESS_HIRING_MANAGER_MAILBOX))&queryId=voyagerPremiumDashFeatureAccess.c87b20dac35795f9920f2a8072fd7af5` | probe-search-12.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(featureAccessTypes:List(CAN_ACCESS_AWAY_MESSAGES))&queryId=voyagerPremiumDashFeatureAccess.c87b20dac35795f9920f2a8072fd7af5` | probe-search-13.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=()&queryId=voyagerMessagingDashMessagingSettings.a555e413ad439d1d3f58ceef31ff0728` | probe-search-14.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerOrganizationDashPageMailbox/?count=3&q=admin` | probe-search-15.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(featureAccessTypes:List(CAN_ACCESS_SALES_NAV_BADGE,CAN_ACCESS_ADVERTISE_BADGE))&queryId=voyagerPremiumDashFeatureAccess.c87b20dac35795f9920f2a8072fd7af5` | probe-search-16.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&queryId=voyagerMessagingDashAwayStatusV2.ee0ba3add6f8a58c35df3e08daa87b11` | probe-search-17.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&queryId=voyagerMessagingDashAffiliatedMailboxes.aef223806c4270935ab6bdebfda1695d` | probe-search-18.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerNotificationsDashBadgingItemCounts` | probe-search-19.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/messaging/dash/presenceStatuses` | probe-search-20.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerIdentityDashNotificationCards?decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollectionWithInjectionsNoPills-24&count=10&q=filterVanityName` | probe-search-21.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerConversations.0d5e6781bbee71c3e51c8843c6519f48&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe-search-22.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerMessagingDashConversationNudges` | probe-search-23.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerMessagingDashSecondaryInbox?q=previewBanner` | probe-search-24.raw.json |
| 200 | `https://www.linkedin.com/voyager/api/voyagerMessagingGraphQL/graphql?queryId=messengerMailboxCounts.fc528a5a81a76dff212a4a3d2d48e84b&variables=(mailboxUrn:urn%3Ali%3Afsd_profile%3AACoAA…)` | probe-search-25.raw.json |
