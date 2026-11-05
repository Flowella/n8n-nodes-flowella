import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { verifyFlowellaSignature } from './verify-signature';

/** Live product events from Flowella outbound webhooks, plus the Settings test event. */
export const FLOWELLA_TRIGGER_EVENTS = [
	'message.received',
	'message.sent',
	'message.delivered',
	'message.read',
	'message.failed',
	'conversation.opened',
	'conversation.closed',
	'optout.created',
	'template.status_updated',
	'contact.created',
	'contact.updated',
	'contact.deleted',
] as const;

const TEST_EVENT = 'webhook.test';

function unauthorized(): IWebhookResponseData {
	return {
		workflowData: [[]],
		webhookResponse: {
			statusCode: 401,
			body: { error: 'Invalid Flowella webhook signature' },
		},
	};
}

function ignored(): IWebhookResponseData {
	return {
		workflowData: [[]],
		webhookResponse: { statusCode: 200, body: { ok: true, ignored: true } },
	};
}

export class FlowellaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Flowella Trigger',
		name: 'flowellaTrigger',
		icon: { light: 'file:flowella.svg', dark: 'file:flowella.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{($parameter["events"] || []).join(", ") || "all events"}}',
		description:
			'Starts a workflow when Flowella sends a webhook. In Flowella open your organisation, then Settings → Webhooks (https://app.flowella.io, path /{organisation}/settings/webhooks). Paste the production URL from this node and select events there. This node filters again locally. Flowella waits 10 seconds, retries 3 times, and disables the endpoint after 10 consecutive failures, so a paused workflow can turn the endpoint off.',
		defaults: { name: 'Flowella Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'flowellaApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'flowella',
			},
		],
		properties: [
			{
				displayName:
					'Manual registration. In Flowella, open Settings → Webhooks, paste the webhook URL shown on this node, and select events. Put the endpoint signing secret in the Flowella API credential. A paused n8n workflow returns errors; after 10 consecutive failures Flowella disables the endpoint (10s timeout, 3 attempts).',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: FLOWELLA_TRIGGER_EVENTS.map((event) => ({ name: event, value: event })),
				default: [],
				description:
					'Events to emit. Leave empty to emit every event Flowella delivers. webhook.test from the Settings test button is always emitted.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject() as { rawBody?: Buffer | string };
		const rawBody =
			typeof req.rawBody === 'string'
				? req.rawBody
				: Buffer.isBuffer(req.rawBody)
					? req.rawBody.toString('utf8')
					: '';
		if (!rawBody) return unauthorized();

		const credentials = await this.getCredentials('flowellaApi');
		const secret = String(credentials.webhookSigningSecret ?? '');
		const headers = this.getHeaderData();
		const signature = headers['x-flowella-signature'];
		const signatureValue = Array.isArray(signature) ? signature[0] : signature;
		if (!verifyFlowellaSignature(signatureValue, secret, rawBody)) return unauthorized();

		const body = JSON.parse(rawBody) as IDataObject;
		const eventType = String(body.type ?? '');
		const selected = this.getNodeParameter('events', []) as string[];
		const allowed =
			eventType === TEST_EVENT || selected.length === 0 || selected.includes(eventType);
		if (!allowed) return ignored();

		const data = (body.data ?? {}) as IDataObject;
		return {
			workflowData: [
				[
					{
						json: {
							eventType,
							eventId: body.id ?? null,
							occurredAt: body.occurred_at ?? body.created_at ?? null,
							organizationId: data.organizationId ?? data.organization_id ?? null,
							conversationId: data.conversationId ?? data.conversation_id ?? null,
							contactId: data.contactId ?? data.contact_id ?? null,
							contactPhone: data.phone ?? data.from ?? null,
							messageBody: data.text ?? data.body ?? null,
							data,
						},
					},
				],
			],
		};
	}
}
