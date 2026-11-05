# n8n-nodes-flowella

Community node for [n8n](https://n8n.io/) that connects [Flowella](https://flowella.io) WhatsApp messaging to a workflow.

It talks to the public Flowella REST API (`flowellaApiContract` in `package.json`, currently generated from OpenAPI 1.1.0) and to Flowella outbound webhooks. The node does not embed n8n.

## Installation

In n8n, open **Settings → Community Nodes** and install `n8n-nodes-flowella`.

On a self-hosted instance you can also install the npm package into `~/.n8n/nodes` and restart n8n.

This package compiles against `n8n-workflow` 2.46.5, which `@n8n/node-cli` 0.55 installs. The node API version is `n8nNodesApiVersion` 1.

## Credentials

1. In Flowella, open **Settings → API keys** and create an organisation key. It starts with `flo_`.
2. In n8n, create a **Flowella API** credential.
3. Paste the key. Leave **Base URL** as `https://api.flowella.io` unless you are calling staging.
4. For the trigger, paste the webhook **signing secret** from the Flowella webhook endpoint into **Webhook Signing Secret**.

The credential test calls `GET /v1/ping`. A valid key returns the organisation id. An invalid key fails with the API error message (401).

## Trigger

The trigger does not create the webhook for you. Flowella webhook endpoints are managed in the product UI.

1. Add **Flowella Trigger** and open it. n8n shows a production webhook URL.
2. In Flowella, open [the app](https://app.flowella.io), then your organisation, then **Settings → Webhooks** (`/{organisation}/settings/webhooks`). Paste that URL and select the events you want delivered.
3. Copy the endpoint signing secret into the n8n credential.
4. Use **Send test** in Flowella Settings. The node emits a `webhook.test` item.

Leave **Events** empty to emit every delivered event. A selected list drops other product events with HTTP 200 and does not start the workflow. A bad signature returns HTTP 401 and does not start the workflow.

Flowella waits 10 seconds, tries the request 3 times, and disables the endpoint after 10 consecutive failures. A paused n8n workflow can therefore turn the endpoint off.

### Events

`message.received`, `message.sent`, `message.delivered`, `message.read`, `message.failed`, `conversation.opened`, `conversation.closed`, `optout.created`, `template.status_updated`, `contact.created`, `contact.updated`, `contact.deleted`, and the synthetic `webhook.test`.

Each item has `eventType`, `eventId`, `occurredAt`, `organizationId`, `conversationId`, `contactId`, `contactPhone`, `messageBody`, and the original `data` object.

Every delivery uses the same envelope. `data` is the part that changes.

`message.received`

```json
{
	"id": "evt_1",
	"type": "message.received",
	"occurred_at": "2026-11-05T04:00:00.000Z",
	"version": "1.1.0",
	"data": {
		"organizationId": "clorg",
		"conversationId": "clconv",
		"contactId": "clcontact",
		"phone": "+15551234567",
		"text": "Hello"
	}
}
```

`message.sent`

```json
{
	"id": "evt_2",
	"type": "message.sent",
	"occurred_at": "2026-11-05T04:00:01.000Z",
	"version": "1.1.0",
	"data": {
		"organizationId": "clorg",
		"conversationId": "clconv",
		"messageId": "clmsg",
		"text": "Hello"
	}
}
```

`message.delivered`

```json
{
	"id": "evt_3",
	"type": "message.delivered",
	"occurred_at": "2026-11-05T04:00:02.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "conversationId": "clconv", "messageId": "clmsg" }
}
```

`message.read`

```json
{
	"id": "evt_4",
	"type": "message.read",
	"occurred_at": "2026-11-05T04:00:03.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "conversationId": "clconv", "messageId": "clmsg" }
}
```

`message.failed`

```json
{
	"id": "evt_5",
	"type": "message.failed",
	"occurred_at": "2026-11-05T04:00:04.000Z",
	"version": "1.1.0",
	"data": {
		"organizationId": "clorg",
		"conversationId": "clconv",
		"messageId": "clmsg",
		"text": "Recipient is not on WhatsApp"
	}
}
```

`conversation.opened`

```json
{
	"id": "evt_6",
	"type": "conversation.opened",
	"occurred_at": "2026-11-05T04:00:05.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "conversationId": "clconv", "contactId": "clcontact" }
}
```

`conversation.closed`

```json
{
	"id": "evt_7",
	"type": "conversation.closed",
	"occurred_at": "2026-11-05T04:00:06.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "conversationId": "clconv" }
}
```

`optout.created`

```json
{
	"id": "evt_8",
	"type": "optout.created",
	"occurred_at": "2026-11-05T04:00:07.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "phone": "+15551234567", "contactId": "clcontact" }
}
```

`template.status_updated`

```json
{
	"id": "evt_9",
	"type": "template.status_updated",
	"occurred_at": "2026-11-05T04:00:08.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "templateId": "cltpl", "status": "APPROVED" }
}
```

`contact.created`

```json
{
	"id": "evt_10",
	"type": "contact.created",
	"occurred_at": "2026-11-05T04:00:09.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "contactId": "clcontact", "phone": "+15551234567" }
}
```

`contact.updated`

```json
{
	"id": "evt_11",
	"type": "contact.updated",
	"occurred_at": "2026-11-05T04:00:10.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "contactId": "clcontact", "phone": "+15551234567" }
}
```

`contact.deleted`

```json
{
	"id": "evt_12",
	"type": "contact.deleted",
	"occurred_at": "2026-11-05T04:00:11.000Z",
	"version": "1.1.0",
	"data": { "organizationId": "clorg", "contactId": "clcontact" }
}
```

`webhook.test` is the Settings test button. It can use the legacy envelope:

```json
{
	"id": "evt_test",
	"type": "webhook.test",
	"created_at": "2026-11-05T04:00:00.000Z",
	"payload_version": "legacy",
	"data": { "test": true, "sentAt": "2026-11-05T04:00:00.000Z" }
}
```

## Operations

| Resource     | Operation            | API                       |
| ------------ | -------------------- | ------------------------- |
| Message      | Send                 | `POST /v1/messages`       |
| Conversation | List                 | `GET /v1/conversations`   |
| Contact      | List                 | `GET /v1/contacts`        |
| Contact      | Create or Update     | `POST /v1/contacts`       |
| Contact      | Set or Clear Opt-out | `POST /v1/opt-outs`       |
| Template     | List                 | `GET /v1/templates`       |
| Template     | Send                 | `POST /v1/templates/send` |
| Analytics    | Get                  | `GET /v1/analytics`       |

List operations follow `nextCursor` when **Return All** is on, otherwise they send `limit`. Template send takes recipients with ordered body variables. The template dropdown is filled from `GET /v1/templates`.

API errors are `NodeApiError`s with a fixed English message for 400, 401, 402, 403, 404, and 429. The Flowella `error.message` is included when the body has one. 429 tells you to enable **Retry On Fail** on the node.

## Example

`examples/inbound-then-template.workflow.json` listens for `message.received` and sends a template. Import it with **Workflows → Import from file**. You still need a Flowella API credential and a real template id.

A written walkthrough is in `examples/inbound-then-template.md`.

## Contract drift

`npm run generate` refreshes `nodes/Flowella/generated/` from `https://api.flowella.io/v1/openapi.json`. Set `FLOWELLA_OPENAPI_URL` to point the same script at staging. CI and a daily workflow fail when the committed contract differs.

## Verification

Submit from the [n8n Creator Portal](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/) only after a stable (not prerelease) version is on npm with a provenance badge, the GitHub repo is public, `dependencies` is empty, and `npx @n8n/scan-community-package n8n-nodes-flowella` prints that the package passed. The publish workflow runs that scan after each tag.

## License and support

[MIT](LICENSE). Copyright Discover Digital.

Support: [GitHub issues](https://github.com/Flowella/n8n-nodes-flowella/issues) or taha.durmus@discoverdigital.com.
