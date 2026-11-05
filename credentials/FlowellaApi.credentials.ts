import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FlowellaApi implements ICredentialType {
	name = 'flowellaApi';

	icon = { light: 'file:flowella.svg', dark: 'file:flowella.dark.svg' } as const;

	displayName = 'Flowella API';

	documentationUrl = 'https://knowledge.flowella.io/api-reference/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Organisation API key (flo_…). Create it in Flowella under Settings → API keys.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.flowella.io',
			description:
				'Flowella API host. Leave the default for production. Override it for staging or a self-hosted test.',
		},
		{
			displayName: 'Webhook Signing Secret',
			name: 'webhookSigningSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Signing secret of the Flowella webhook endpoint. Required by the Flowella Trigger to verify X-Flowella-Signature. The action node ignores this field.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}',
			url: '/v1/ping',
			method: 'GET',
		},
	};
}
