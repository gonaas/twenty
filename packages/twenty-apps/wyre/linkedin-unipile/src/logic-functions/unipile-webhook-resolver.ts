import { isNonEmptyString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import {
  kv,
  Response,
  type ServerRouteResolverResult,
} from 'twenty-sdk/logic-function';

import { buildUnipileAccountClaimKvKey } from 'src/constants/kv-keys';
import { UNIPILE_WEBHOOK_SECRET_ENV_VAR_NAME } from 'src/constants/server-variables';
import {
  PROCESS_UNIPILE_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  UNIPILE_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { timingSafeEqualStrings } from 'src/logic-functions/utils/timing-safe-equal-strings.util';

type UnipileWebhookBody = { account_id?: string };

export const unipileWebhookResolverHandler = async (
  routePayload: RoutePayload<UnipileWebhookBody>,
): Promise<ServerRouteResolverResult> => {
  const webhookSecret = process.env[UNIPILE_WEBHOOK_SECRET_ENV_VAR_NAME];

  if (!isNonEmptyString(webhookSecret)) {
    return new Response(
      { error: 'UNIPILE_WEBHOOK_SECRET is not configured' },
      { status: 500 },
    );
  }

  const providedSecret = routePayload.headers['unipile-auth'];

  if (
    !isNonEmptyString(providedSecret) ||
    !timingSafeEqualStrings(providedSecret, webhookSecret)
  ) {
    return new Response({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  const body = routePayload.body;

  if (body === null || body === undefined) {
    return new Response({ error: 'Webhook payload was empty' }, { status: 400 });
  }

  const accountId = body.account_id;

  if (!isNonEmptyString(accountId)) {
    return new Response(
      { error: 'Webhook payload is missing account_id' },
      { status: 400 },
    );
  }

  const workspaceId = await kv.get<string>(
    buildUnipileAccountClaimKvKey(accountId),
    { scope: 'SERVER' },
  );

  if (!isNonEmptyString(workspaceId)) {
    return new Response({ error: 'Unknown Unipile account' }, { status: 404 });
  }

  return {
    workspaceId,
    targetLogicFunctionUniversalIdentifier:
      PROCESS_UNIPILE_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
    payload: body,
  };
};

export default defineLogicFunction({
  universalIdentifier: UNIPILE_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'unipile-webhook-resolver',
  description:
    'Verifies the Unipile-Auth secret and resolves the target workspace for the matching Unipile account.',
  timeoutSeconds: 15,
  handler: unipileWebhookResolverHandler,
  serverRouteTriggerSettings: {
    httpMethods: ['POST'],
    forwardedRequestHeaders: ['unipile-auth'],
  },
});
