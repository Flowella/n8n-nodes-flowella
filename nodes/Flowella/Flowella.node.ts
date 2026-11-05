import type { INodeProperties, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { flowellaRoutes } from './generated/routes';

const listOutput = {
	postReceive: [
		{
			type: 'rootProperty' as const,
			properties: {
				property: 'items',
			},
		},
	],
};

const listPagination = {
	pagination: {
		type: 'generic' as const,
		properties: {
			continue: '={{$parameter["returnAll"] === true && !!$response.body?.nextCursor}}',
			request: {
				qs: {
					cursor: '={{$response.body.nextCursor}}',
				},
			},
		},
	},
};

function shown(resource: string, operation: string): INodeProperties['displayOptions'] {
	return { show: { resource: [resource], operation: [operation] } };
}

function queryValue(name: string): string {
	return `={{$parameter["${name}"] || undefined}}`;
}

export class Flowella implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Flowella',
		name: 'flowella',
		icon: { light: 'file:flowella.svg', dark: 'file:flowella.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Send WhatsApp messages and manage contacts, templates, and opt-outs in Flowella',
		defaults: { name: 'Flowella' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'flowellaApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Message', value: 'message' },
					{ name: 'Template', value: 'template' },
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send a message',
						routing: {
							request: {
								method: 'POST',
								url: flowellaRoutes.messageSend.path,
								body: '={{({ to: $parameter["to"], text: $parameter["text"], ...($parameter["whatsappChannelId"] ? { whatsappChannelId: $parameter["whatsappChannelId"] } : {}) })}}',
							},
						},
					},
				],
				default: 'send',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['conversation'] } },
				options: [
					{
						name: 'List',
						value: 'list',
						action: 'List conversations',
						routing: {
							request: {
								method: 'GET',
								url: flowellaRoutes.conversationList.path,
								qs: {
									limit: '={{$parameter["returnAll"] ? 100 : $parameter["limit"]}}',
									cursor: queryValue('cursor'),
									createdAfter: queryValue('createdAfter'),
									updatedAfter: queryValue('updatedAfter'),
									deletedAfter: queryValue('deletedAfter'),
									sort: queryValue('sort'),
									order: queryValue('order'),
									status: queryValue('status'),
								},
							},
							operations: listPagination,
							output: listOutput,
						},
					},
				],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{
						name: 'List',
						value: 'list',
						action: 'List contacts',
						routing: {
							request: {
								method: 'GET',
								url: flowellaRoutes.contactList.path,
								qs: {
									limit: '={{$parameter["returnAll"] ? 100 : $parameter["limit"]}}',
									cursor: queryValue('cursor'),
									createdAfter: queryValue('createdAfter'),
									updatedAfter: queryValue('updatedAfter'),
									deletedAfter: queryValue('deletedAfter'),
									sort: queryValue('sort'),
									order: queryValue('order'),
									externalId: queryValue('externalId'),
								},
							},
							operations: listPagination,
							output: listOutput,
						},
					},
					{
						name: 'Create or Update',
						value: 'upsert',
						action: 'Create or update a contact',
						routing: {
							request: {
								method: 'POST',
								url: flowellaRoutes.contactUpsert.path,
								body: '={{ Object.fromEntries(Object.entries({ phone: $parameter["phone"], name: $parameter["name"], email: $parameter["email"], waId: $parameter["waId"], externalId: $parameter["externalId"] }).filter(([, value]) => value !== "" && value !== undefined)) }}',
							},
						},
					},
					{
						name: 'Set or Clear Opt-Out',
						value: 'optOut',
						action: 'Set or clear an opt out',
						routing: {
							request: {
								method: 'POST',
								url: flowellaRoutes.optOut.path,
								body: '={{ ({ action: $parameter["action"], whatsappChannelId: $parameter["whatsappChannelId"], phone: $parameter["phone"], ...($parameter["action"] === "set" && $parameter["reason"] ? { reason: $parameter["reason"] } : {}) }) }}',
							},
						},
					},
				],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['template'] } },
				options: [
					{
						name: 'List',
						value: 'list',
						action: 'List templates',
						routing: {
							request: {
								method: 'GET',
								url: flowellaRoutes.templateList.path,
								qs: {
									limit: '={{$parameter["returnAll"] ? 100 : $parameter["limit"]}}',
									cursor: queryValue('cursor'),
									status: queryValue('status'),
									search: queryValue('search'),
									whatsappChannelId: queryValue('whatsappChannelId'),
								},
							},
							operations: listPagination,
							output: listOutput,
						},
					},
					{
						name: 'Send',
						value: 'send',
						action: 'Send a template',
						routing: {
							request: {
								method: 'POST',
								url: flowellaRoutes.templateSend.path,
								body: '={{ Object.fromEntries(Object.entries({ templateId: $parameter["templateId"], templateWabaId: $parameter["templateWabaId"], whatsappChannelId: $parameter["whatsappChannelId"], scheduledAt: $parameter["scheduledAt"], throttlePerHour: $parameter["throttlePerHour"] || undefined, headerMedia: $parameter["headerMedia"] ? JSON.parse($parameter["headerMedia"]) : undefined, carouselCards: $parameter["carouselCards"] ? JSON.parse($parameter["carouselCards"]) : undefined, recipients: ($parameter["recipients"]?.recipient ?? []).map((row) => ({ phone: row.phone, bodyParameters: (row.variables?.variable ?? []).map((item) => item.value) })) }).filter(([, value]) => value !== "" && value !== undefined && !(Array.isArray(value) && value.length === 0))) }}',
							},
						},
					},
				],
				default: 'list',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['analytics'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get analytics',
						routing: {
							request: {
								method: 'GET',
								url: flowellaRoutes.analyticsGet.path,
								qs: {
									startDate: queryValue('startDate'),
									endDate: queryValue('endDate'),
								},
							},
						},
					},
				],
				default: 'get',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				placeholder: '+15551234567',
				description: 'Destination phone number in E.164 format',
				displayOptions: shown('message', 'send'),
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				default: '',
				required: true,
				typeOptions: { rows: 3 },
				displayOptions: shown('message', 'send'),
			},
			{
				displayName: 'WhatsApp Channel ID',
				name: 'whatsappChannelId',
				type: 'string',
				default: '',
				description: 'Flowella channel ID. Required for opt-out and template send. Optional for a text message when the org has one channel.',
				displayOptions: {
					show: {
						resource: ['message', 'contact', 'template'],
						operation: ['send', 'optOut', 'list'],
					},
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: { resource: ['conversation', 'contact', 'template'], operation: ['list'] },
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				description: 'Max number of results to return',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
				displayOptions: {
					show: {
						resource: ['conversation', 'contact', 'template'],
						operation: ['list'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'NextCursor from a previous page. Ignored while Return All is on after the first page.',
				displayOptions: {
					show: { resource: ['conversation', 'contact', 'template'], operation: ['list'] },
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: '',
				description: 'Conversation status (OPEN, CLOSED, PENDING, ARCHIVED, SNOOZED) or template status (DRAFT, PENDING, APPROVED, REJECTED, PAUSED, DISABLED)',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Approved', value: 'APPROVED' },
					{ name: 'Archived', value: 'ARCHIVED' },
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'Disabled', value: 'DISABLED' },
					{ name: 'Draft', value: 'DRAFT' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Paused', value: 'PAUSED' },
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Rejected', value: 'REJECTED' },
					{ name: 'Snoozed', value: 'SNOOZED' },
				],
				displayOptions: {
					show: { resource: ['conversation', 'template'], operation: ['list'] },
				},
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: '',
				options: [
					{ name: 'Default', value: '' },
					{ name: 'Created At', value: 'createdAt' },
					{ name: 'Updated At', value: 'updatedAt' },
				],
				displayOptions: { show: { resource: ['conversation', 'contact'], operation: ['list'] } },
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				default: '',
				options: [
					{ name: 'Default', value: '' },
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				displayOptions: { show: { resource: ['conversation', 'contact'], operation: ['list'] } },
			},
			{
				displayName: 'Created After',
				name: 'createdAfter',
				type: 'string',
				default: '',
				description: 'ISO-8601 timestamp',
				displayOptions: { show: { resource: ['conversation', 'contact'], operation: ['list'] } },
			},
			{
				displayName: 'Updated After',
				name: 'updatedAfter',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['conversation', 'contact'], operation: ['list'] } },
			},
			{
				displayName: 'Deleted After',
				name: 'deletedAfter',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['conversation', 'contact'], operation: ['list'] } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['contact'], operation: ['list', 'upsert'] },
				},
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				placeholder: '+15551234567',
				displayOptions: { show: { resource: ['contact'], operation: ['upsert', 'optOut'] } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: shown('contact', 'upsert'),
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@example.com',
				displayOptions: shown('contact', 'upsert'),
			},
			{
				displayName: 'WhatsApp ID',
				name: 'waId',
				type: 'string',
				default: '',
				displayOptions: shown('contact', 'upsert'),
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{ name: 'Set', value: 'set' },
					{ name: 'Clear', value: 'clear' },
				],
				default: 'set',
				displayOptions: shown('contact', 'optOut'),
			},
			{
				displayName: 'Reason',
				name: 'reason',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['contact'], operation: ['optOut'], action: ['set'] } },
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				displayOptions: shown('template', 'list'),
			},
			{
				displayName: 'Template',
				name: 'templateId',
				type: 'options',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: flowellaRoutes.templateList.path,
								qs: { limit: 100 },
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty' as const,
										properties: { property: 'items' },
									},
									{
										type: 'setKeyValue' as const,
										properties: {
											name: '={{$responseItem.name}} ({{$responseItem.language}})',
											value: '={{$responseItem.id}}',
										},
									},
									{
										type: 'sort' as const,
										properties: { key: 'name' },
									},
								],
							},
						},
					},
				},
				default: '',
				description: 'Templates from GET /v1/templates. Pick by name; the value is the Flowella template ID.',
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Template WABA ID',
				name: 'templateWabaId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Recipients',
				name: 'recipients',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Each recipient is a phone number plus template body variables, in order',
				displayOptions: shown('template', 'send'),
				options: [
					{
						name: 'recipient',
						displayName: 'Recipient',
						values: [
							{
								displayName: 'Phone',
								name: 'phone',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Variables',
								name: 'variables',
								type: 'fixedCollection',
								typeOptions: { multipleValues: true },
								default: {},
								options: [
									{
										name: 'variable',
										displayName: 'Variable',
										values: [
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												description: 'Mapped to bodyParameters in template order',
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Header Media',
				name: 'headerMedia',
				type: 'string',
				default: '',
				description: 'Optional JSON object with URL and fileName for a media header',
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Carousel Cards',
				name: 'carouselCards',
				type: 'string',
				default: '',
				description: 'Optional JSON array of carousel cards, sent as carouselCards',
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Scheduled At',
				name: 'scheduledAt',
				type: 'string',
				default: '',
				description: 'ISO-8601 time to send later. Leave empty to send now.',
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Throttle Per Hour',
				name: 'throttlePerHour',
				type: 'number',
				default: 0,
				description: 'Optional send rate. 0 omits throttlePerHour.',
				displayOptions: shown('template', 'send'),
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				description: 'ISO-8601 start of the analytics window',
				displayOptions: shown('analytics', 'get'),
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				displayOptions: shown('analytics', 'get'),
			},
		],
	};
}
